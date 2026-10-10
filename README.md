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
