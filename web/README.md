# Blues Brothers Guild Command

A Vercel-ready placeholder for the Blue Brothers SWGOH guild site. The first slice establishes the visual direction and the shape of the future command centre without requiring database or Discord credentials.

The current release is `0.6.0`. The displayed site version is read directly from `package.json`; release notes are recorded in `CHANGELOG.md`.

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
3. Add a PostgreSQL provider through the Vercel Marketplace and ensure it supplies `DATABASE_URL`.
4. Copy the remaining names from `.env.example` into the Vercel project settings as the integrations are introduced.

The database health endpoint is available at `/api/health/database`. It returns `503 unconfigured` without `DATABASE_URL`, `503 unavailable` when a connection fails, and `200 ok` after a successful query.

## Data layer

`prisma/schema.prisma` defines:

- stable players with ally-code, Discord, and name history;
- explicit guild membership terms, including departure dates;
- periodic guild and member snapshots;
- Territory Battle, Territory War, and raid event history;
- auditable welcome, departure, and officer notification events.

Prisma 7 and its PostgreSQL driver adapter are installed. Generate the client after schema changes:

```bash
npm run db:generate
```

Vercel also runs this automatically through the `postinstall` script. Production Vercel builds apply committed migrations before compiling Next.js; preview and local builds never mutate the database. To apply migrations manually in another configured environment, use `npm run db:migrate:deploy`.

## Guild Wire and Discord sync

The protected `/api/cron/guild-sync` route runs daily in production. It fetches the current Comlink roster, records a guild snapshot, and compares active membership terms. The first run creates a quiet baseline; later joins and departures create one shared automation event that appears on the website and is also delivered to Discord.

Departure automation removes `DISCORD_MEMBER_ROLE_ID` only when the player has a verified `discordUserId`. This avoids matching people by display name. Configure the bot with `MANAGE_ROLES`, keep its role above the managed member role, and add the Discord and Comlink values listed in `.env.example`.

Discord text chat cannot be embedded in a normal website. `DISCORD_WIDGET_ENABLED=true` enables Discord's official presence and voice-channel widget; all replies and reactions open in Discord through `DISCORD_INVITE_URL` or the configured guild link.

## Intended next slices

1. Replace the summary cards with the latest stored guild snapshot.
2. Add a protected cron route to ingest Comlink guild data.
3. Detect joins, departures, and name changes between snapshots.
4. Add Discord OAuth for officer access and ally-code account linking.
5. Send welcome and administration events through a Discord bot, retaining the outcome in `AutomationEvent`.
