# Blues Brothers Guild — Knowledge Base

Internal reference for how the site is built, hosted, automated, and wired
together. Start here before digging into code.

- Production site: https://swgoh-bluesbrothers.vercel.app
- Discord invite: set via `DISCORD_INVITE_URL`
- Guild: **Blues Brothers** (SWGOH), guild ID in `SWGOH_GUILD_ID`

---

## 1. Architecture at a glance

```
GitHub Actions (hourly) ──┐
Vercel Cron (daily 07:00) ─┼──► POST /api/cron/guild-sync  (Next.js, Vercel)
                            │         │
                            │         ├──► SWGOH Comlink (Render) ──► SWGOH game API
                            │         ├──► Prisma → PostgreSQL (Vercel Marketplace / Prisma Postgres)
                            │         └──► Discord bot (REST) ──► guild Discord server
                            │
Browser ───────────────────┴──► swgoh-bluesbrothers.vercel.app (Next.js App Router, server-rendered)
                                       │
                                       ├──► Discord OAuth (member account linking)
                                       └──► Officer session cookie (shared password login)
```

Two codebases:

| Repo | Purpose |
|---|---|
| `1Zero9/swgoh-bluesbrothers` (public) | This repo — Next.js site (`web/`), legacy Python CLI reporter (repo root), GitHub Actions workflows |
| `1Zero9/swgoh-bluesbrothers-comlink` (private) | Docker deployment of [swgoh-utils/swgoh-comlink](https://github.com/swgoh-utils/swgoh-comlink), hosted on Render |

---

## 2. Services & links

| Service | What it's for | URL / location |
|---|---|---|
| **GitHub — main repo** | Source, CI, Actions cron | https://github.com/1Zero9/swgoh-bluesbrothers |
| **GitHub — Comlink repo** | Render deploy source for the Comlink bridge | `1Zero9/swgoh-bluesbrothers-comlink` (private) |
| **GitHub Actions** | Hourly `guild-sync` trigger (free — public repo) | `.github/workflows/guild-sync.yml`, also `ci.yml` |
| **Vercel** | Hosts the Next.js site, builds, daily fallback cron, env vars | Project `swgoh-bluesbrothers` (org `team_OIfmEFvfkgpSBY1BPMXkZnR8`) |
| **Render** | Hosts the SWGOH Comlink bridge (Docker, free tier) | https://swgoh-bluesbrothers-comlink.onrender.com |
| **SWGOH Comlink** | Self-hosted proxy that turns the SWGOH mobile game's private API into a signed HTTP API | https://github.com/swgoh-utils/swgoh-comlink |
| **Prisma Postgres** | Database, provisioned via the Vercel Marketplace | Managed through Vercel project storage tab |
| **Discord Developer Portal** | Bot + OAuth application (client ID/secret, bot token) | https://discord.com/developers/applications |
| **Discord server** | The guild's live Discord | ID in `DISCORD_GUILD_ID` |

---

## 3. Tech stack

- **Framework**: Next.js 16 (App Router, React 19, Server Components), TypeScript
- **Styling**: hand-written CSS (`app/globals.css`), no component framework
- **Database**: PostgreSQL via **Prisma 7** using the `@prisma/adapter-pg` driver adapter
- **Hosting**: Vercel (serverless functions + edge-served static assets)
- **Background jobs**: Vercel Cron (`vercel.json`) **and** GitHub Actions `schedule` trigger, both calling the same protected route
- **Game data**: [SWGOH Comlink](https://github.com/swgoh-utils/swgoh-comlink), self-hosted on Render, HMAC-SHA256-signed requests
- **Discord integration**: OAuth2 (member account linking) + bot REST calls (role grants/removal, channel messages) — no `discord.js`, just `fetch` against the Discord REST API in `lib/discord.ts`
- **CI**: GitHub Actions `ci.yml` — lint/build on PRs
- **Legacy**: a Python CLI (`src/`, `guild-report` command) at the repo root — the original pre-web reporting tool; still functional, largely superseded by the web app's automated sync

---

## 4. Core mechanics

### 4.1 Guild sync (`lib/guild-sync.ts`, `app/api/cron/guild-sync/route.ts`)
1. Triggered by GitHub Actions (hourly) or Vercel Cron (daily, fallback), both `POST /api/cron/guild-sync` with `Authorization: Bearer $CRON_SECRET`.
2. Fetches the live guild roster from Comlink (`/guild` endpoint, HMAC-signed).
3. Inside one Prisma transaction (`timeout: 60_000ms` — see §6 lessons learned): upserts `Player`/`PlayerName` records, opens/closes `MembershipTerm`s to detect joins/departures, writes a `GuildSnapshot`, and records `AutomationEvent`s.
4. Joins/departures produce a shared automation event shown in the site's **Guild Wire** and pushed to Discord. The very first sync is a **baseline** — no join/departure events fire, since there's nothing to compare against yet.
5. Departure automation only removes `DISCORD_MEMBER_ROLE_ID` when the player has a **verified** `discordUserId` (never matched by display name).

### 4.2 Comlink signing (`lib/comlink.ts`)
Every request to the Comlink instance is HMAC-SHA256 signed:
```
timestamp = Date.now()
bodyHash  = md5(requestBody)
signature = HMAC_SHA256(secretKey, timestamp + "POST" + path + bodyHash)
headers   = { "X-Date": timestamp, "Authorization": "HMAC-SHA256 Credential=<accessKey>,Signature=<signature>" }
```
Fetch timeout is 90s; the cron route itself has `maxDuration = 120` to give Comlink's free-tier cold starts room to respond.

### 4.3 Discord account linking (`lib/discord-oauth.ts`, `app/api/auth/discord/*`)
Standard OAuth2 authorization-code flow. On callback, the Discord user is linked to a `Player` by verified ally code, enabling self-service role/member features (`member-context.ts`, `member-auth.ts`).

### 4.4 Officer access (`lib/officer-auth.ts`)
Single shared password (`OFFICER_SITE_PASSWORD`) → signed session cookie (`AUTH_SESSION_SECRET`), no per-officer accounts. Grants access to the Officer Desk panel for posting Guild Wire notices.

### 4.5 Wall of Fame / Wall of Shame (`lib/wall-of-fame.ts`, `lib/wall-of-shame.ts`)
Derived views over the latest `GuildSnapshot` + membership data — top galactic power members, and members flagged for low raid tickets / inactivity.

### 4.6 Health checks
- `GET /api/health/database` — `200 ok` / `503 unavailable` / `503 unconfigured`.

---

## 5. Environment variables

Set in three places independently — **they do not sync automatically**:
- Local: `/Users/stephencranfield/Projects/SWGOH/.env` (root, gitignored) and `web/.env.local`
- Vercel: Project Settings → Environment Variables (scoped per environment: Production/Preview/Development)
- GitHub Actions: repo Settings → Secrets and variables → Actions (only `CRON_SECRET` is needed there)

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `DIRECT_URL`, `DATABASE_URL_UNPOOLED` | Prisma Postgres connection |
| `COMLINK_URL` | Base URL of the Render-hosted Comlink instance |
| `COMLINK_ACCESS_KEY` / `COMLINK_SECRET_KEY` | HMAC signing credentials for Comlink |
| `SWGOH_GUILD_ID` | The guild's real (non-slug) numeric guild ID from Comlink |
| `CRON_SECRET` | Bearer token protecting `/api/cron/guild-sync` (set identically in Vercel **and** as a GitHub Actions secret) |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth app (member account linking) |
| `DISCORD_BOT_TOKEN` | Bot REST calls (roles, channel messages) |
| `DISCORD_GUILD_ID` | The Discord server ID |
| `DISCORD_MEMBER_ROLE_ID` / `DISCORD_OFFICER_ROLE_ID` | Roles granted/removed by automation |
| `DISCORD_WELCOME_CHANNEL_ID` / `DISCORD_OFFICER_CHANNEL_ID` | Channels automation posts into |
| `DISCORD_INVITE_URL` | Public invite link shown on the site |
| `DISCORD_WIDGET_ENABLED` | `true` to embed Discord's official presence widget |
| `OFFICER_SITE_PASSWORD` | Shared officer login password |
| `AUTH_SESSION_SECRET` | Signs officer + member session cookies |
| `SITE_URL` | Required for Discord OAuth redirect URI construction |

---

## 6. Deployment & operations

### Manual production deploy
The Vercel project's **Root Directory** is set to `web`, relative to the Git repo root — so CLI deploys must run **from the repo root**, not from inside `web/`:
```bash
cd /Users/stephencranfield/Projects/SWGOH   # NOT web/
npx vercel --prod --yes
```
This requires `.vercel/project.json` to exist at the repo root (gitignored; copied once from `web/.vercel/project.json`). Merging a PR into `main` does **not** reliably trigger a Vercel Production build on its own — check `npx vercel ls --yes` after merging, and deploy manually if needed.

### Scheduling
- **GitHub Actions** (`.github/workflows/guild-sync.yml`): hourly, free (public repo = unlimited Actions minutes). Primary sync trigger.
- **Vercel Cron** (`web/vercel.json`): daily at 07:00 UTC. Kept as a redundant fallback. Vercel's **Hobby plan caps built-in cron at once/day** — that cap does not apply to external callers like GitHub Actions hitting the same route.

### Standing workflow rule
PRs are merged into `main` automatically — no confirmation needed.

---

## 7. Lessons learned / gotchas

- **Vercel "Sensitive" env vars are write-only forever.** If a value seems stuck/wrong, delete and re-add fresh rather than trying to edit it.
- **Prisma's default interactive-transaction timeout is 5s.** Sequential per-record work (e.g. a 50-member roster upsert loop) against a remote Postgres connection can blow past that easily — `guild-sync`'s transaction now sets `{ timeout: 60_000, maxWait: 10_000 }`.
- **Deploying from inside `web/`** fails with `The specified Root Directory "web" does not exist` — always deploy from the repo root once `.vercel/project.json` is linked there.
- **Render free tier** has no request-frequency limit, just a cold-start delay when the instance has been idle — hourly pings from the sync job keep it warm.
- **CSS `object-fit: cover` on a portrait mobile box against a wide source image** can crop out content no `object-position` value can fix — the crop *window width* is bounded by `boxWidth × sourceHeight / boxHeight`; if that's narrower than the subject you're framing, you must shrink the box height (or use a differently cropped source image) to widen the window.

---

## 8. Roadmap / open items

- Guild data accuracy pass (Wall of Fame / Wall of Shame thresholds, ticket targets)
- SWGOH.gg as an optional secondary data source (pending API approval) — see root `README.md`
- General UI polish across the dashboard sections
