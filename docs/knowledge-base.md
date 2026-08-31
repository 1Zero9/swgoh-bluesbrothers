# Blues Brothers Guild — Knowledge Base

**Doc version:** 1.18.0 · **Last updated:** 2026-08-31 · tracks site `v0.30.0`

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

`/territory-war` reads the newest TW data directly from the latest raw `GuildSnapshot` so the page works immediately with captures made before normalization shipped, then falls back to a recent normalized event snapshot. Above the officer gate it presents registration/eligibility, locked power, opponent profile, summed zone scores, and a searchable member readiness board — all genuinely Comlink-supplied, live or last-synced data. Missing full-player profiles are shown as unknown rather than zero.

Below that, a cookie-gated **Territory War command tool** (`app/territory-war/tw-workspace.tsx` + `tw-prepare.tsx`/`tw-matchup.tsx`/`tw-defence.tsx`/`tw-attack.tsx`/`tw-workload.tsx`/`tw-discord-export.tsx`) lets signed-in officers turn that live data into an explicit, officer-authored defence plan:

- **Persistence.** A guild's plans are `TerritoryWarPlan` records (draft/active/archived, versioned, clonable, optionally linked to a `StrategyTemplate`) owning `ZonePlan` rows (per-zone purpose/target capacity/notes), `PlayerAssignment` rows (player → exact squad → zone, with a `SUGGESTED → ASSIGNED → ACKNOWLEDGED → PLACED / CHANGED / MISSING / EXEMPT` status lifecycle, a `RECOMMENDED`/`MANUAL` source, and an officer lock flag), and `AttackAssignment` rows for manual offence tracking. `page.tsx` calls `getOrCreateActivePlan()` so the current TW event always has an active plan once an officer visits the page. See §6 for the full schema.
- **Pure engine, computed live.** `lib/tw-squads.ts` (static squad/counter reference data) and `lib/tw-planning-engine.ts` (warning detection, offence-reserve health, workload, Discord message builders, and `generateRecommendations()`) have zero Prisma/React dependencies, so `tw-workspace.tsx` imports them directly and recomputes warnings/reserve/workload/recommendations client-side on every edit — no round trip needed to preview a change. Only actual persistence (creating/updating/deleting an assignment, editing a zone, applying recommendations, posting to Discord, managing templates) goes through the seven `POST`/`PATCH`/`DELETE` routes under `/api/officer/tw/*` (§7), followed by `router.refresh()` to resync from the database. `lib/tw-view.ts` is the pure adapter between the Prisma-persisted shape and the shape the engine expects.
- **Per-officer attribution.** The officer area is still one shared password/session (§5.4), but `lib/officer-identity.ts` resolves a best-effort display name for `createdBy`/`updatedBy` off the visiting browser's separate member-link (Discord OAuth) cookie when present, falling back to a generic "Officer" label otherwise. Plans, zone setup, assignments, and attack rows all persist and display ("by &lt;name&gt;") this attribution; it never blocks a write when no member session is linked.
- **Strategy templates.** `StrategyTemplate.rules` (`{ zonePriority?, squadPriority? }`, both optional/partial) lets officers override the engine's default zone-fill order and per-zone preferred-squad order without needing named officer accounts. The Templates mode (`tw-templates.tsx`) is a full CRUD UI — create/edit/delete a template (per-zone priority number + comma-separated preferred squad keys) and apply one to the current plan (`setPlanTemplate`, persisted on `TerritoryWarPlan.templateId`) or fall back to the built-in strategy. `generateRecommendations()` takes the active template's `rules` as an optional 4th argument; `isStrategyTemplateRules()` guards untrusted JSON from the DB before it's trusted.
- **Seven modes.** Prepare (zone purpose/capacity setup + squad-readiness counts from the pool), Match-up (score/fill overview), Defence (the primary Command-based workspace, described below), Attack (manually tracked offence board, clearly separate from defence data), Workload (per-player assignment load / idle members), Discord (builds a guild strategy message and per-player personal messages, concise or detailed, with copy actions and a direct post via `postDiscordAnnouncement`), and Templates (strategy template CRUD + apply-to-plan, described above).
- **Commands, not per-player drag-and-drop.** After direct officer feedback that per-player squad assignment was too fiddly ("I want to select a zone, put on a command, like GL Vader + DataCron... then do that for all zones"), Defence mode was rebuilt around **Commands** — named, reusable squad+kit presets (`TwCommand`, shared with Territory Battle planning, §5.14) that an officer assigns directly to a zone. Every guild gets 12 built-in Commands for free (one per known TW squad, derived from `SQUAD_DEFINITIONS`; see `lib/tw-commands.ts`'s `BUILT_IN_COMMAND_PRESETS` and `ensureBuiltInCommands()` in `lib/tw-plans.ts`, which idempotently creates any that are missing for a guild), and officers can create fully custom Commands (with or without a linked `squadKey`) via a picker grid in `tw-defence.tsx` backed by `/api/officer/tw/commands` (list/create/update/delete). Selecting a Command for a zone sets `ZonePlan.commandId`.
- **Hold-confidence, not a fabricated win percentage.** Comlink never exposes an opponent's actual defensive squad composition, so the tool cannot compute a true win probability. Instead `computeHoldConfidence()` in `lib/tw-planning-engine.ts` derives an honestly-labeled 0–100 **hold-confidence** score (and "Strong Hold" / "Likely Hold" / "Contested" / "Vulnerable" label) per zone from that squad's known counter-vulnerability rating (`tw-squads.ts`'s `TW_COUNTER_STRATEGIES`) plus a roster-depth bonus for how many other joined members can also field the same squad as backup. The zone detail panel shows the score, label, and the plain-language factors behind it (`twc-confidence-badge`, `twc-confidence-factors`) — explicitly framed as a heuristic estimate of holding the line, not a guaranteed outcome or true win probability benchmarked against Comlink data it doesn't expose.
- **What's genuinely Comlink-supplied vs. officer-entered:** roster membership, galactic power, TW registration/joined status, opponent identity and live zone scores, and squad-readiness checks (whether a player's synced profile shows the leader unit for a given squad) all come from live/synced data. Zone purpose, target capacity, every Command assignment, attack tracking, recommendation *application*, template rules, and all Discord message text are officer-entered or officer-approved; hold-confidence is a computed heuristic, not Comlink data. The tool never silently commits a recommendation, invents an assignment, or presents a guess as a fact.

### 5.10 Operations and navigation (`app/operations/page.tsx`, `app/mobile-menu.tsx`)
`/operations` is the launch deck for Territory War, Territory Battles, raids, and the Guild Arsenal. Each card now links to a dedicated route. `/territory-battles` establishes live guild readiness plus deployment/operation/mission planning areas; `/raids` establishes live ticket pace plus readiness/attempt/score areas. Those pages state their current data boundaries while TB and raid event normalization remain future work. Operations and TW are direct desktop/mobile navigation targets.

The complete member directory and Cantina now live at `/members` and `/cantina`, removing the two longest interactive sections from the homepage. Guild command retains overview metrics, communications, compact mission links, standings, personal account context, and officer actions.

### 5.11 Shared banner heroes (`app/page-hero.tsx`)
The Home, Operations, TW, TB, Raid, Arsenal, Members, and Cantina routes use their matching 1915×821 artwork from `web/public`. Internal destinations share `PageHero`, which standardizes responsive image optimization, accessible alternative text, left-side copy, layered contrast gradients, typography, spacing, and the blue/amber signal edge. The shared hero breaks out of the 1220px content shell with `width: 100vw` and `margin-left: calc(50% - 50vw)`, producing a square, edge-to-edge banner directly below the header while its copy remains aligned to the normal content grid. Desktop preserves the wide supplied composition; the phone breakpoint shifts the image focal point toward the subjects and changes to a stronger bottom gradient so copy remains readable.

The homepage retains its existing full-bleed hero structure and uses the original `bb-title.png` neon-sign artwork. Credits has no supplied banner, so its integrated header sits over a compact dark command-gradient hero instead.

Every public destination renders the same `SiteHeader` inside its hero rather than in a detached toolbar above it. The shared component owns the BB logo/home link, primary navigation, version label, colour-theme controls, Discord action, and the existing responsive mobile drawer. `PageHero` owns this integration for all banner destinations, keeps the controls readable over the artwork, and collapses them to the drawer at tablet/mobile widths. This avoids separate navigation systems drifting apart.

### 5.12 Health checks
- `GET /api/health/database` — `200 ok` / `503 unavailable` / `503 unconfigured`.

### 5.13 Officer Roster Report (`lib/officer-roster.ts`, `app/officer/roster/*`)
`/officer/roster` is a cookie-gated (officer session only) filterable/sortable table covering the **full guild history** — every `MembershipTerm` (ACTIVE and LEFT), deduplicated to the most recent term per player. `getOfficerRosterReport()` composes `getRosterMembers()` (current roster + `getMemberAttentionReasons()` flags), a direct `prisma.membershipTerm.findMany()` query, `getRaidRoom()` (latest completed raid's participants), and `getTerritoryWarRoom()` (current/recent war's `joined` status per member) into one row per player: role, active/inactive tag, tenure, GP, raid tickets vs. the `TICKET_TARGET_PER_MEMBER` target, last-raid participation + damage, TW joined status, last activity, and a computed `flags`/`needsAttention` list (existing Wall of Shame reasons plus "sat out the last raid" / "didn't join the last war").

`raidParticipated` and `twJoined` are `null` — not `false` — whenever there's no recent raid/war to measure against (e.g. `twRoom.active === false`), to avoid falsely flagging members when there's simply no data. Territory Battle has **no** participation column with real data — Comlink doesn't expose it outside the guild's own account (§15) — so the table renders a static "No data" pill with an explanatory tooltip rather than fabricating a signal. Only `ACTIVE` members get attention flags computed; departed members are informational only. The table itself (`app/officer-roster-table.tsx`) is a client component with client-side search/status-filter/attention-toggle/sortable-column state, matching the existing `app/raids/raid-board.tsx` filter pattern. The page uses `dynamic = "force-dynamic"` (reads the officer cookie per-request) and is linked from the homepage officer's desk and the main site navigation once signed in.

### 5.14 Territory Battle command tool (`app/territory-battles/tb-workspace.tsx`, `app/api/officer/tb/*`)
Mirroring the TW Command redesign (§5.9) and the same direct officer feedback ("I also want the same for TB, but for planets, when to pre-load, when to 3 star etc. Day 1, Day 2 etc."), a cookie-gated **Territory Battle command tool** sits below the existing GP/star `TbPlanner` optimizer on `/territory-battles` — an additive section, not a replacement; the two features serve different purposes and both remain intact.

- **Persistence.** A guild's plans are `TerritoryBattlePlan` records (reusing the `TwPlanStatus` enum: `DRAFT`/`ACTIVE`/`ARCHIVED`, optionally linked to a `GuildEvent` of type `TERRITORY_BATTLE` via `getCurrentTbEventId()`) owning `PlanetPlan` rows — one per planet/zone **and** phase (`phase: Int`, i.e. Day 1, Day 2, ...) — each with a `strategy` (enum `TbStrategy`: `PRELOAD`/`THREE_STAR`/`HOLD`/`SKIP`), an optional `commandId` (the same shared `TwCommand` model used by TW zones), a free-text `note`, and `priority` for ordering. `page.tsx` calls `getOrCreateActiveTbPlan()` so the current TB event always has an active plan once an officer visits the page.
- **Phase tabs sourced from real ROTE data.** `TbWorkspace` reuses the pre-existing `ROTE_PLANNER_DATA` constant (`lib/territory-battles.ts`, originally built for the GP optimizer) to drive the Day 1–6 phase tabs and to suggest real Rise of the Empire planet/zone names (via an HTML `<datalist>`) when an officer adds a new planet to a phase, rather than requiring free-typed names or duplicating a hardcoded planet list.
- **Same shared Commands.** The planet-row Command `<select>` lists the same built-in + custom `TwCommand` rows as the TW tool (§5.9) — a squad+kit preset assigned once can be referenced from both TW zone defence and TB planet planning.
- **Routes.** `POST`/`PATCH /api/officer/tb/plan` creates/ensures the active plan and updates its status; `POST`/`PATCH`/`DELETE /api/officer/tb/planets` upserts or removes a `PlanetPlan` row (both POST and PATCH delegate to one shared `upsertPlanetPlan()` call in `lib/tw-plans.ts`, keyed on whether an `id` is supplied). Same officer-cookie auth and `{ ok, error? }` response convention as the TW routes (§7).
- **What's genuinely Comlink-supplied vs. officer-entered:** the suggested planet/zone names come from static, hand-maintained ROTE reference data (not a live Comlink signal — see §15, Comlink exposes no live TB participation data outside the guild's own account). Strategy choice, Command assignment, notes, and priority are entirely officer-entered.

### 5.15 Mission From God game specification (`../mission-from-god-game-spec.md`)
The planned `/mission-from-god` module is an original, limited-access, non-commercial guild trading game. Its specification now separates the deterministic TypeScript engine from the React interface, defines a staged Free Play → persistence → Daily competition rollout, and fixes the previously ambiguous payment, Daily reset, autosave, scoring, RNG and server-authority rules. Scored play will use the existing authenticated active `Player` identity; competitive mutations will be transactional, idempotent and retained in an append-only action ledger.

Game definitions remain version-controlled configuration while runs, actions, results and achievements will live in PostgreSQL. The specification makes original code/presentation and attribution mandatory. Creative inspirations and property acknowledgements are recorded in `web/THIRD_PARTY_NOTICES.md` and exposed on `/credits`; any later third-party library, asset or substantial data source must be added to both before release.

### 5.16 Mission From God Phase 1 engine (`lib/game/*`)
The first game milestone is an isolated, UI-independent TypeScript rules engine. `lib/game/data` defines Jake/Elwood, five planets and six commodities; `lib/game/engine/rng.ts` provides coordinate-based deterministic streams; `economy.ts` creates bounded per-seed/day/planet prices with a bid/ask spread; and `game.ts` owns immutable run creation, trading, cargo, travel, the 30-day limit, Day 15 Jabba demand and final payment. Credits remain safe integers, cargo cannot exceed capacity, inventory cannot become negative, and only liquid Credits can pay Jabba.

The initial balance uses 18,000 Credits, 100 cargo for Jake and 110 for Elwood. Jake receives the configured 5% sale advantage after the market's sell markdown; Elwood pays a small merchant penalty in return for cargo space. Day 15 is a blocking decision: a paid demand deducts 250,000 from both cash and debt, while a missed demand activates the initial bounty state. Travelling from Day 30 closes an unpaid run without creating a Day 31.

`lib/game/simulation.ts` supplies deterministic random, conservative and future-aware oracle agents. A 6,000-run fixed-seed balance pass (2,000 per agent) produced 0%, 60.15% and 100% win rates respectively. Random is the expected losing floor, conservative sits inside the specification's experienced-player target, and oracle is a mathematical upper-bound detector rather than a player model. Run the repeatable report with `npm run game:simulate -- 2000`. `lib/game/game.test.ts` covers reproducibility, character differences, trade/cargo invariants, travel, Jabba and balance ordering. No database or public route is introduced in this phase.

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
| `StrategyTemplate` | Named, reusable set of TW planning rules for a guild | `name`, `description`, `isBuiltIn`, JSON `rules`; has many `TerritoryWarPlan` |
| `TerritoryWarPlan` | One officer-authored TW defence plan (draft/active/archived, versioned) | `status` (enum `TwPlanStatus`: `DRAFT`/`ACTIVE`/`ARCHIVED`), `version`, optional `eventId`/`templateId`/`clonedFromId` (self-relation for cloning), `createdBy`; has many `ZonePlan`, `PlayerAssignment`, `AttackAssignment` |
| `ZonePlan` | Officer setup for one zone within a plan | `zoneId`, `purpose`, `targetCapacity` (default 25), `note`, `updatedBy`; unique per `[planId, zoneId]` |
| `PlayerAssignment` | One player's exact squad assignment to a zone | `playerId`, `squadKey`, `priority`, `officerNote`, `status` (enum `TwAssignmentStatus`: `SUGGESTED`/`ASSIGNED`/`ACKNOWLEDGED`/`PLACED`/`CHANGED`/`MISSING`/`EXEMPT`), `source` (enum `TwAssignmentSource`: `RECOMMENDED`/`MANUAL`), `locked`, `createdBy`, `updatedBy` |
| `AttackAssignment` | Manually tracked offence-side attack for a plan | `zoneLabel`, `enemySquad`, optional `assignedPlayerId`, `status` (enum `TwAttackStatus`: `UNASSIGNED`/`ASSIGNED`/`IN_PROGRESS`/`FAILED`/`NEEDS_SPECIALIST`/`CLEARED`/`HOLD`), `note`, `updatedBy` |
| `TwCommand` | Named squad+kit preset ("Command") assignable to a TW zone or TB planet/phase (§5.9, §5.14) | `name`, optional `squadKey`, `kitNotes`, `isBuiltIn`, `createdBy`; referenced by `ZonePlan.commandId` and `PlanetPlan.commandId` |
| `TerritoryBattlePlan` | One officer-authored TB plan (draft/active/archived) | `status` (enum `TwPlanStatus`, shared with `TerritoryWarPlan`), optional `eventId`, `createdBy`; has many `PlanetPlan` |
| `PlanetPlan` | Officer strategy call for one planet/zone within one TB phase | `planetName`, `phase` (Day 1, 2, ...), `strategy` (enum `TbStrategy`: `PRELOAD`/`THREE_STAR`/`HOLD`/`SKIP`), optional `commandId`, `note`, `priority`, `updatedBy`; indexed on `[planId, phase]` |

---

## 7. API routes

All under `web/app/api/`. All are `runtime = "nodejs"`, `dynamic = "force-dynamic"`. (Public data pages under `web/app/*/page.tsx` mostly use `revalidate = 300` instead — see §13.)

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
| `/api/officer/tw/plan` | POST / PATCH | officer session cookie | Clones a plan (`action: "clone"`) or updates its `status`/`name`. |
| `/api/officer/tw/zones` | PATCH | officer session cookie | Upserts a `ZonePlan`'s `purpose`/`targetCapacity`/`note`. |
| `/api/officer/tw/assignments` | POST / PATCH / DELETE | officer session cookie | Creates a manual `PlayerAssignment` (`locked: true`, `source: "MANUAL"`), or updates/removes an existing one. |
| `/api/officer/tw/recommendations` | POST | officer session cookie | Persists a client-computed `generateRecommendations()` preview as `PlayerAssignment` rows (`source: "RECOMMENDED"`). |
| `/api/officer/tw/attack` | POST / DELETE | officer session cookie | Creates/updates or removes an `AttackAssignment`. |
| `/api/officer/tw/discord` | POST | officer session cookie | Posts an officer-composed TW title/message to Discord via `postDiscordAnnouncement`. `maxDuration = 30`. |
| `/api/officer/tw/templates` | GET / POST / PATCH / DELETE | officer session cookie | Lists/creates/updates/deletes `StrategyTemplate` rows; `PATCH` with a `planId` instead applies (or clears) a template on that plan via `setPlanTemplate`. |
| `/api/officer/tw/commands` | GET / POST / PATCH / DELETE | officer session cookie | Lists/creates/updates/deletes `TwCommand` rows (shared between TW zone assignment and TB planet planning, §5.9/§5.14). |
| `/api/officer/tb/plan` | POST / PATCH | officer session cookie | Ensures/creates the active `TerritoryBattlePlan`, or updates its `status`. |
| `/api/officer/tb/planets` | POST / PATCH / DELETE | officer session cookie | Upserts (POST/PATCH share one handler) or removes a `PlanetPlan` row. |

---

## 8. lib/ module reference

| Module | Responsibility |
|---|---|
| `comlink.ts` | HMAC request signing, `fetchPlayerByAllyCode`, guild/TW roster fetch, ally-code sanitizing |
| `prisma.ts` | `getPrisma()` — lazily builds the Prisma client with the `pg` driver adapter; throws clearly if `DATABASE_URL` is missing |
| `guild-sync.ts` | The full sync transaction described in §5.1 |
| `guild-wire.ts` | Reads recent `AutomationEvent`s for the website feed |
| `dashboard.ts` | Aggregates the latest `GuildSnapshot` into the summary metric cards |
| `guild-snapshot.ts` | `React.cache()`-memoized shared query for the latest `GuildSnapshot` + members/player summary fields (excludes `rawPayload`/`profilePayload`); reused by `wall-of-fame.ts`, `wall-of-shame.ts`, and `members.ts` to avoid duplicate per-request queries |
| `discord.ts` | Bot REST calls — posting announcements, role add/remove |
| `discord-oauth.ts` | OAuth authorize-URL builder, code exchange, identity fetch |
| `member-auth.ts` | Signed cookie helpers for the OAuth `state`/`link`/member session flow |
| `member-context.ts` | Resolves the current visitor's linked `Player` (if any) for the "cantina card" |
| `members.ts` | Builds the ranked member directory from the latest snapshot, active membership term, and attention rules |
| `territory-war.ts` | Builds the live/pre-war TW room from raw and normalized event snapshots, zone state, participants, results, and current roster profiles |
| `raids.ts` | Reads Comlink's `recentRaidResult` off the latest `GuildSnapshot.rawPayload` and ranks each raid's participants by damage (`memberProgress`); no live raid status is available (see §15) |
| `guild-arsenal.ts` | Aggregates priority-unit ownership, star, and relic coverage from stored full player profiles |
| `unit-checklist.ts` | Attributed priority-unit definitions adapted from SWGoHBot under MIT |
| `recipes.ts` | Reads and validates published recipe/beer-pairing JSON, with built-in local fallback recipes |
| `officer-auth.ts` | Shared-password check + signed officer session cookie |
| `officer-identity.ts` | Best-effort officer display-name resolver for TW attribution — reads the existing member-link cookie session (if any) and falls back to a generic "Officer" label; never throws or blocks a write |
| `wall-of-fame.ts` / `wall-of-shame.ts` | Leaderboard/bulletin derivations described in §5.5 |
| `officer-roster.ts` | Officer-only full guild-history report combining roster stats, membership terms, raid participation, and TW joined status (§5.13) |
| `tw-squads.ts` | Static TW squad/counter reference data (squad definitions, groups, zone hints, vulnerability ratings) and `DEFAULT_ZONES` (§5.9) |
| `tw-commands.ts` | `BUILT_IN_COMMAND_PRESETS` — the 12 built-in Command presets derived 1:1 from `SQUAD_DEFINITIONS` (§5.9) |
| `tw-planning-engine.ts` | Pure, side-effect-free TW planning functions — `generateRecommendations`, `detectWarnings`, `computeOffenceReserve`, `computeWorkload`, `computeHoldConfidence` (§5.9), Discord message builders. No Prisma/React imports; unit tested via `node:test`, reused server- and client-side |
| `tw-plans.ts` | Prisma CRUD layer for `TerritoryWarPlan`/`ZonePlan`/`PlayerAssignment`/`AttackAssignment`/`StrategyTemplate`/`TwCommand`/`TerritoryBattlePlan`/`PlanetPlan`, incl. `getOrCreateActivePlan`, `getPlanDetail`, `getCurrentTwEventId`, `updateTemplate`/`deleteTemplate`/`setPlanTemplate`, `ensureBuiltInCommands`/`listCommands`/`createCommand`/`updateCommand`/`deleteCommand`, `getOrCreateActiveTbPlan`/`getTbPlanDetail`/`setTbPlanStatus`/`upsertPlanetPlan`/`deletePlanetPlan`/`getCurrentTbEventId` |
| `tw-view.ts` | Pure adapter mapping Prisma-persisted TW plan shapes into the plain data shapes `tw-planning-engine.ts` expects (incl. `buildPool`, `buildEffectiveZones`, `buildAssignmentRecords`, `CommandSummary`); no Prisma/React imports |

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
- **A shared component rendered on every route (e.g. `SiteHeader`) must use `next/link`, not `<a href>`, for internal links** — plain anchors force a full hard browser reload on every navigation even though the rest of the app is client-routed. This was the single biggest cause of "slow page switching" once `SiteHeader` became universal in v0.18.2.
- **Blanket `dynamic = "force-dynamic"` on every route means zero caching anywhere.** Since guild data only changes on the (Hobby-capped) once-daily cron sync, subpages that don't read cookies are safe to run as `revalidate = 300` ISR instead — cutting DB load and response time with negligible staleness risk. Only pages using `cookies()`/`headers()` (session-dependent) need to stay fully dynamic.
- **Prisma `include` pulls every scalar column of a relation, including large `Json` columns.** Always use explicit `select` on models with heavy JSON fields (`GuildSnapshot.rawPayload`, `Player.profilePayload`) unless the caller genuinely needs them — several lib functions were unknowingly fetching multi-KB JSON blobs per member on every request.
- **Syncing a prop into local state without tripping `react-hooks/set-state-in-effect`:** calling `setState` inside a `useEffect(() => setState(prop), [prop])` is flagged because it causes a redundant extra render. React's documented fix is to compare against a shadow "synced" state value **during render** and call `setState` conditionally in the render body itself (not inside an effect) — React de-dupes the resulting re-render. Used in `tw-workspace.tsx` to resync its local plan state after `router.refresh()`.
- **A pure, dependency-free "engine" module (no Prisma/React imports) can be imported directly into both server code and `"use client"` components.** The TW planning engine (`lib/tw-planning-engine.ts`, `lib/tw-view.ts`) is used this way — client components recompute warnings/recommendations/reserves live from already-fetched data with zero extra network round trips, and only real persistence needs an API route. This removed the need for any GET routes under `/api/officer/tw/*` entirely.

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

- Guild-wide UX pass: player-card-style detail (full stat cards) should stay on `/members`; every other destination should default to collapsed/searchable rows and only expand a member on demand. Territory War's roster and the new Raids board (v0.20.0/v0.21.0) follow this pattern.
- **Comlink guild-data boundary (confirmed 2026-08-21 against the swgoh-comlink wiki):** the public `/guild` endpoint only returns live status for Territory War (`territoryWarStatus`) plus historical results for TW (`recentTerritoryWarResult`) and raids (`recentRaidResult`, last completed attempt per raid only). `territoryBattleStatus`, `territoryBattleResult`, and `raidStatus` (live) are **not returned** outside the guild's own account — there is no live TB/raid pipeline to build without a member-authenticated data source. Territory Battles stays a live-baseline-only page until that changes; Raids now uses `recentRaidResult` (see `lib/raids.ts`).
- SWGOH.gg as an optional secondary data source (pending API approval) — see root `README.md`
- Officer moderation queue for approving/rejecting pending Soul Food Cantina recipe submissions
- ~~Add officer-owned TW defensive assignments and counter notes on top of the read-only live board~~ — done in v0.22.0 (§5.9, the TW command tool). Still open: investigate whether Comlink's per-zone `warSquad` field (currently untyped/unused) can drive a deployed-squad composition view once a fuller unit-name map exists (today `lib/unit-checklist.ts` only names ~50 priority units).
- ~~Per-officer attribution for the TW command tool~~ — done in v0.23.0: `lib/officer-identity.ts` best-effort-resolves a display name off the member-link cookie for `createdBy`/`updatedBy` on plans, zones, assignments, and attacks (§5.9). Officer *authorization* is still one shared password/session (§5.4) — this only adds attribution on top of it, not per-officer accounts/permissions.
- ~~Strategy template authoring UI~~ — done in v0.23.0: the Templates mode in the TW command tool CRUDs `StrategyTemplate.rules` and applies one to a plan; `generateRecommendations()` now takes those rules as an optional 4th argument (§5.9).
- ~~CI doesn't currently build/lint the `web/` app~~ — done: `ci.yml` runs `npm run lint`, `npm run typecheck`, and `npm run test` for `web/` on every push/PR.
- ~~TW defence assignment is per-player drag-and-drop with a fabricated win%~~ — done in v0.25.0: rebuilt around shared, reusable **Commands** (`TwCommand`) assigned per zone, an honestly-labeled **hold-confidence** heuristic instead of a fake win probability, and the same Command concept extended to a new Territory Battle command tool (per-planet, per-phase pre-load/3-star/hold/skip strategy calls) — §5.9, §5.14.
- **Two-way Discord sync.** Today Discord integration is one-way only: `lib/discord.ts` posts announcements via webhook and removes a departed member's role via the bot token (both called from `lib/guild-sync.ts`). There is no listener for Discord → site (e.g. relaying an announcement channel's messages onto the Guild Wire). A real bot presence (gateway websocket) can't run on Vercel's serverless functions — it needs a small always-on worker, similar to how the self-hosted Comlink service is deployed (see §2). Needs a hosting decision before building.
- **Member lifecycle / access tiers.** `MembershipState` is currently just `ACTIVE`/`LEFT` (see §6, `prisma/schema.prisma`). There's no "recruitment-only" access tier for players who join the in-game guild but never link Discord, and no automated prompt-to-join-Discord flow beyond the static invite link. Needs a schema addition (e.g. an access-level field on `Player` or `MembershipTerm`) plus site-auth gating (`lib/member-auth.ts`) before it can be built.

---

## 16. Changelog

### 1.18.0 — 2026-08-31
- Documented the deterministic Mission From God Phase 1 engine, invariants, initial balance and 6,000-run simulation results introduced in site v0.30.0.

### 1.17.1 — 2026-08-31
- Documented the staged Mission From God specification, resolved competitive-game rules, and public/retained attribution introduced with site v0.29.1.

### 1.17.0 — 2026-08-24
- Replaced the TW command tool's per-player drag-and-drop defence assignment with a **Command**-based workflow, per direct officer feedback that the old flow was too fiddly. Officers now pick a zone and assign a named, reusable squad+kit preset (`TwCommand`; 12 built-in presets seeded per guild plus fully custom ones) instead of placing individual players. Added an honestly-labeled **hold-confidence** heuristic (`computeHoldConfidence()`) — a 0–100 score/label derived from squad counter-vulnerability and roster backup depth — explicitly *not* a fabricated true win percentage, since Comlink doesn't expose opponent defense composition. Extended the same Command concept to a brand-new **Territory Battle command tool** (§5.14) on `/territory-battles`, letting officers set a pre-load / push-3★ / hold / skip strategy (and optional Command) per planet, per phase (Day 1–6), using real ROTE planet names for suggestions. New models `TwCommand`, `TerritoryBattlePlan`, `PlanetPlan` (+ `TbStrategy` enum, reused `TwPlanStatus`); new routes `/api/officer/tw/commands`, `/api/officer/tb/plan`, `/api/officer/tb/planets`; new modules `lib/tw-commands.ts`, `app/territory-battles/tb-workspace.tsx`. Tracks site v0.25.0.

### 1.16.1 — 2026-08-24
- Documented drag-and-drop defence assignment in the TW command tool (§5.9): dragging a player from the new "Available defenders" chip list or an existing assignment row onto a zone tab/assignment list now assigns/moves it, with an inline squad-correction select and the manual dropdown form kept as a touch-device fallback. Tracks site v0.24.0.

### 1.16.0 — 2026-08-24
- Documented the three roadmap items closed out this pass (§15, §5.9, §6–§8): CI now lints/typechecks/tests `web/` on every push; `lib/officer-identity.ts` gives the TW command tool best-effort per-officer attribution (`createdBy`/`updatedBy` on plans, zones, assignments, attacks, shown as "by &lt;name&gt;" in the UI) off the existing member-link cookie, with a generic fallback so writes are never blocked; and a new Templates mode CRUDs `StrategyTemplate.rules` (`zonePriority`/`squadPriority` overrides) and applies one to a plan, with `generateRecommendations()` taking the active template's rules as an optional 4th argument. New route `/api/officer/tw/templates` and new module `lib/officer-identity.ts`. Tracks site v0.23.0.

### 1.15.0 — 2026-08-24
- Documented the Territory War command tool rebuild (§5.9): the officer-authored, versioned `TerritoryWarPlan`/`ZonePlan`/`PlayerAssignment`/`AttackAssignment`/`StrategyTemplate` data model (§6), the six new `/api/officer/tw/*` routes (§7), the four new `lib/tw-*.ts` modules including the pure client-and-server planning engine (§8), the render-phase prop-sync and pure-engine-reuse lessons (§13), and closed out the roadmap item this fulfilled while adding two new ones (per-officer attribution, strategy template authoring UI) (§15). Tracks site v0.22.0.

### 1.14.0 — 2026-08-22
- Added the officer-only Roster Report (`/officer/roster`, `lib/officer-roster.ts`, §5.13): a filterable/sortable table of the full guild history (active + departed members) with tickets, last-raid participation/damage, TW joined status, tenure, and computed "needs attention" flags. Territory Battle stays a "No data" placeholder column per the documented Comlink boundary. Also fixed the member trading-card `<dialog>` rendering pinned to the top-left instead of centered on screen.

### 1.13.0 — 2026-08-21
- Documented the Raids page's real `recentRaidResult` data (`lib/raids.ts`, `app/raids/raid-board.tsx`) and the confirmed Comlink guild-data boundary: no live Territory Battle or raid status is available outside the guild's own account, only completed-run results. Updated Territory Battles page copy to state this plainly. Tracks site v0.21.0.

### 1.12.0 — 2026-08-21
- Documented the TW roster's switch to collapsed/searchable rows, the multi-category Wall of Fame, the expanded Wall of Shame reasons, and the resulting roadmap split for two-way Discord sync and member access tiers, tracking site v0.20.0.

### 1.11.0 — 2026-08-21
- Documented the performance pass in site v0.19.0: the new `lib/guild-snapshot.ts` shared/cached query helper, the shift from blanket `force-dynamic` to `revalidate = 300` on cookie-free subpages, and the `next/link` navigation fix.

### 1.10.4 — 2026-08-21
- Documented the removal of the detached subpage toolbar and the integrated hero navigation introduced in site v0.18.4.

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
