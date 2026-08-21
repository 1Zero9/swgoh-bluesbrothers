# Blues Brothers Guild — Knowledge Base

**Doc version:** 1.10.3 · **Last updated:** 2026-08-21 · tracks site `v0.18.3`

Internal reference for how the site is built, hosted, automated, and wired
together. Start here before digging into code.

- Production site: https://swgoh-bluesbrothers.vercel.app
- Discord invite: set via `DISCORD_INVITE_URL`
- Guild: **Blues Brothers** (SWGOH), guild ID in `SWGOH_GUILD_ID`

> **Keeping this up to date:** this doc has its own semantic version,
> independent of the site's `package.json` version. Bump it whenever you
> make a meaningful change here and add a dated entry to the
> [Changelog](#16-changelog) at the bottom — **patch** (1.1.x) for
> corrections/small additions, **minor** (1.x.0) for new sections or
> notable new mechanics, **major** (x.0.0) for a structural rewrite.
> When the site ships an infra/architecture change (new service, new env
> var, new automation), update this file in the same PR.

---

## Contents

1. [Architecture at a glance](#1-architecture-at-a-glance)
2. [Services & links](#2-services--links)
3. [Tech stack](#3-tech-stack)
4. [Repository map](#4-repository-map)
5. [Core mechanics](#5-core-mechanics)
6. [Data model](#6-data-model)
7. [API routes](#7-api-routes)
8. [lib/ module reference](#8-lib-module-reference)
9. [Environment variables](#9-environment-variables)
10. [CI/CD](#10-cicd)
11. [Local development](#11-local-development)
12. [Deployment & operations](#12-deployment--operations)
13. [Lessons learned / gotchas](#13-lessons-learned--gotchas)
14. [External documentation](#14-external-documentation)
15. [Roadmap / open items](#15-roadmap--open-items)
16. [Changelog](#16-changelog)

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
| **Claude Code** | AI pair-programming CLI used to build/operate this project | https://docs.anthropic.com/en/docs/claude-code |

---

## 3. Tech stack

- **Framework**: Next.js 16 (App Router, React 19, Server Components), TypeScript
- **Styling**: hand-written CSS (`app/globals.css`), no component framework
- **Database**: PostgreSQL via **Prisma 7** using the `@prisma/adapter-pg` driver adapter
- **Hosting**: Vercel (serverless functions + edge-served static assets)
- **Background jobs**: Vercel Cron (`vercel.json`) **and** GitHub Actions `schedule` trigger, both calling the same protected route
- **Game data**: [SWGOH Comlink](https://github.com/swgoh-utils/swgoh-comlink), self-hosted on Render, HMAC-SHA256-signed requests
- **Discord integration**: OAuth2 (member account linking) + bot REST calls (role grants/removal, channel messages) — no `discord.js`, just `fetch` against the Discord REST API in `lib/discord.ts`
- **CI**: GitHub Actions `ci.yml` — currently exercises only the legacy Python CLI (see [§10](#10-cicd) for the gap)
- **Legacy**: a Python CLI (`src/`, `guild-report` command) at the repo root — the original pre-web reporting tool; still functional, largely superseded by the web app's automated sync

---

## 4. Repository map

```
/                             legacy Python CLI reporter project
├── src/                      guild-report package
├── tests/                    pytest suite
├── scripts/                  Comlink setup/start + daily run shell scripts
├── launchd/                  macOS LaunchAgent plist for the daily local schedule
├── data/                     local snapshot baseline + logs (gitignored contents)
├── .github/workflows/        ci.yml (Python tests), guild-sync.yml (hourly cron trigger)
├── docs/                     knowledge base + open-source research
├── config.json                public guild ID + admin ally code
├── README.md                  Python CLI docs
│
└── web/                      the live Next.js site — see web/README.md for setup
    ├── app/
    │   ├── api/               route handlers — see §7
    │   ├── arsenal/           guild-wide priority-unit coverage
    │   ├── credits/           open-source attribution and disclaimer
    │   ├── generated/prisma/  generated Prisma client (build output, gitignored)
    │   ├── page.tsx            the whole dashboard (single-page app shell)
    │   ├── globals.css         all styling
    │   └── *.tsx                small client components (menu, theme toggle, officer desk, etc.)
    ├── lib/                   server-side logic modules — see §8
    ├── prisma/
    │   ├── schema.prisma       data model — see §6
    │   └── migrations/         committed SQL migrations
    ├── scripts/build.mjs       runs `prisma migrate deploy` on Vercel production builds, then `next build`
    ├── public/                 static assets (bb-title.png hero image, bb-logo.png, etc.)
    ├── vercel.json             daily fallback cron config
    ├── CHANGELOG.md            site release notes (semantic version = package.json version)
    ├── THIRD_PARTY_NOTICES.md  retained third-party licence notices
    └── AGENTS.md / CLAUDE.md   Next.js agent instructions (auto-managed by `next dev`)
```

---

## 5. Core mechanics

### 5.1 Guild sync (`lib/guild-sync.ts`, `app/api/cron/guild-sync/route.ts`)
1. Triggered by GitHub Actions (hourly) or Vercel Cron (daily, fallback), both `GET /api/cron/guild-sync` with `Authorization: Bearer $CRON_SECRET`.
2. Fetches the live guild roster from Comlink (`/guild` endpoint, HMAC-signed).
3. Inside one Prisma transaction (`timeout: 60_000ms` — see [§13](#13-lessons-learned--gotchas)): upserts `Player`/`PlayerName` records, opens/closes `MembershipTerm`s to detect joins/departures, writes a `GuildSnapshot` (+ per-member `MemberSnapshot`s with the complete raw member payload), normalizes Territory War status/results into event history, and records `AutomationEvent`s.
4. Joins/departures produce a shared automation event shown in the site's **Guild Wire** and pushed to Discord. The very first sync is a **baseline** — no join/departure events fire, since there's nothing to compare against yet.
5. Departure automation only removes `DISCORD_MEMBER_ROLE_ID` when the player has a **verified** `discordUserId` (never matched by display name).
6. After the roster transaction, up to two stale players are enriched through Comlink `/player`. This rotating batch stores the complete latest profile and a compact historical aggregate; a 50-member guild is fully refreshed in roughly 25 hourly runs without putting the cron route under a 50-request burst.

### 5.2 Comlink signing (`lib/comlink.ts`)
Every request to the Comlink instance is HMAC-SHA256 signed:
```
timestamp = Date.now()
bodyHash  = md5(requestBody)
signature = HMAC_SHA256(secretKey, timestamp + "POST" + path + bodyHash)
headers   = { "X-Date": timestamp, "Authorization": "HMAC-SHA256 Credential=<accessKey>,Signature=<signature>" }
```
Fetch timeout is 90s; the cron route itself has `maxDuration = 120` to give Comlink's free-tier cold starts room to respond.

### 5.3 Discord account linking (`lib/discord-oauth.ts`, `lib/member-auth.ts`, `app/api/auth/discord/*`, `app/api/members/link`)
1. `GET /api/auth/discord` redirects to Discord's OAuth authorize URL with a signed `state` cookie (CSRF protection).
2. `GET /api/auth/discord/callback` exchanges the code, fetches the Discord identity, and stores it in a short-lived signed `link` cookie — the user isn't a verified member yet.
3. `POST /api/members/link` takes an ally code from the user, looks the player up live via Comlink, and if it matches a known `Player`, sets `discordUserId` on that record — completing verification.

### 5.4 Officer access (`lib/officer-auth.ts`, `app/api/officer/session`, `app/api/officer/messages`)
Single shared password (`OFFICER_SITE_PASSWORD`) → signed session cookie (`AUTH_SESSION_SECRET`), no per-officer accounts. A signed-in officer can post a Guild Wire notice (`POST /api/officer/messages`), which is saved as an `AutomationEvent` and sent to Discord via `postDiscordAnnouncement`.

### 5.5 Wall of Fame / Wall of Shame (`lib/wall-of-fame.ts`, `lib/wall-of-shame.ts`)
Derived views over the latest `GuildSnapshot` + `MemberSnapshot`/membership data — top galactic power members, and members flagged for low raid tickets / inactivity. Both appear in a compact standings board and link back to the matching member in the roster directory.

### 5.6 Member directory (`lib/members.ts`, `app/member-directory.tsx`, `app/members/page.tsx`)
The latest snapshot is presented at `/members` as a searchable, sortable card grid. Each card opens an accessible detail dialog with guild rank, galactic power, raid tickets, recent activity, current membership start date, and any officer-attention reasons. Moving the complete directory off the homepage keeps guild command focused on overview and communications.

### 5.7 Guild Arsenal (`lib/guild-arsenal.ts`, `lib/unit-checklist.ts`, `app/arsenal/page.tsx`)
The latest full player profiles are compared with a curated set of Galactic Legends, priority light/dark-side characters, and capital ships. `/arsenal` shows ownership, seven-star, and R5+ coverage across every currently synced active member. Until rotating profile enrichment has covered the whole guild, the page reports its profile denominator explicitly rather than treating unsynced members as missing units.

The checklist is adapted from the MIT-licensed `jmiln/SWGoHBot`; the complete notice is retained in `web/THIRD_PARTY_NOTICES.md` and exposed at `/credits`. Broader repository research and adoption decisions live in `docs/swgoh-open-source-research.md`.

### 5.8 Soul Food Cantina (`lib/recipes.ts`, `app/soul-food-cafe.tsx`, `app/cantina/page.tsx`, `app/api/recipes/submissions`)
The dedicated `/cantina` page contains the Star Wars and Blues Brothers-themed kitchen with six database-backed sandwich recipes, structured ingredient lists, methods, and beer-pairing recommendations. The `20260821000000_soul_food_recipes` migration creates the recipe tables and seeds the initial published menu; `20260821010000_soul_food_cantina_theme` applies the themed public names and descriptions to existing databases. `lib/recipes.ts` reads published records and supplies an equivalent built-in fallback when the database is unavailable during local design work.

Selecting a sandwich opens its full recipe. The client-side Mos Eisley tap-droid advisor selects a pairing stored with that recipe for crisp, hoppy, malty, or alcohol-free preferences. There are no prices or ordering semantics. The starfield, databank cards, blue-neon cantina treatment, and sandwich artwork remain CSS-only.

Public submissions post to `/api/recipes/submissions`. Required fields and maximum lengths are validated server-side, a honeypot drops obvious bot submissions, and accepted recipes are stored in `RecipeSubmission` with `PENDING` status. They never appear publicly until an officer review flow explicitly approves and promotes them; that moderation UI is still an open item.

### 5.9 Territory War room (`lib/territory-war.ts`, `app/territory-war/*`)
Comlink's existing `/guild` response includes guild-specific `territoryWarStatus` and `recentTerritoryWarResult` data; there is no separate TW request. Each active `instanceId` is upserted as a `GuildEvent`, and every hourly capture becomes an `EventSnapshot` containing the complete live TW payload. Recent results populate the event's timing and `finalResult`.

`/territory-war` reads the newest TW data directly from the latest raw `GuildSnapshot` so the page works immediately with captures made before normalization shipped, then falls back to a recent normalized event snapshot. It presents registration/eligibility, locked power, opponent profile, summed zone scores, officer zone commands, defensive zone state, and a searchable member readiness board. Missing full-player profiles are shown as unknown rather than zero. The page does not invent counter recommendations or officer assignments that Comlink has not supplied.

### 5.10 Operations and navigation (`app/operations/page.tsx`, `app/mobile-menu.tsx`)
`/operations` is the launch deck for Territory War, Territory Battles, raids, and the Guild Arsenal. Each card now links to a dedicated route. `/territory-battles` establishes live guild readiness plus deployment/operation/mission planning areas; `/raids` establishes live ticket pace plus readiness/attempt/score areas. Those pages state their current data boundaries while TB and raid event normalization remain future work. Operations and TW are direct desktop/mobile navigation targets.

The complete member directory and Cantina now live at `/members` and `/cantina`, removing the two longest interactive sections from the homepage. Guild command retains overview metrics, communications, compact mission links, standings, personal account context, and officer actions.

### 5.11 Shared banner heroes (`app/page-hero.tsx`)
The Home, Operations, TW, TB, Raid, Arsenal, Members, and Cantina routes use their matching 1915×821 artwork from `web/public`. Internal destinations share `PageHero`, which standardizes responsive image optimization, accessible alternative text, left-side copy, layered contrast gradients, typography, spacing, and the blue/amber signal edge. The shared hero breaks out of the 1220px content shell with `width: 100vw` and `margin-left: calc(50% - 50vw)`, producing a square, edge-to-edge banner directly below the header while its copy remains aligned to the normal content grid. Desktop preserves the wide supplied composition; the phone breakpoint shifts the image focal point toward the subjects and changes to a stronger bottom gradient so copy remains readable.

The homepage retains its existing full-bleed hero structure and uses the original `bb-title.png` neon-sign artwork. Credits remains a compact utility page and has no supplied banner.

Every public destination renders the same `SiteHeader` above its page content. The shared component owns the BB logo/home link, primary navigation, version label, colour-theme controls, Discord action, and the existing responsive mobile drawer. Home uses the overlay variant inside its artwork; subpages use the full-width page variant with content aligned to the 1220px shell and light/dark/gradient theme-specific contrast. This avoids separate navigation systems drifting apart.

### 5.12 Health checks
- `GET /api/health/database` — `200 ok` / `503 unavailable` / `503 unconfigured`.

---

## 6. Data model

Defined in `web/prisma/schema.prisma`, PostgreSQL via Prisma 7.

| Model | Purpose | Key fields / relations |
|---|---|---|
| `Guild` | One row per tracked guild | `discordGuildId`; has many snapshots, membership terms, events, automation events |
| `Player` | Stable identity for a game account, independent of guild membership | `allyCode`, `discordUserId`, level, portrait/title, `profileSyncedAt`, and the complete latest `profilePayload`; has many names, membership terms, roster snapshots, and profile-history snapshots |
| `PlayerName` | Name-change history | `firstSeen`/`lastSeen` per name string |
| `MembershipTerm` | One open/closed span of guild membership | `state` (`ACTIVE`/`LEFT`), `joinedAt`/`leftAt`, `welcomeSentAt`, `departureNotifiedAt`, `discordAccessRemovedAt` — drives join/departure automation |
| `GuildSnapshot` | Point-in-time guild-wide stats from a sync | `memberCount`, `galacticPower`, `characterPower`, `shipPower`, `raidTickets`, raw Comlink `rawPayload` |
| `MemberSnapshot` | Point-in-time per-member stats, tied to a `GuildSnapshot` | Total/character/ship GP, tickets, activity, player level, guild role, squad power, season score, league, guild XP, and the complete raw guild-member payload |
| `PlayerProfileSnapshot` | Lightweight history from rotating full-profile enrichment | Galactic Legends, unlocked ultimates, relic units, roster-unit count, datacrons, and lifetime season score |
| `GuildEvent` | A Territory Battle / Territory War / Raid instance | `type` (enum `GuildEventType`), `externalId`, `finalResult`; Territory Wars are populated by guild sync |
| `EventSnapshot` | Point-in-time capture of a `GuildEvent`'s progress | `phase`, complete raw `payload`; active Territory Wars are captured hourly |
| `AutomationEvent` | Auditable record of every automated/officer action | `kind`, `status` (enum `AutomationStatus`), `discordChannelId`/`discordMessageId`, `sentAt` — backs the Guild Wire feed |
| `Recipe` | Published Soul Food Cantina recipe | Slug, origin, description, JSON ingredient/method lists, JSON beer pairings, visual tone, sort order, publication state |
| `RecipeSubmission` | Community recipe awaiting review | Bread, filling, toppings, method, optional submitter/beer/story fields, moderation `status` (`PENDING`/`APPROVED`/`REJECTED`) |

---

## 7. API routes

All under `web/app/api/`. All are `runtime = "nodejs"`, `dynamic = "force-dynamic"`.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/cron/guild-sync` | GET | `Authorization: Bearer $CRON_SECRET` | Runs the guild sync (§5.1). `maxDuration = 120`. |
| `/api/health/database` | GET | none | DB connectivity probe. |
| `/api/auth/discord` | GET | none (sets CSRF state cookie) | Starts Discord OAuth. 503 if not configured. |
| `/api/auth/discord/callback` | GET | OAuth `code`/`state` | Completes OAuth, sets a pending `link` cookie, redirects home. |
| `/api/members/link` | POST | pending `link` cookie | Verifies an ally code against Comlink and links it to a `Player`. `maxDuration = 30`. |
| `/api/officer/session` | POST / DELETE | `password` in body (POST) / officer cookie (DELETE) | Officer sign-in / sign-out. |
| `/api/officer/messages` | POST | officer session cookie | Posts a Guild Wire notice + Discord announcement. `maxDuration = 30`. |
| `/api/recipes/submissions` | POST | none | Validates and stores a public sandwich submission as pending moderation; includes size limits and honeypot spam handling. |

---

## 8. lib/ module reference

| Module | Responsibility |
|---|---|
| `comlink.ts` | HMAC request signing, `fetchPlayerByAllyCode`, guild/TW roster fetch, ally-code sanitizing |
| `prisma.ts` | `getPrisma()` — lazily builds the Prisma client with the `pg` driver adapter; throws clearly if `DATABASE_URL` is missing |
| `guild-sync.ts` | The full sync transaction described in §5.1 |
| `guild-wire.ts` | Reads recent `AutomationEvent`s for the website feed |
| `dashboard.ts` | Aggregates the latest `GuildSnapshot` into the summary metric cards |
| `discord.ts` | Bot REST calls — posting announcements, role add/remove |
| `discord-oauth.ts` | OAuth authorize-URL builder, code exchange, identity fetch |
| `member-auth.ts` | Signed cookie helpers for the OAuth `state`/`link`/member session flow |
| `member-context.ts` | Resolves the current visitor's linked `Player` (if any) for the "cantina card" |
| `members.ts` | Builds the ranked member directory from the latest snapshot, active membership term, and attention rules |
| `territory-war.ts` | Builds the live/pre-war TW room from raw and normalized event snapshots, zone state, participants, results, and current roster profiles |
| `guild-arsenal.ts` | Aggregates priority-unit ownership, star, and relic coverage from stored full player profiles |
| `unit-checklist.ts` | Attributed priority-unit definitions adapted from SWGoHBot under MIT |
| `recipes.ts` | Reads and validates published recipe/beer-pairing JSON, with built-in local fallback recipes |
| `officer-auth.ts` | Shared-password check + signed officer session cookie |
| `wall-of-fame.ts` / `wall-of-shame.ts` | Leaderboard/bulletin derivations described in §5.5 |

---

## 9. Environment variables

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

## 10. CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/ci.yml` | push to `main`, every PR | Installs the **Python** CLI project and runs `pytest` + `compileall` + shell-script syntax checks on `python-version` matrix `3.11`/`3.13`. **Does not currently lint, typecheck, or build the `web/` Next.js app** — that's a gap; run `npm run lint` / `npm run build` manually in `web/` before merging site changes. |
| `.github/workflows/guild-sync.yml` | hourly `schedule`, or manual `workflow_dispatch` | Calls the production `/api/cron/guild-sync` route with `secrets.CRON_SECRET`, fails the job on a non-200 response. |

There is no Vercel "Ignored Build Step" / preview-deploy gating configured beyond Vercel's defaults — every push produces a Preview deployment; Production requires either a `main` push to trigger a build or a manual `vercel --prod` (see [§12](#12-deployment--operations)).

---

## 11. Local development

**Web app** (`web/`):
```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run db:generate # regenerate Prisma client after schema.prisma changes
npm run db:studio   # Prisma Studio GUI against DATABASE_URL
```

**Legacy Python CLI** (repo root):
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
guild-report --no-save
pytest
```

Running the web app fully locally against live data also needs a local Comlink instance — see the root `README.md`'s "Fetch live guild data with Comlink" section, or point `COMLINK_URL` at the Render instance and use its credentials.

---

## 12. Deployment & operations

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

## 13. Lessons learned / gotchas

- **Vercel "Sensitive" env vars are write-only forever.** If a value seems stuck/wrong, delete and re-add fresh rather than trying to edit it.
- **Prisma's default interactive-transaction timeout is 5s.** Sequential per-record work (e.g. a 50-member roster upsert loop) against a remote Postgres connection can blow past that easily — `guild-sync`'s transaction now sets `{ timeout: 60_000, maxWait: 10_000 }`.
- **Deploying from inside `web/`** fails with `The specified Root Directory "web" does not exist` — always deploy from the repo root once `.vercel/project.json` is linked there.
- **Render free tier** has no request-frequency limit, just a cold-start delay when the instance has been idle — hourly pings from the sync job keep it warm.
- **CSS `object-fit: cover` on a portrait mobile box against a wide source image** can crop out content no `object-position` value can fix — the crop *window width* is bounded by `boxWidth × sourceHeight / boxHeight`; if that's narrower than the subject you're framing, you must shrink the box height (or use a differently cropped source image) to widen the window.

---

## 14. External documentation

| Topic | Link |
|---|---|
| Next.js (App Router) | https://nextjs.org/docs |
| Prisma ORM / driver adapters | https://www.prisma.io/docs |
| SWGOH Comlink API | https://github.com/swgoh-utils/swgoh-comlink |
| Discord REST API | https://discord.com/developers/docs/reference |
| Discord OAuth2 | https://discord.com/developers/docs/topics/oauth2 |
| Vercel (deployments, cron, env vars) | https://vercel.com/docs |
| Render | https://render.com/docs |
| GitHub Actions | https://docs.github.com/actions |
| Claude Code | https://docs.anthropic.com/en/docs/claude-code |

---

## 15. Roadmap / open items

- Guild data accuracy pass (Wall of Fame / Wall of Shame thresholds, ticket targets)
- SWGOH.gg as an optional secondary data source (pending API approval) — see root `README.md`
- General UI polish across the dashboard sections
- Officer moderation queue for approving/rejecting pending Soul Food Cantina recipe submissions
- Add officer-owned TW defensive assignments and counter notes on top of the read-only live board
- Extend `GuildEvent`/`EventSnapshot` normalization to Territory Battles and raids (TW is now populated)
- CI doesn't currently build/lint the `web/` app — worth adding a Next.js job to `ci.yml`

---

## 16. Changelog

### 1.10.3 — 2026-08-21
- Documented the full-viewport internal hero layout and aligned inner copy introduced in site v0.18.3.

### 1.10.2 — 2026-08-21
- Replaced the documented breadcrumb-only subpage bar with the shared full homepage header and mobile drawer introduced in site v0.18.2.

### 1.10.1 — 2026-08-21
- Documented the full-width `intel-header` breakout technique and the revert of the homepage hero back to `bb-title.png`, tracking site v0.18.1.

### 1.10.0 — 2026-08-21
- Documented the shared responsive banner hero, eight supplied route images, new TB/Raid readiness routes, focal-point handling, and site v0.18.0.

### 1.9.0 — 2026-08-21
- Documented the Operations launch deck, direct TW navigation, dedicated member/Cantina routes, shorter homepage, and site v0.17.0.

### 1.8.0 — 2026-08-21
- Documented Comlink Territory War fields, hourly `GuildEvent`/`EventSnapshot` normalization, raw-snapshot fallback, the live war room, and site v0.16.0.

### 1.7.0 — 2026-08-21
- Documented the Star Wars/Blues Brothers Soul Food Cantina theme, CSS-only galactic treatment, tap-droid advisor copy, themed recipe data migration, and site v0.15.0.

### 1.6.0 — 2026-08-21
- Documented database-backed café recipes, seeded recipe migration, preference-aware beer pairings, and pending community submissions introduced in site v0.14.0.

### 1.5.0 — 2026-08-21
- Documented the interactive Soul Food Café, local order state, live pricing, and CSS-only sandwich artwork introduced in site v0.13.0.

### 1.4.0 — 2026-08-20
- Documented the Guild Arsenal aggregation, open-source attribution rules, and repository research introduced in site v0.12.0.

### 1.3.0 — 2026-08-20
- Documented the expanded hourly member snapshots, rotating full-profile enrichment, complete latest-profile storage, and new member-card statistics introduced in site v0.11.0.

### 1.2.0 — 2026-08-20
- Added the searchable member directory, interactive member cards, and consolidated standings-board mechanics introduced in site v0.10.0.

### 1.1.0 — 2026-08-20
- Added versioning header and this changelog.
- Added table of contents, repository map, full data model reference, API routes table, lib/ module reference, CI/CD section, local development section, and external documentation links.

### 1.0.0 — 2026-08-20
- Initial knowledge base: architecture, services & links, tech stack, core mechanics, environment variables, deployment/operations, lessons learned, roadmap.
