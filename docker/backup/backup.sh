#!/bin/sh
# Nightly database backup.
#
# 1. Dumps the whole database with pg_dump.
# 2. Uploads the dump to the backups bucket as db/db-<UTC time>.dump.
# 3. Restores it into a scratch database (backup_check) to prove it can be
#    restored, prints the row count of every table, then drops the scratch database.
# 4. Deletes dumps older than KEEP_DAYS (default 14), only after 1–3 succeeded.
#
# Any failure stops the script with a non-zero exit, which Railway shows as a
# failed cron run. Restoring a dump by hand: see the README ("Database backups").
#
# Environment: DATABASE_URL, and the bucket's BUCKET, ENDPOINT, ACCESS_KEY_ID,
# SECRET_ACCESS_KEY, REGION (Railway variable references). Optional: KEEP_DAYS,
# S3_ADDRESSING_STYLE (virtual for Railway buckets, path for a local MinIO test).
set -eu

: "${DATABASE_URL:?Missing DATABASE_URL}"
: "${BUCKET:?Missing BUCKET}"
: "${ENDPOINT:?Missing ENDPOINT}"
: "${ACCESS_KEY_ID:?Missing ACCESS_KEY_ID}"
: "${SECRET_ACCESS_KEY:?Missing SECRET_ACCESS_KEY}"
KEEP_DAYS="${KEEP_DAYS:-14}"

export AWS_ACCESS_KEY_ID="$ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="${REGION:-auto}"
aws configure set default.s3.addressing_style "${S3_ADDRESSING_STYLE:-virtual}"

s3() { aws s3 "$@" --endpoint-url "$ENDPOINT" --only-show-errors; }

stamp=$(date -u +%Y-%m-%dT%H%MZ)
file="/tmp/db-$stamp.dump"
key="db/db-$stamp.dump"
check_db="backup_check"
# Same server and user, other database name. Railway's passwords have no "/" or "?".
check_url=$(printf '%s' "$DATABASE_URL" | sed -E "s#/([^/?]+)(\\?|\$)#/$check_db\\2#")

cleanup() {
  rm -f "$file"
  psql "$DATABASE_URL" -q -c "DROP DATABASE IF EXISTS $check_db" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Dumping the database..."
pg_dump --format=custom --no-owner --no-privileges --file="$file" "$DATABASE_URL"
size=$(wc -c < "$file" | tr -d ' ')
echo "Dump: $size bytes."

echo "Uploading $key..."
s3 cp "$file" "s3://$BUCKET/$key"

echo "Restore check into $check_db..."
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $check_db" -c "CREATE DATABASE $check_db"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$check_url" "$file"
tables=$(psql "$check_url" -At -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
live_tables=$(psql "$DATABASE_URL" -At -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
if [ "$tables" != "$live_tables" ]; then
  echo "Restore check failed: $tables tables restored, the database has $live_tables." >&2
  exit 1
fi
psql "$check_url" -At -F ' ' -c "
  SELECT 'restored ' || table_name || ': ' ||
         (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM public.%I', table_name), false, true, '')))[1]::text || ' rows'
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'
  ORDER BY table_name"
echo "Restore check passed: $tables tables."

cutoff=$(date -u -d "@$(( $(date +%s) - KEEP_DAYS * 86400 ))" +%Y-%m-%d)
old=$(aws s3 ls "s3://$BUCKET/db/" --endpoint-url "$ENDPOINT" \
  | awk -v c="$cutoff" '$4 ~ /^db-[0-9-]+T[0-9]+Z\.dump$/ && substr($4, 4, 10) < c { print $4 }')
for name in $old; do
  echo "Deleting db/$name (older than $KEEP_DAYS days)."
  s3 rm "s3://$BUCKET/db/$name"
done

echo "Backup done: $key"
