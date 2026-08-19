# Blues Brothers Guild Command

A Vercel-ready placeholder for the Blue Brothers SWGOH guild site. The first slice establishes the visual direction and the shape of the future command centre without requiring database or Discord credentials.

The current release is `0.4.5`. The displayed site version is read directly from `package.json`; release notes are recorded in `CHANGELOG.md`.

## Local development

Node.js 22.12 or newer is recommended before enabling Prisma 7.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Vercel setup

1. Import this repository into Vercel.
2. Set the project root directory to `web`.
3. Add a PostgreSQL provider through the Vercel Marketplace. Prisma Postgres will supply `DATABASE_URL` when connected.
4. Copy the remaining names from `.env.example` into the Vercel project settings as the integrations are introduced.

The current build does not read any environment variables, so it can be deployed before the database or Discord application exists.

## Proposed data layer

`prisma/schema.prisma` is a design proposal for:

- stable players with ally-code, Discord, and name history;
- explicit guild membership terms, including departure dates;
- periodic guild and member snapshots;
- Territory Battle, Territory War, and raid event history;
- auditable welcome, departure, and officer notification events.

Prisma is intentionally not installed yet because the current local Node.js runtime is just below Prisma 7's minimum supported version. After upgrading Node, install and generate the client:

```bash
npm install @prisma/client @prisma/adapter-pg dotenv pg
npm install --save-dev prisma @types/pg
npx prisma generate
```

At that point, add `prisma generate` to the `postinstall` script so Vercel always generates the client during deployment.

## Intended next slices

1. Replace the summary cards with the latest stored guild snapshot.
2. Add a protected cron route to ingest Comlink guild data.
3. Detect joins, departures, and name changes between snapshots.
4. Add Discord OAuth for officer access and ally-code account linking.
5. Send welcome and administration events through a Discord bot, retaining the outcome in `AutomationEvent`.
