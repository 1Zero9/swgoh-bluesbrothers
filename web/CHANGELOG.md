# Changelog

This project uses semantic versioning while it is under active development.

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
