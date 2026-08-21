# Changelog

This project uses semantic versioning while it is under active development.

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
