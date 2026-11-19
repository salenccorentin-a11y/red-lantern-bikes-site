# Red Lantern Bikes website

Booking site and staff back office for Red Lantern Bikes, a motorbike rental and tour business in District 1, Ho Chi Minh City. It replaces the old Odoo site at redlanternbikes.com.

- Project brief: [CLAUDE.md](CLAUDE.md)
- Prices and pricing rules: [docs/pricing.md](docs/pricing.md)
- Booking, payment and site decisions: [docs/decisions.md](docs/decisions.md)

Built with Next.js and TypeScript, PostgreSQL through Prisma, and Resend for email. Deployed on Railway (Singapore).

## Run it on your computer (Windows)

You need:

- **Node.js 22** or newer (`node -v` to check)
- **Docker Desktop**, running (it provides the local database)
- **Git**

Keep the project outside OneDrive (for example in `C:\dev`), so OneDrive doesn't try to sync the installed packages.

First time only:

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
```

`npm install` also generates the database client. `db:seed` loads the fleet, routes and settings from `docs/pricing.md`. `.env` holds your local settings and secrets and is never committed; the defaults in `.env.example` already match the local database.

Then start the site:

```bash
npm run dev
```

Open http://localhost:3000.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the site locally with live reload |
| `npm test` | Unit tests (pricing and other logic, no database needed) |
| `npm run test:db` | Database tests, including availability (needs `npm run db:up`) |
| `npm run lint` | Check the code for common mistakes |
| `npm run typecheck` | Check TypeScript types |
| `npm run format` | Tidy code formatting (Markdown files are left alone) |
| `npm run db:up` / `npm run db:down` | Start / stop the local database |
| `npm run db:migrate` | Apply database changes to the local database |
| `npm run db:seed` | Load the starting fleet, routes, add-ons and settings (never overwrites existing rows) |
| `npm run db:studio` | Browse the local database in your web browser |
| `npm run build` | Production build, the same one Railway runs |

The local database keeps its data when you stop it. Tests use a separate `redlantern_test` database, so they never touch your development data.

## Continuous integration

Every push to GitHub runs lint, type checks, formatting, unit tests, the production build and the database tests ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Nothing deploys from CI.

## Hosting on Railway

One Railway project, `red-lantern-bikes`, in Singapore:

| Service | What it runs |
| --- | --- |
| `Postgres` | The database (private, no public address) |
| `web` | The site, from the `main` branch. Before each deploy it runs `npx prisma migrate deploy`. The build doesn't need the database. |
| `jobs` | `npm run jobs` every hour (booking reminders) |
| `backup` | The nightly database backup below |

A push to `main` redeploys the site.

## Database backups

Railway's Hobby plan can't create database backups, so the `backup` service does it every night at 02:00 Vietnam time (cron `0 19 * * *`, UTC). It runs [docker/backup/backup.sh](docker/backup/backup.sh):

1. `pg_dump` of the whole database, uploaded to the `backups` bucket as `db/db-<UTC time>.dump`.
2. A restore check: the dump is restored into a scratch database (`backup_check`), every table's row count goes to the log, then the scratch database is dropped.
3. Dumps older than 14 days are deleted (only after 1 and 2 succeeded).

A failed run shows as a failed cron run on the `backup` service in Railway.

To restore a dump (ask Claude, or by hand): download it from the bucket, then from a service in the same Railway project run `pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$DATABASE_URL" db-<time>.dump`. This replaces the current data, so take a fresh dump first.

To test the job locally with Docker: `docker build -f docker/backup/Dockerfile -t rlb-backup .`, then run it with `DATABASE_URL` pointing at the local database (`host.docker.internal`), an S3 stand-in such as `adobe/s3mock`, and `S3_ADDRESSING_STYLE=path`.
