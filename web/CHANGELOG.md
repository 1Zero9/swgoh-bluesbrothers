# Changelog

This project uses semantic versioning while it is under active development.

## 0.27.0 — 2026-08-29

- **New Feature: Datacrons Vault & Active Meta Codex (`/datacrons`)**:
  - Created a dedicated Datacrons Hub aggregating live member datacrons and active SWGOH seasonal sets.
  - **Guild Datacron Vault**: Search and filter guild datacrons by Tier (Level 9 Character, Level 6 Faction, Level 3 Alignment), Set, Member, or Rolled Stats. Includes a Member Leaderboard and Signature Character Weapon Roster.
  - **Active Sets & Meta Codex**: Full tactical guide to active SWGOH seasons (Set 20 Imperial/Rebel, Set 19 Republic/Separatist, Set 18 Mando/Sith) with complete breakdowns of Tier 9, Tier 6, and Tier 3 abilities, recommended squad lineups, and TW ratings.
  - **Territory War Command Synergies**: Strategic guide linking high-impact datacrons directly to TW Frontline Defence and Offence nuke assignments.
  - **Reroll & Farming Advisor**: Optimization guide on material thresholds, stat priorities, and Conquest energy investment.
  - Added Datacrons (`DC`) to the top site navigation (`SITE_NAVIGATION`) and Operations launch deck.

## 0.26.3 — 2026-08-29

- **Page Scroll & Stacking Polish (`/dougies-discs` & Site-wide)**:
  - Fixed site header stacking and clipping by moving `SiteHeader` outside isolated hero containers and increasing fixed navbar z-index to `800` with an opaque, blurred backdrop (`rgba(5, 8, 14, 0.94)`).
  - Added a **Persistent Floating Mini-Player Bar** at the bottom of the screen when scrolled past the turntable deck, complete with mini spinning vinyl, track details, playback buttons, volume control, Up Next counter, and an **`↑ Turntable`** smooth jump button.
  - Added a **Crate View Switcher** (`▦ Sleeves` vs `☰ Compact`) allowing users to switch between the 3D retro vinyl sleeve gallery and a sleek, high-density table view with inline spin/queue actions.
  - Added clean scroll margins (`scroll-margin-top: 88px`) and jump buttons (`📂 Dig in Crate (29)`) for effortless navigation.

## 0.26.2 — 2026-08-29

- **Enhanced Up Next Queue & Playlist Management (`/dougies-discs`)**:
  - Fixed asynchronous queue transition and auto-advance by synchronizing live refs for `queue`, `currentTrack`, `catalog`, and playback modes across YouTube iframe state callbacks.
  - Added an inline **⚡ Quick Add** search input with live autocomplete dropdown right inside the Up Next drawer.
  - Added one-click **Crate Preset buttons** (`🕶️ +Blues Brothers`, `🎷 +Chicago Blues`, `🎲 +5 Random`) to fill the queue in one click.
  - Added multi-action buttons on every vinyl card: **▶ Spin**, **⚡ Next** (places track at position #1 to play right after the current song), and **＋ Queue** (appends to end).
  - Added live **"Up Next: [Track]" preview banner** with **▶ Spin Next** button inside the Now Playing LED display.
  - Added per-item controls in Up Next: **▶ Spin**, **▲ Move Up**, **▼ Move Down**, and **✕ Remove**.

## 0.26.1 — 2026-08-29

- **Tightened Cockpit & Above-the-Fold Controls (`/dougies-discs`)**: streamlined Dougie's Discs page hero and integrated the turntable, LED Now Playing readout, tactile playback buttons (⏮, ▶ SPIN / ⏸ PAUSE, ⏭, 🔀, 🔁, Volume slider, Mute, Queue), and Up Next list into a unified compact cockpit so controls are immediately reachable without scrolling.
- **Direct YouTube Audio Playback & Catalog Fix**: verified and updated all 29 track YouTube IDs with live 200 OK embeds across the Blues Brothers and Chicago blues catalog, resolved background media power throttling on audio playback, and added direct postMessage + iframe playback hooks.

## 0.26.0 — 2026-08-29

- **Dougie's Discs galactic Jukebox (`/dougies-discs`)**: new interactive music lounge with custom tavern header art (`/dougies-discs.png`), Blues Brothers movie hits, Chicago blues, Stax soul, and community suggestions.
- **Turntable & Video Stage**: photorealistic 33⅓ RPM rotating vinyl record with color-coded center labels, dynamic tonearm, 12-band pulsing spectrum equalizer, and seamless toggle to full YouTube video stage.
- **Interactive Queue & Crate Digging**: live queue manager with reordering/removal, crate search & category filters (*Blues Brothers*, *Chicago Blues*, *Stax & Soul*, *Delta & Roots*, *Guild Picks*), and local storage persistence.
- **Song Submissions & Soundboard**: guild members can suggest any YouTube track via an instant live-thumbnail validator (`/api/discs/submissions`) and drop synthesized Blues Brothers quotes & needle-drop drops.

## 0.25.0 — 2026-08-24

- **Command-based TW defence assignment**: replaced per-player drag-and-drop with named, reusable squad+kit presets ("Commands") that officers assign directly to a zone — pick a zone, pick a Command (e.g. "GL Vader + Datacron"), done. Every guild gets 12 built-in Commands for free (one per known TW squad) plus fully custom ones officers create inline. New `/api/officer/tw/commands` route and `TwCommand` model.
- **Hold-confidence heuristic**: each zone now shows an honestly-labeled 0–100 hold-confidence score ("Strong Hold"/"Likely Hold"/"Contested"/"Vulnerable") derived from the assigned squad's known counter-vulnerability and available backup depth — explicitly not a fabricated win percentage, since Comlink doesn't expose opponent defense composition.
- **Territory Battle command tool**: new officer planning section on `/territory-battles` using the same Command concept — set a pre-load / push-3★ / hold / skip strategy (and optional Command) per planet, per phase (Day 1–6), with real ROTE planet-name suggestions. New `TerritoryBattlePlan`/`PlanetPlan` models and `/api/officer/tb/plan` + `/api/officer/tb/planets` routes. Sits alongside (not replacing) the existing GP/star optimizer.
- See `docs/knowledge-base.md` §5.9/§5.14.

## 0.24.0 — 2026-08-24

- **Drag-and-drop defence assignment**: in the Territory War command tool's Defence mode, officers can now drag a joined member from a new "Available defenders" chip list straight onto a zone (auto-picks the player's first eligible squad), and drag an existing assignment row onto a different zone tab to move it. Every assignment row also gets an inline squad-correction dropdown, since the drop no longer requires manually selecting a squad. The original manual "Player"/"Squad" form stays as a fallback for touch/mobile devices, since native drag-and-drop is desktop/mouse-only.

## 0.23.0 — 2026-08-24

- **Per-officer attribution**: the Territory War command tool now resolves a best-effort display name off the existing member-link Discord cookie and stamps it as `createdBy`/`updatedBy` on plans, zones, assignments, and attacks, shown as "by \<name\>" throughout the tool. Writes still work even when no name can be resolved (falls back to a generic "Officer" label) — this adds attribution on top of the existing shared officer password, not per-officer accounts.
- **Strategy templates**: a new Templates mode lets officers save, edit, and apply named zone/squad priority presets (`StrategyTemplate`) to a plan; the recommendation engine now factors the active template's zone-fill order and preferred-squad order into its suggestions. New `/api/officer/tw/templates` route.
- CI now runs `web`'s lint, typecheck, and test suite on every push and pull request.

## 0.22.0 — 2026-08-24

- **Territory War command tool**: rebuilt `/territory-war` from a themed read-only dashboard into a practical, multi-phase officer planning tool on top of the existing live TW data. Officers now get a persisted, versioned `TerritoryWarPlan` with per-zone setup, exact player → squad → zone assignments (with a full status lifecycle and recommended/manual source tracking), live conflict/warning detection, an offence-reserve health panel, a player workload view, a manually tracked attack board, and a Discord hand-off (guild strategy message + per-player personal messages). An explicit "Generate Recommendations" step proposes assignments for officer review — nothing is auto-committed. Adds 5 new Prisma models, 6 new `/api/officer/tw/*` routes, and 4 new `lib/tw-*.ts` modules; the underlying live registration/battle-map/roster board above the tool is unchanged. See `docs/knowledge-base.md` §5.9.

## 0.21.0 — 2026-08-21

- **Raid operations** gained real data: `lib/raids.ts` reads Comlink's `recentRaidResult` from the latest guild snapshot and surfaces the last completed attempt for every raid the guild runs, with a searchable, ranked-by-damage participant board (`app/raids/raid-board.tsx`) per raid type.
- Researched Comlink's actual guild-data boundaries: `territoryBattleStatus`/`territoryBattleResult`/`raidStatus` (live states) are not returned by the public `/guild` endpoint outside the guild's own account — only `recentRaidResult` (last completed raid attempt) and `recentTerritoryWarResult`/`territoryWarStatus` (already used) are available. The Territory Battles page copy now states this plainly instead of implying a TW-style live pipeline is coming.
- Updated the homepage raid mission card to reflect that results are now tracked.

## 0.20.0 — 2026-08-21

- **Territory War roster** switched from a grid of always-expanded player cards to a compact, collapsible row list (native `<details>`/`<summary>`), so officers scanning a 50-member war can scan names/locked GP/joined status at a glance and expand only the members they need. Search, registration filter and sort are unchanged.
- **Wall of Fame** rebuilt as a multi-category leaderboard (`lib/wall-of-fame.ts` now returns `WallOfFameCategory[]`) with tabs for Galactic Power, Raid Tickets, Galactic Legends, Relic Units and Datacrons, instead of a single GP-ranked top five. New client component `app/wall-of-fame-board.tsx` renders the tab switcher.
- **Wall of Shame** gained two more attention reasons — raid tickets running low (below half the per-member target) and profiles that haven't rotated through the hourly sync in 7+ days — alongside the existing under-geared/inactivity checks, and now surfaces up to 8 members (was 5), sorted by how many reasons are flagged. The `/members` roster page's attention badges now also consider profile staleness.

## 0.19.1 — 2026-08-21

- Swapped the `tw-banner`/`ops-banner` image content: Territory War now shows the sector/territory network hologram, Operations now shows the mission-briefing holotable — the two had been assigned to the wrong pages since the artwork was first added in v0.18.0.

## 0.19.0 — 2026-08-21

- **Performance pass** to fix slow desktop loads and slow page-to-page navigation:
  - Converted the shared `SiteHeader` and `MobileMenu` primary navigation from plain `<a>` tags to `next/link`, eliminating full hard-reloads on every page switch (the header renders on every route, so this was the biggest single win).
  - Added `lib/guild-snapshot.ts`, a request-memoized (`React.cache()`) shared query for the latest guild snapshot + members, replacing three independent full-guild Prisma queries that were previously fired in parallel on the homepage alone.
  - Trimmed Prisma `include`s to explicit `select`s across `wall-of-fame.ts`, `wall-of-shame.ts`, `members.ts`, `guild-arsenal.ts`, and `member-context.ts`, dropping unused `rawPayload`/`profilePayload` JSON blobs from queries that didn't need them.
  - Replaced blanket `dynamic = "force-dynamic"` with `revalidate = 300` (5-minute ISR) on the seven subpages that don't read cookies, so they now serve prerendered/cached responses instead of re-querying the database on every request. The homepage stays fully dynamic (it reads session cookies).
  - Added a root `app/loading.tsx` skeleton for the homepage's dynamic render.
  - Converted all hero banner and logo images from lossless PNG to WebP (~90–95% smaller: banners ~2–2.5MB → ~140–235KB, logo 1.65MB → 54.5KB at a trimmed 512×512), and removed the orphaned unused `welcome-banner.png`.

## 0.18.4 — 2026-08-21

- Removed the standalone subpage navigation toolbar and integrated the complete site header into every hero.
- Kept the desktop links, theme controls, version and Discord action over the banner artwork, with the existing mobile drawer at smaller breakpoints.
- Gave the Credits page an integrated dark command header so no public destination retains the detached toolbar.

## 0.18.3 — 2026-08-21

- Made every shared internal-page hero span the full viewport directly below the site header, matching the homepage's edge-to-edge treatment.
- Removed the card-like outer rounding while keeping hero text and controls aligned to the 1220px content grid.
- Preserved responsive banner focal points and full-bleed behavior on phone and tablet layouts.

## 0.18.2 — 2026-08-21

- Replaced the subpage breadcrumb bar with the complete homepage header on every public destination.
- Centralized the logo, primary navigation, version, theme controls, Discord action, and responsive mobile drawer in one shared `SiteHeader` component.
- Added light-theme and phone/tablet styling for the shared subpage header while retaining the homepage overlay treatment.

## 0.18.1 — 2026-08-21

- Restored the original `bb-title.png` neon-sign artwork as the homepage hero image.
- Made the internal-page header bar (back link + related destinations) span the full viewport width on every subpage, matching the homepage header treatment.

## 0.18.0 — 2026-08-21

- Added the supplied Welcome, Operations, Territory War, Territory Battle, Raid, Arsenal, Members, and Cantina banner artwork to the matching destinations.
- Introduced one shared responsive internal-page hero with consistent image treatment, typography, gradients, spacing, and accessible alternative text.
- Added dedicated `/territory-battles` and `/raids` readiness pages and promoted their Operations cards from reserved anchors to real routes.
- Tuned wide-banner focal points, hero content, operation shortcuts, and planning cards for desktop, tablet, and mobile layouts.

## 0.17.0 — 2026-08-21

- Added a dedicated Operations hub with prominent shortcuts for Territory War, Territory Battles, raids, and the Guild Arsenal.
- Made Territory War and Operations direct destinations in the desktop and mobile primary navigation.
- Moved the complete member directory and Soul Food Cantina from the increasingly long homepage onto `/members` and `/cantina`.
- Kept compact mission cards on the homepage while linking them into the new route structure.

## 0.16.0 — 2026-08-21

- Added a responsive Territory War room with live registration, locked GP, guild matchup, scores, zone state, commands, and roster readiness.
- Started normalizing active TW status and recent results from the existing Comlink guild response into `GuildEvent` and hourly `EventSnapshot` history.
- Added searchable registration/readiness member cards with current or locked GP, Galactic Legends, relic units, datacrons, activity, and profile-sync clarity.
- Turned the Territory War operations card into a working route while retaining an honest pre-war state when no active event is present.

## 0.14.0 — 2026-08-21

- Replaced café prices and mock ordering with complete, selectable sandwich recipes.
- Added PostgreSQL-backed published recipes with structured ingredients, methods, and beer-pairing data, seeded through a migration.
- Added a complementary beer advisor with crisp, hoppy, malty, and alcohol-free recommendations for every recipe.
- Added a public recipe-submission form and protected API that saves new ideas as pending moderation records.

## 0.13.0 — 2026-08-21

- Added the Soul Food Café as a warm, self-contained destination within the guild dashboard.
- Added six selectable sandwiches inspired by well-known sandwich traditions, led by the café&apos;s Pork Sandwich.
- Added an interactive sandwich maker with bread, main filling, cheese, extras, live pricing, and a kitchen order ticket.
- Added responsive café navigation, custom sandwich illustrations, and mobile layouts without introducing third-party image assets.

## 0.12.0 — 2026-08-20

- Added a live Guild Arsenal showing ownership, seven-star and relic coverage for Galactic Legends, priority units, and capital ships.
- Adapted the priority-unit checklist from the MIT-licensed SWGoHBot project with full in-repo and user-facing attribution.
- Added a Sources & Credits page and third-party notices for open-source dependencies and reused data.
- Documented the wider SWGOH open-source landscape and a licence-aware feature adoption backlog.

## 0.11.0 — 2026-08-20

- Softened the dashboard with roomier spacing, rounded surfaces, layered shadows, and more clearly defined cards.
- Expanded member cards with guild role, player level, Galactic Legends, raid tickets, and guild tenure.
- Added richer member profiles with character/ship GP, relic-unit and datacron counts, activity, and join history.
- Persisted the complete guild/member payload on hourly snapshots and added rotating full player-profile enrichment.
- Added historical player-profile aggregates while retaining each player&apos;s complete latest Comlink profile.

## 0.10.0 — 2026-08-20

- Replaced the roster summary with a searchable, sortable directory and one interactive card per member.
- Added member detail dialogs with guild rank, galactic power, raid tickets, activity, tenure, and attention status.
- Reworked the Wall of Fame and officer watchlist into a compact, linked standings board with clearer hierarchy.
- Simplified the lower dashboard into focused personal-account and officer-work areas.

## 0.9.0 — 2026-08-19

- Added the Wall of Fame: a leaderboard celebrating the guild's top galactic power and maxed raid-ticket members.

## 0.8.0 — 2026-08-19

- Added Discord OAuth account linking with ally-code verification, so members can prove ownership of their roster entry.
- Fixed the previously dormant departure automation by giving members a way to actually set `discordUserId`.
- Added a personalized "cantina card" on the Members panel showing linked members their live GP, raid tickets, and Wall of Shame status.

## 0.7.0 — 2026-08-19

- Wired the dashboard metric cards to the latest live guild snapshot instead of static placeholders.
- Added the Wall of Shame: a themed bulletin surfacing under-geared or inactive members from the latest sync.
- Added an officer's desk with a shared-password sign-in and a composer that posts Cantina notices straight to the Guild Wire and Discord.
- Made the automation feed, roster preview, and Discord sync status reflect real data across desktop and mobile.

## 0.6.0 — 2026-08-19

- Added the Guild Wire as the shared website and Discord communications feed.
- Added a protected daily roster sync with a safe first-run membership baseline.
- Added automatic welcome and departure announcements through Discord.
- Added Discord member-role removal for departed players with verified account mappings.
- Added the optional official Discord server-presence widget and direct conversation links.

## 0.5.0 — 2026-08-19

- Added Prisma 7 with the PostgreSQL driver adapter.
- Added deploy-time Prisma Client generation.
- Added configuration for pooled runtime and optional direct migration URLs.
- Added a non-sensitive database health endpoint.

## 0.4.5 — 2026-08-19

- Lowered the desktop logo, navigation, and utilities to align with the cantina sign.
- Returned the hero heading group closer to its natural lower composition.
- Retained tighter top spacing for tablet and phone drawer layouts.

## 0.4.4 — 2026-08-19

- Increased desktop navigation labels from 14px to 17px.
- Shifted navigation toward the logo while retaining right-aligned utilities.
- Reduced the logo by 20% across desktop, tablet, and phone layouts.

## 0.4.3 — 2026-08-19

- Removed the permanently selected Command centre item.
- Reduced primary navigation to Operations, Members, and Administration.
- Increased spacing between the remaining desktop menu labels.
- Removed the default selected state from the tablet and mobile drawer.

## 0.4.2 — 2026-08-19

- Added left-to-right lightsaber ignition underlines to desktop navigation.
- Added matching hover and keyboard-focus effects to drawer navigation.
- Preserved a visible ignited blade for the current section.

## 0.4.1 — 2026-08-19

- Lifted the complete hero content group higher within the artwork.
- Increased desktop navigation text to improve prominence and readability.
- Applied smaller proportional hero adjustments for tablet and phone layouts.

## 0.4.0 — 2026-08-19

- Added a dedicated tablet and mobile navigation drawer.
- Added keyboard Escape handling, background scroll locking, and larger touch targets.
- Reflowed event and administration panels for tablet and phone layouts.
- Retained the transparent desktop navigation over the hero.

## 0.3.2 — 2026-08-19

- Enlarged the guild emblem to roughly two-and-a-half times its previous desktop size.
- Returned primary navigation to the top of the hero without a container background.
- Replaced the active menu pill with a subtle neon underline.

## 0.3.1 — 2026-08-19

- Removed the framed navigation bar from the hero artwork.
- Moved primary navigation into the gradient transition below the image.
- Reduced the hero overlay to an unframed logo and compact utility controls.

## 0.3.0 — 2026-08-19

- Added the default dark-to-desert gradient theme.
- Made the hero artwork span the full viewport width.
- Replaced the sidebar with a floating responsive navigation bar.
- Expanded the theme control to Gradient, Light, and Dark modes.

## 0.2.0 — 2026-08-19

- Added the original Blues Brothers guild emblem and browser icon.
- Added persistent light and dark colour modes.
- Reworked the visual system around the desert cantina hero artwork.
- Added the application version to the command header and footer.

## 0.1.0 — 2026-08-19

- Created the initial guild command-centre placeholder.
- Added guild health, events, membership, and administration panels.
- Added the proposed Prisma data model and Vercel setup notes.
