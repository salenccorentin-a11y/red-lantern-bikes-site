# Nightly database backup, run by the "backup" cron service on Railway.
# Railway's Hobby plan can't create database backups, so this job does it:
# see backup.sh and the README ("Database backups").
#
# pg_dump must be at least as new as the server: Railway runs PostgreSQL 18.
FROM postgres:18-alpine

RUN apk add --no-cache aws-cli

COPY docker/backup/backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Not a database server: skip the postgres image's entrypoint.
ENTRYPOINT []
CMD ["/usr/local/bin/backup.sh"]
