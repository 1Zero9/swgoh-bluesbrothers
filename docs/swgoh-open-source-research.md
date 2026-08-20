# SWGOH open-source repository research

**Reviewed:** 2026-08-20

This note records which public SWGOH projects can add value to the Blues
Brothers guild site, what we can safely reuse, and where licence or maintenance
risk means we should only borrow product ideas.

## Decision summary

| Project | Useful features | Licence / state | Decision |
|---|---|---|---|
| [jmiln/SWGoHBot](https://github.com/jmiln/SWGoHBot) | Guild tickets, key-unit checklists, event calendar, journey readiness, arena tracking | MIT; actively maintained TypeScript | **Adopt selectively.** The first reuse is its priority-unit checklist, adapted into `/arsenal` with the MIT notice retained. Journey readiness is the best next candidate. |
| [swgoh-utils/swgoh-stats](https://github.com/swgoh-utils/swgoh-stats) | Current-stat and GP calculation directly from Comlink-format rosters | MIT; active; separate Node microservice and game-data cache | **Strong candidate.** Add only when the UI has a clear stat/mod analysis feature; running another service adds operational cost. |
| [Crinolo/swgoh-stat-calc](https://github.com/Crinolo/swgoh-stat-calc) | Character/ship stat and GP calculation library | MIT; foundational but last pushed in 2023 | **Reference/fallback.** Prefer `swgoh-stats`, which wraps the calculator for current Comlink data. |
| [grandivory/mods-optimizer](https://github.com/grandivory/mods-optimizer) | Mod scoring, character targets, full assignment optimizer | MIT; mature React app, substantial legacy architecture | **High value, later phase.** Reuse domain/optimizer logic only after we have mod inventory and calculated stats; do not transplant its UI wholesale. |
| [PixEye/juke-swgoh-bot](https://github.com/PixEye/juke-swgoh-bot) | Player/guild evolution tracking, GL and conquest checks | Apache-2.0; actively updated JavaScript bot | **Adopt the pattern, not the bot.** Our snapshots already support seven-day GP/GL/relic deltas; build this natively and retain attribution if code is reused. |
| [NducTiOnomBi/swgoh-stackrank](https://github.com/NducTiOnomBi/swgoh-stackrank) | Community character tiers, synergy and omicron-aware roster ranking | MIT; active data project | **Optional.** Useful for a clearly labelled, subjective roster-depth score; never present it as an objective member grade. |
| [brent-law/swgoh-ROTE-calculator](https://github.com/brent-law/swgoh-ROTE-calculator) | ROTE operations assignments, blockers, day plans and PDF exports | AGPL-3.0; active Python desktop/web app | **Study only for now.** Copying/adapting it would require AGPL compliance for the combined network application. Build an independent planner from game data if desired. |
| [genskaar/tb_empire](https://github.com/genskaar/tb_empire) | Interactive ROTE planet map and mission/squad reference | No clear root licence; README refers to inherited upstream terms | **Ideas only.** Do not copy code or assets until provenance and licence are unambiguous. |
| [KNCn23/swgoh-planner](https://github.com/KNCn23/swgoh-planner) | Portrait roster, zeta/omicron detection, farm watchlist and gap analysis | No licence | **Ideas only.** Its product direction is useful, but copyright defaults prohibit code reuse without permission. |
| [swgoh-utils/gamedata](https://github.com/swgoh-utils/gamedata) | Frequently refreshed raw game-data snapshots | GPL-3.0 | **Do not vendor casually.** Prefer fetching the required game-data segments from our Comlink service and storing only derived metadata. |
| [swgoh-utils/swgoh-comlink](https://github.com/swgoh-utils/swgoh-comlink) | Live guild/player/game-data bridge | No detected licence in the repository | **Use as an external service only.** We already call it; do not copy its implementation into this repo without clarified permission. |

## Prioritised feature backlog

1. **Guild Arsenal — implemented:** collection coverage for Galactic Legends,
   priority characters and capital ships, calculated from stored player
   profiles. Source checklist and MIT attribution are included in the repo.
2. **Journey readiness:** per-member and guild-wide requirement gaps for GLs,
   legendary characters and capital ships. Adapt the small requirement-checking
   model from SWGoHBot, but generate current names/requirements from Comlink game
   data so the feature does not depend on manually copied files.
3. **Roster evolution:** seven-day and thirty-day GP, relic, GL and datacron
   changes using our own snapshots. Juke demonstrates the value; our data model
   already holds the history.
4. **Guild farming targets:** officer-selected units with ownership/relic gaps,
   using Arsenal calculations rather than a fixed public tier list.
5. **Mod/stat lab:** deploy `swgoh-stats` and expose calculated speed/health and
   mod-quality views. Consider Grandivory's optimizer only after this foundation
   is reliable.
6. **ROTE planner:** a separate, carefully scoped project. Avoid AGPL/unlicensed
   source reuse unless we intentionally choose those obligations.

## Licence rules for future imports

- MIT and Apache-2.0 code may be adapted, but retain the required copyright,
  licence and NOTICE text in `web/THIRD_PARTY_NOTICES.md`.
- GPL/AGPL code is not copied into the site without an explicit project-wide
  licensing decision.
- A public GitHub repository with no licence is **not** permission to copy.
- Product ideas and independently implemented behaviours are acceptable; source
  code, data files, artwork and wording require separate licence review.
- Record the upstream repository, exact file(s), commit and local destination
  whenever another import is made.

## First import provenance

- Upstream: `jmiln/SWGoHBot`
- Upstream file: `data/unitChecklist.json`
- Upstream licence: MIT, copyright Jeffrey Milner
- Local adaptation: `web/lib/unit-checklist.ts`
- User-facing feature: `web/app/arsenal/page.tsx`
- Notice: `web/THIRD_PARTY_NOTICES.md` and `/credits`
