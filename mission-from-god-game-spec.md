# MISSION FROM GOD
## Blues Brothers Galactic Trading Game — Product & Implementation Specification

**Project:** SWGOH Blues Brothers Guild Site

**Game Type:** Retro text-based economic trading / risk game

**Working Title:** **MISSION FROM GOD**

**Tagline:** *A Blues Brothers Galactic Trading Game*

**Implementation status:** Phase 1 deterministic core engine and balance simulator complete in site `v0.30.0`; Phase 2 Free Play UI, 12 launch encounters, Galactic News and versioned device-local autosave complete in site `v0.31.0`. Server persistence and competitive Daily play remain staged work.
**Primary Goal:** Create a highly replayable guild mini-game inspired by classic trading games such as Dope Wars, combining SWGOH economics, Star Wars encounters, Blues Brothers humour, daily competition, achievements, and persistent progression.

---

# 1. Product Vision

The player takes the role of **Jake or Elwood Blues**, travelling across the galaxy in a modified Imperial Lambda Shuttle known as the **Bluesmobile**.

The Penguin's orphanage is in trouble again. This time, **Jabba the Hutt owns the debt**.

The player has **30 Galactic Days** to trade gear, gamble, smuggle cargo, complete questionable jobs, evade bounty hunters and raise enough Credits to save the orphanage.

The game should feel like:

- Dope Wars / Drug Wars trading mechanics
- Star Wars underworld economy
- SWGOH gear frustration and in-jokes
- Blues Brothers humour and references
- 1980s terminal / arcade presentation
- A short game that can be played repeatedly
- A competitive guild activity rather than a one-off novelty

The most important design principle is:

> **Easy to understand, difficult to optimise, funny enough to replay.**

---

# 2. Core Story

The Penguin needs **1,000,000 Credits** to settle the orphanage tax debt.

Unfortunately, the debt has been acquired by Jabba the Hutt.

Jake and Elwood have 30 days to raise the money.

They have:

- A Bluesmobile
- Some starting Credits
- Limited cargo capacity
- Questionable judgement
- 30 days

They are, naturally:

> **On a Mission from God.**

---

# 3. Core Game Loop

Each run lasts a maximum of **30 Galactic Days**.

The basic loop is:

1. Arrive on a planet.
2. Review Galactic News and market conditions.
3. Buy and sell commodities.
4. Visit the Cantina if desired.
5. Manage missions, upgrades and cargo.
6. Select another planet.
7. Hyperspace travel consumes one day.
8. Prices change.
9. A random encounter may occur.
10. Repeat until Day 30 or the player settles Jabba's debt.

A run should typically take **10–20 minutes**, but progress should automatically save so it can be resumed.

---

# 4. Victory & Failure

## Primary Victory

The player must have sufficient liquid Credits to settle the remaining debt before the end of Day 30 and explicitly choose **PAY JABBA**. Paying ends the run immediately and records a victory; the player does not continue trading after the orphanage is saved.

Cargo and installed upgrades cannot be handed to Jabba as payment. They contribute to final net worth and scoring, but only liquid Credits can settle the debt.

Initial target:

**1,000,000 Credits**

## Day 15 Deadline

On Day 15 Jabba demands an interim payment of:

**250,000 Credits**

If paid:

- Deduct 250,000 Credits from the player.
- Reduce the remaining debt by 250,000 Credits.
- No penalty.

If unpaid:

- Apply permanent **Bounty Hunter Active** status.
- Increase Boba Fett encounter probability.
- Increase bounty/fine costs.
- Increase final score multiplier slightly to reward risky survival.

## Failure

The standard game ends after Day 30 if the debt remains unpaid.

However, the player should receive one final encounter with Jabba rather than an immediate generic Game Over screen.

Possible final options:

- **PAY JABBA** — available if sufficient Credits.
- **ONE HAND OF SABACC** — wager everything for a final chance.
- **RUN** — extremely low-probability Bluesmobile escape sequence.

## Resolved Run Rules

- The opening debt is exactly 1,000,000 Credits.
- The initial Phase 1 balance uses 18,000 starting Credits, subject to later play-test tuning.
- A successful Day 15 interim payment leaves 750,000 Credits of debt.
- The game ends immediately when the remaining debt is paid.
- Unsold inventory is valued at the current market price for final net worth and scoring only.
- A run that reaches the end of Day 30 without payment proceeds to the final Jabba encounter.
- Credits, inventory and debt use integer values; the engine must never use floating-point currency.
- Every state-changing action is atomic and idempotent so retries cannot duplicate purchases, rewards or payments.

---

# 5. Playable Characters

Character selection must influence strategy.

## Jake Blues

### Ability: We're Putting the Band Back Together

Advantages:

- +5% selling prices.
- Slightly improved Cantina/Sabacc odds.
- Improved dialogue/bluff outcomes.

Disadvantages:

- Increased Jabba interest or penalties.
- Slightly increased bounty hunter encounter rate.

## Elwood Blues

### Ability: It's Got a Cop Motor

Advantages:

- +10% starting cargo capacity.
- Reduced cargo loss during escapes.
- Improved escape probability.

Disadvantages:

- Slightly poorer merchant prices.
- Slightly worse gambling odds.

## Future Character/Crew System

Potential unlockable crew or support cards:

- Sister Mary Stigmata / The Penguin
- Cab Calloway
- Matt "Guitar" Murphy
- Aretha-inspired Cantina character archetype
- SWGOH/Star Wars allies

Crew should modify game mechanics rather than simply being cosmetic.

---

# 6. Galactic Locations

Initial release contains five locations.

## Tatooine

**Profile:** Salvage / Jawa economy

Characteristics:

- Increased chance of Jawa encounters.
- Cheap Stun Guns and salvage during fire sales.
- Kyrotech prices can crash.
- Moderate bounty risk.

## Coruscant

**Profile:** Stable metropolitan market

Characteristics:

- Large market.
- Lower volatility.
- Generally higher prices.
- Increased Imperial inspection probability.

## Cantonica

**Profile:** Gambling / luxury economy

Characteristics:

- High market volatility.
- Improved Cantina rewards.
- More gambling opportunities.
- Higher risk of scams.

## Corellia

**Profile:** Industrial / transport economy

Characteristics:

- Cheap Coaxium.
- Cheap Corellian Ale.
- Bluesmobile upgrades more common.
- Moderate volatility.

## Kessel

**Profile:** Contraband / high-risk economy

Characteristics:

- Excellent profit opportunities.
- Coaxium trading bonuses.
- Increased bounty hunter probability.
- Higher smuggling mission frequency.

---

# 7. Commodity Market

Initial commodities:

| Commodity | Market Behaviour | Suggested Base Range |
|---|---|---:|
| Omega Materials | Low volatility | 500–3,000 |
| Zeta Materials | Medium volatility | 3,000–15,000 |
| Kyrotech Shock Prods | High demand | 2,000–12,000 |
| Mk 12 Armatek Stun Guns | Extreme volatility | 1,500–18,000 |
| Corellian Ale | Cheap / bulk | 100–1,500 |
| Coaxium | Location dependent | 1,000–14,000 |

Exact ranges must be configurable rather than hard-coded.

## Price Generation

Commodity prices should consider:

- Commodity base price.
- Commodity volatility.
- Planet modifier.
- Current market event.
- Daily seeded randomness.
- Galactic News trend.
- Special event modifiers.

Conceptual formula:

```text
price = basePrice
      × planetModifier
      × volatilityModifier
      × activeEventModifier
      × seededRandomFactor
```

All values must remain within configured minimum/maximum boundaries.

---

# 8. Market Intelligence

Pure random pricing will eventually feel arbitrary. Players need incomplete information that allows strategic decisions.

## Galactic News Network

Each day displays several headlines.

Example:

```text
GALACTIC NEWS NETWORK
──────────────────────────────────

⚠ IMPERIAL RAID REPORTED ON KESSEL
▲ COAXIUM DEMAND RISING
● BOBA FETT LAST SEEN ON CORELLIA
▼ JAWA STUN GUN SURPLUS CONTINUES

──────────────────────────────────
DAY 17
13 DAYS REMAINING
```

News may:

- Indicate price direction.
- Foreshadow encounters.
- Indicate bounty hunter locations.
- Reveal temporary bonuses.
- Contain occasional unreliable information.

## Cantina Rumours

Rumours can be acquired through Cantina visits.

Example:

> Word is Lord Vader needs Kyrotechs.

Possible accuracy model:

- 70% accurate.
- 20% directionally accurate but exaggerated.
- 10% false.

Rumour accuracy should be configurable.

---

# 9. Player Dashboard

Always display:

- Character
- Current planet
- Current day
- Days remaining
- Credits
- Remaining Jabba debt
- Bounty level
- Bluesmobile cargo capacity
- Used cargo space
- Active upgrades
- Active missions
- Current inventory

Example:

```text
MISSION FROM GOD                  DAY 12/30
────────────────────────────────────────────
LOCATION                     CORELLIA
CREDITS                       184,750
JABBA DEBT                    750,000
BOUNTY                        ★★☆☆☆
BLUESMOBILE                   74 / 100
────────────────────────────────────────────
```

---

# 10. Inventory / Bluesmobile

The player's inventory is stored in the Bluesmobile.

Initial suggested capacity:

**100 cargo units**

Each commodity occupies configurable cargo space.

Initially, one item can equal one cargo unit for simplicity.

## Bluesmobile Upgrades

Players should be able to acquire upgrades during a run.

Suggested initial upgrade slots:

**3**

Possible upgrades:

| Upgrade | Effect |
|---|---|
| Expanded Cargo Hold | +25 capacity |
| Illegal Hyperdrive | Chance travel consumes no day |
| Reinforced Hull | Reduced cargo loss |
| Smuggler Compartments | Protect portion of inventory |
| L3 Navigation Computer | Improved market intelligence |
| Imperial Transponder | Reduced Imperial encounter probability |
| Cantina Mini-Bar | Improved Lando/Sabacc odds |

Players cannot equip every upgrade, creating build choices.

---

# 11. Jabba System

Jabba should remain a visible threat throughout the run.

## Day 1

Opening transmission establishes the objective.

## Day 10

Bib Fortuna reminder / threat.

## Day 15

250,000 Credit interim payment.

Options:

- PAY JABBA
- ASK FOR MORE TIME
- TELL JABBA TO STICK IT

The final option should be intentionally dangerous but available.

## Later Game

Additional Jabba transmissions can trigger based on:

- Debt size.
- Bounty level.
- Missed payment.
- Player reputation.
- Days remaining.

---

# 12. Bounty System

Use a five-star bounty meter:

```text
BOUNTY: ★★★☆☆
```

Actions increasing bounty may include:

- Missing Jabba payments.
- Smuggling Coaxium.
- Escaping Imperial inspections.
- Refusing fines.
- Certain Hondo missions.
- Illegal Bluesmobile upgrades.
- Cheating in Cantina encounters.

Higher bounty causes:

- Increased Boba Fett encounter rate.
- Larger fines.
- Increased Imperial attention.
- More dangerous missions.

However, bounty also provides a **score multiplier** so high-risk strategies remain viable.

---

# 13. Boba Fett Nemesis System

Boba should become a recurring antagonist rather than a generic random event.

Base encounter chance increases with bounty level.

If **Bounty Hunter Active** is applied after Day 15:

- Boba encounter probability doubles.
- Costs increase.
- Escape penalties increase.

Example encounter:

```text
BOBA FETT BOUNTY CHASE

Slave I drops out of hyperspace behind you.

[ PUNCH IT ]
[ PAY THE BOUNTY ]
[ HIDE THE CARGO ]
```

Outcomes depend on:

- Character.
- Bluesmobile upgrades.
- Bounty level.
- Random roll.

---

# 14. Encounter Engine

Encounters must offer decisions wherever practical.

Avoid excessive events that simply say:

> You lost 10,000 Credits.

Instead use choices with visible or partially visible risks.

## Encounter Schema

Each encounter should contain:

```ts
interface Encounter {
  id: string
  title: string
  description: string
  category: EncounterCategory
  weight: number
  conditions?: EncounterCondition[]
  choices: EncounterChoice[]
}
```

Each choice can include:

- Credit cost.
- Inventory requirement.
- Upgrade requirement.
- Probability table.
- Character modifier.
- Bounty modifier.
- Cargo loss.
- Credit reward.
- Upgrade reward.
- Mission reward.
- Bounty change.

---

# 15. Initial Random Events

Build at least **20 encounters** for launch.

Examples:

## Boba Fett Bounty Chase

Choices:

- Punch It
- Pay Bounty
- Hide Cargo

## Jawa Fire Sale

A random commodity price crashes temporarily.

## Galactic Legend Panic Buying

A random gear item spikes dramatically.

## Imperial Blockade

Choices:

- Run
- Bribe
- Bluff
- Hide Goods

## Illinois Nazis

Absurd Blues Brothers crossover event.

## Mystery Rocket Attack

Carrie Fisher-inspired recurring attack on the Bluesmobile.

## Police Chase

Increasingly ridiculous number of Imperial speeders pursue the player.

## Bluesmobile Breakdown

Upgrade or repair decision.

## Penguin Transmission

May affect morale/reputation/reward.

## Imperial Customs Inspection

Potential cargo confiscation.

## Jawa Scam

Cheap inventory with uncertain outcome.

## Droid Navigation Error

Potential accidental travel to another planet.

## Cantina Bar Fight

Lose time, Credits or gain reputation.

## Hutt Protection Racket

Pay or increase bounty.

## Rebel Supply Request

Sell gear at premium price.

## Clone Wars Surplus

Temporary gear crash.

## Credit Heist

Chance for unexpected Credits.

## Hyperdrive Malfunction

Travel delay or free jump depending on outcome.

## Smuggler Checkpoint

Cargo-related risk.

## Rare Darth Jar Jar Event

Extremely rare market prediction encounter.

---

# 16. Cantina

Players can visit the Cantina without necessarily advancing the day.

To prevent abuse, Cantina visits should have limitations such as:

- One meaningful encounter per planet/day.
- Entry fee after repeated visits.
- Cooldown.

Possible Cantina characters:

- Lando Calrissian
- Han Solo
- Hondo Ohnaka
- Jawas
- Wat Tambor
- Random smugglers
- Bounty hunters

---

# 17. Lando Sabacc Mini-Game

The player selects a wager.

Suggested presets:

- 5,000
- 10,000
- 25,000
- 50,000
- Custom

Simple mechanic:

```text
LANDO: You've got a 7.

Will the next card be:

[ HIGHER ]
[ LOWER ]
```

Correct guess:

- Winnings increase.

Then choose:

- TAKE THE MONEY
- LET IT RIDE

Potential payout model:

- 1 win: 2×
- 2 consecutive wins: 3×
- 3 consecutive wins: 5×

Exact odds require balancing.

Character/upgrades may modify odds slightly, but gambling must never become guaranteed profit.

---

# 18. Hondo Missions

Hondo offers highly profitable questionable jobs.

Example:

```text
HONDO'S COMPLETELY LEGITIMATE
BUSINESS OPPORTUNITY

Deliver:
20 × Coaxium

Destination:
Tatooine

Deadline:
3 Days

Reward:
75,000 Credits

Failure:
+1 Bounty

[ ACCEPT ] [ DECLINE ]
```

Mission variables:

- Cargo type.
- Quantity.
- Destination.
- Deadline.
- Reward.
- Failure consequence.

Missions create reasons to visit otherwise unattractive planets.

---

# 19. Additional Cantina Opportunities

## Han Solo

Smuggling contracts.

## Jawa Trader

Suspiciously cheap gear.

Possible outcomes:

- Genuine bargain.
- Stolen goods increase bounty.
- Worthless goods.

## Wat Tambor

Bluesmobile modifications.

## Hondo Ohnaka

High-risk delivery and acquisition missions.

Hondo dialogue should consistently suggest that every disastrous idea is an excellent business opportunity.

---

# 20. Daily Mission

This is a key retention mechanic.

Every real-world day generates a **shared deterministic galaxy seed**.

All players participating in the Daily Mission receive the same:

- Starting market.
- Underlying market sequence.
- Event probability tables.
- Special daily modifier.

Their decisions determine the outcome.

Each guild member receives **one scored Daily Mission attempt**.

Optional practice mode can remain unlimited but does not affect the Daily leaderboard.

## Daily Attempt Rules

- Scored Daily Missions require an authenticated, actively linked guild member.
- Selecting Jake or Elwood and creating the run consumes that day's attempt. The title/instructions screen does not.
- An active Daily run autosaves and can be resumed during the same Daily window.
- The Daily window resets at midnight in `Europe/Dublin`; timestamps are stored in UTC and the resolved local challenge date is stored with the run.
- An unfinished Daily run expires at the next reset and cannot be resumed for a score.
- Refreshing, closing the browser or changing device does not reroll or restart the attempt.
- Free Play is unlimited. Authenticated members can persist standard achievements from Free Play, but achievements explicitly marked `dailyOnly` require a scored Daily run.
- Public visitors may receive a non-persistent practice/demo mode, but cannot post scores, achievements or leaderboard results.

## Daily Challenge Examples

### Rawhide

Visit Kessel at least three times.

### Everybody Needs Somebody

Complete three Cantina encounters.

### Fix the Cigarette Lighter

Install three Bluesmobile upgrades.

### 106 Parsecs

Visit every planet.

### Shake a Tail Feather

Complete three successful trades in consecutive days.

---

# 21. Deterministic Seed Design

Generate a daily seed from something such as:

```text
YYYY-MM-DD + guildId + secretSalt
```

Do not expose the complete seed generation mechanism client-side if it would allow players to predict future outcomes.

The production implementation should derive the seed server-side with HMAC-SHA-256 from the Dublin challenge date, guild ID, engine configuration version and a secret salt. Markets, travel, encounters, Cantina and Sabacc should use separate deterministic RNG streams so adding a cosmetic or unrelated roll cannot shift every later outcome.

The server should generate deterministic random values.

This allows:

- Fair competition.
- Reproducible debugging.
- Shared guild discussion.
- Prevention of refresh/re-roll abuse.

---

# 22. Game Modes

## Daily Mission

- One scored attempt per real-world day.
- Shared seed.
- Daily leaderboard.

## Free Play

- Unlimited runs.
- Random seed.
- Achievements available.
- Does not affect Daily leaderboard.

## Season Mode

Best scores during a monthly season contribute to the Season leaderboard.

Future modes:

- Hardcore.
- No Cantina.
- Maximum Bounty.
- Speed Run.
- Guild cooperative challenge.

---

# 23. Monthly Seasons

Suggested duration:

**One calendar month**

Track:

- Best Daily score.
- Total Daily score.
- Successful runs.
- Fastest orphanage save.
- Highest net worth.
- Highest bounty survival.
- Achievements earned.

At season end, preserve results in a Hall of Fame.

---

# 24. Scoring

Do not rank players purely by final Credits.

Suggested model:

```text
Base Score
= Final Net Worth
+ Days Remaining Bonus
+ Mission Completion Bonus
+ Achievement Bonus
+ Difficulty Bonus
```

Then apply controlled modifiers for:

- Bounty level.
- Character.
- Special daily challenge.

Example conceptual calculation:

```text
score = netWorthScore
      + (daysRemaining * dayBonus)
      + missionBonuses
      + achievementBonuses

score *= bountyMultiplier
score *= dailyChallengeMultiplier
```

The actual values must be tuned after gameplay testing.

Avoid a scoring model where a single lucky Sabacc win dominates all other play.

---

# 25. Leaderboards

## Daily Leaderboard

Display:

- Rank.
- Guild player.
- Character.
- Final Credits/net worth.
- Days remaining.
- Bounty.
- Score.

## Season Leaderboard

Track cumulative/best performance.

## Hall of Fame

Permanent records such as:

- Highest score ever.
- Largest fortune.
- Fastest save.
- Highest successful bounty.
- Biggest Sabacc win.
- Largest single trade profit.

---

# 26. Achievements

Initial achievement set:

| Achievement | Requirement |
|---|---|
| Mission From God | Save the orphanage |
| Hit It | First hyperspace jump |
| We're Getting the Band Back Together | Recruit/equip 3 crew |
| 106 Parsecs | Visit every planet |
| Illinois Nazis | Escape 3 Imperial pursuits |
| Don't You Blaspheme | Win 100k from Lando |
| Sell Me Your Children | Make 250k profit from one transaction/trade cycle |
| The New Bluesmobile | Fully equip upgrade slots |
| Jabba's Favourite Customer | Reach extreme debt |
| I Hate Illinois Nazis | Reach maximum bounty |
| Orange Whip? | Trade 100 Corellian Ale |
| This Place Has Got Everything | Meet every Cantina character |
| Punch It | Successfully escape Boba Fett |
| It's Got a Cop Motor | Escape three pursuits in one run |
| Hondo's Best Customer | Complete an absurdly profitable Hondo deal |
| On a Mission from God | Save the orphanage with 5+ days remaining |

Achievement names/text can be refined for tone and suitability.

Achievements should be visible on guild profiles where possible.

---

# 27. Weekly / Special Events

Future content should mostly expand the event system rather than continuously adding core mechanics.

Examples:

## Credit Heist

Credit rewards increased.

## Smuggler's Run

Coaxium volatility dramatically increased.

## Galactic Legend Panic

Kyrotech prices elevated.

## Jawa Junk Week

Gear prices frequently crash.

## Hutt Cartel Crackdown

Bounty encounters increased.

## Double Drop Weekend

Purchases occasionally duplicate.

## Order 66

Imperial encounters dramatically increase.

Special events can run for a weekend or a full week.

---

# 28. Rare Events

Create very low-frequency events that players want to screenshot/share.

Suggested probability:

**~1–2% or lower depending on power.**

Examples:

## Darth Jar Jar

Offers a suspicious prediction about tomorrow's market.

## CUP

Coruscant Underworld Police confiscate cargo unless some ridiculous SWGOH-specific condition is met.

## Executor Sighting

Boba encounters become temporarily dangerous.

## C-3PO Translation Error

Market information becomes misleading for one day.

## Mob Enforcer Miracle

An intentionally terrible SWGOH character unexpectedly saves the player.

Rare events should heavily use guild/SWGOH humour.

---

# 29. UI / Visual Direction

The interface should **not** look like a generic SaaS dashboard.

Visual inspiration:

- 1980s CRT terminals.
- DOS adventure/trading games.
- Arcade cabinets.
- Star Wars tactical displays.
- Blues Brothers typography and attitude.

## Colour Direction

Primary:

- Deep space black.
- Very dark navy.
- Electric/neon blue.
- Ice blue text.

Secondary state colours can indicate:

- Profit.
- Loss.
- Warning.
- Bounty.
- Critical debt.

Do not overuse neon.

## Effects

Use restrained:

- CRT scanlines.
- Screen flicker.
- Blinking terminal cursor.
- Incoming transmission static.
- Hyperspace transition.
- Pixel/terminal portraits.
- Subtle Aurebesh decoration.

Accessibility and readability take priority over visual effects.

---

# 30. Main Game Screen

Example layout:

```text
┌─────────────────────────────────────────────┐
│  MISSION FROM GOD                  DAY 12/30│
│  BLUES BROTHERS GALACTIC TRADING COMPANY   │
├─────────────────────────────────────────────┤
│ LOCATION: CORELLIA                          │
│                                             │
│ CREDITS              184,750                │
│ JABBA DEBT           750,000                │
│ BOUNTY               ★★☆☆☆                 │
│                                             │
│ BLUESMOBILE                                 │
│ ███████████████░░░░░ 74 / 100               │
├─────────────────────────────────────────────┤
│ GALACTIC MARKET                             │
│                                             │
│                     PRICE   OWN   BUY  SELL  │
│ Kyrotech Shock Prod  4,821    12    +    -  │
│ Stun Gun             7,411     0    +    -  │
│ Zeta Material       12,840     3    +    -  │
│ Omega                2,140    14    +    -  │
│ Corellian Ale          440    20    +    -  │
│ Coaxium              8,921     0    +    -  │
├─────────────────────────────────────────────┤
│ [HYPERSPACE] [CANTINA] [BLUESMOBILE]        │
└─────────────────────────────────────────────┘
```

---

# 31. Mobile UX

Mobile is a primary platform.

Requirements:

- No tiny desktop tables requiring horizontal scrolling where avoidable.
- Market rows become touch-friendly cards if necessary.
- Persistent key stats.
- Buy/Sell actions accessible with thumb.
- Modal or bottom-sheet encounters.
- Hyperspace and Cantina primary actions remain prominent.
- Avoid excessive animations on low-powered devices.

Suggested mobile navigation:

- MARKET
- TRUNK
- TRAVEL
- CANTINA
- STATUS

---

# 32. Title Screen

Suggested presentation:

```text
THE BLUES BROTHERS
────────────────────

MISSION FROM GOD

A long time ago,
in a galaxy far, far away...

The Penguin needs
1,000,000 credits.

Jabba wants his money.

The Bluesmobile
has a full tank of coaxium.

You have 30 days.

──────────────

[ JAKE ]    [ ELWOOD ]

CHOOSE YOUR BLUES BROTHER
```

---

# 33. Tone & Writing Rules

The humour should feel like **The Blues Brothers accidentally landed in Star Wars**.

Avoid simply renaming generic game mechanics with Star Wars terminology.

Writing should be:

- Short.
- Dry.
- Slightly absurd.
- Referencial without requiring every joke to be understood.
- Suitable for quick terminal dialogue.

Good pattern:

> 106 Imperial speeders are now pursuing you.
>
> This seems excessive.

Avoid long paragraphs during gameplay.

---

# 34. Suggested Technical Architecture

Assuming the existing guild site uses a modern React/Next.js architecture, implement the game as an isolated module.

Suggested stack:

- Next.js / React.
- TypeScript.
- Existing guild authentication.
- Existing database where practical.
- Server-side game validation.
- Deterministic seeded RNG for competitive modes.

## Core Modules

```text
web/lib/game
  /engine
    economy.ts
    encounters.ts
    travel.ts
    scoring.ts
    sabacc.ts
    missions.ts
    bounty.ts
    rng.ts

  /data
    commodities.ts
    planets.ts
    encounters.ts
    achievements.ts
    upgrades.ts
    dailyChallenges.ts

web/app/mission-from-god
  /components
    GameDashboard.tsx
    Market.tsx
    Inventory.tsx
    Travel.tsx
    Cantina.tsx
    EncounterModal.tsx
    Transmission.tsx
    GalacticNews.tsx
    Bluesmobile.tsx
    Leaderboard.tsx
  page.tsx
```

Keep game rules separate from UI components.

---

# 35. Suggested Data Model

## GameRun

```ts
interface GameRun {
  id: string
  playerId?: string
  mode: 'daily' | 'free'
  seed: string
  challengeDate?: string
  engineVersion: string
  actionIndex: number
  character: 'jake' | 'elwood'
  day: number
  planetId: string
  credits: number
  jabbaDebt: number
  bountyLevel: number
  bountyHunterActive: boolean
  cargoCapacity: number
  inventory: InventoryItem[]
  upgrades: string[]
  activeMissions: MissionInstance[]
  completedMissions: string[]
  visitedPlanets: string[]
  stats: RunStats
  status: 'active' | 'won' | 'lost' | 'expired' | 'abandoned'
  score?: number
  createdAt: Date
  updatedAt: Date
}
```

Competitive runs also retain an append-only `GameAction` ledger containing the run ID, sequential action index, idempotency key, action type, validated input, outcome summary and server timestamp. The current `GameRun` state is the fast resume snapshot; the action ledger is the authoritative audit and replay trail.

## Inventory

```ts
interface InventoryItem {
  commodityId: string
  quantity: number
  averagePurchasePrice: number
}
```

Tracking average purchase price enables profit statistics and achievements.

## Run Stats

```ts
interface RunStats {
  totalTrades: number
  totalProfit: number
  largestTradeProfit: number
  sabaccWins: number
  sabaccLosses: number
  biggestSabaccWin: number
  escapes: number
  bobaEncounters: number
  cantinaVisits: number
  hyperspaceJumps: number
  highestCredits: number
}
```

---

# 36. Persistent Database Entities

Suggested entities/tables:

- users / existing guild members
- game_runs
- game_run_inventory
- game_run_events
- game_run_actions
- game_achievements
- user_achievements
- daily_missions
- daily_results
- season_results
- hall_of_fame

Optional configuration tables:

- commodities
- planets
- encounter_definitions
- upgrades
- challenges

For a small guild site, static TypeScript configuration is acceptable initially for game definitions, while player state/results live in the database.

The existing `Player` record is the game identity. Scored runs and persistent achievements must reference an authenticated active guild player rather than accepting a client-provided username. Add uniqueness constraints for `(playerId, challengeDate, mode)` on scored Daily attempts and `(runId, actionIndex)` / `(runId, idempotencyKey)` on the action ledger.

---

# 37. Server Authority / Anti-Cheat

Competitive Daily Mission results must not trust client-submitted state.

Server should validate:

- Trades.
- Current prices.
- Travel.
- RNG outcomes.
- Sabacc outcomes.
- Credit balances.
- Inventory.
- Score.

Never allow the client to submit arbitrary final Credits or scores.

For Daily mode:

- Generate RNG server-side.
- Record meaningful actions.
- Prevent restarting the scored attempt to reroll outcomes.
- Process each action inside a database transaction with an idempotency key.
- Lock or conditionally update the current run version/action index to reject concurrent stale actions.
- Store the engine/configuration version so historical runs remain reproducible after balancing changes.
- Return the complete validated next state from the server after each action.

Free Play can use less strict validation if required.

---

# 38. Autosave

Save after every meaningful action:

- Trade.
- Travel.
- Encounter resolution.
- Cantina result.
- Upgrade.
- Mission acceptance/completion.
- Jabba payment.

A player should be able to close the browser and resume later.

---

# 39. Economy Balancing

Initial target experience:

A competent player should have a realistic chance of winning but not win automatically.

Suggested early test targets:

- New player victory: ~25–40%.
- Experienced player victory: ~55–70%.
- Exceptional run: >1.5m Credits.
- Very rare run: >2m Credits.

These are starting balancing targets only.

Avoid guaranteed strategies such as repeatedly buying one commodity on one planet.

Use simulations during development to test thousands of automated runs.

---

# 40. Economy Simulation

Create automated test agents:

## Random Trader

Randomly trades/travels.

Should usually lose.

## Conservative Trader

Buys commodities significantly below expected price and sells at moderate profit.

Should sometimes win.

## Optimised Trader

Uses price history and planet knowledge.

Should win frequently but not always.

Run thousands of simulated games to detect:

- Broken commodities.
- Guaranteed routes.
- Excessive Sabacc profit.
- Impossible debt target.
- Overpowered upgrades.

---

# 41. Analytics

Capture anonymised/in-site gameplay metrics such as:

- Run completion rate.
- Win rate.
- Average final Credits.
- Average day of failure/success.
- Commodity profitability.
- Most visited planets.
- Cantina usage.
- Sabacc win/loss rate.
- Encounter outcomes.
- Character selection.
- Upgrade selection.

This data should be used to balance the game.

---

# 42. Content System

Encounters, commodities and challenges should be configuration-driven.

The long-term content strategy should be:

> **Add content more often than mechanics.**

Once the engine works, new releases can add:

- 10 encounters.
- A Daily Challenge.
- A rare event.
- A weekly modifier.
- New dialogue.

without modifying the fundamental game engine.

---

# 43. Audio

Optional and disabled/muted by default or easily controlled.

Potential sound categories:

- Terminal beep.
- Incoming transmission.
- Market purchase.
- Credits received.
- Warning alert.
- Hyperspace activation.
- Bounty alert.

Do not use copyrighted movie/music audio assets unless appropriate rights exist.

Create original sound effects inspired by retro terminals/space games.

---

# 44. Accessibility

Requirements:

- Keyboard navigable.
- Screen-reader labels.
- Reduced motion support.
- High contrast.
- Never communicate profit/loss solely through colour.
- Responsive text sizing.
- Sound not required for gameplay.

---

# 45. V1 Scope

V1 is a staged product target, not a single uncontrolled change. Each release gate must leave the site runnable and the game testable.

## First Playable Release

The first release protects the smallest complete story:

1. Jake / Elwood character choice.
2. Five planets and six commodities.
3. Configurable deterministic economy.
4. Trading, cargo and hyperspace travel.
5. Complete 30-day win/loss loop.
6. Jabba Day 15 payment.
7. Initial bounty/Boba behaviour.
8. 10–12 decision-based encounters.
9. Galactic News.
10. Responsive terminal interface.
11. Engine unit tests and automated economy simulations.

This release begins as Free Play. Competitive Daily scoring does not launch until persistence, server validation and attempt enforcement are complete.

## Full V1 Target

Build V1 with:

1. 30-day game.
2. Jake / Elwood character choice.
3. Five planets.
4. Six commodities.
5. Planet-specific economy.
6. Trading system.
7. Bluesmobile inventory.
8. Galactic News.
9. Cantina rumours.
10. Jabba Day 15 deadline.
11. Bounty system.
12. Boba Fett nemesis encounters.
13. At least 20 decision-based random encounters.
14. Lando Sabacc.
15. Hondo delivery missions.
16. Bluesmobile upgrades.
17. Autosave/resume.
18. Achievements.
19. Daily seeded Mission.
20. Daily leaderboard.
21. Monthly Season leaderboard.
22. Hall of Fame foundations.
23. Responsive retro terminal UI.

---

# 46. V1 Development Phases

## Phase 1 — Engine and Simulation

Build:

- Game state.
- Day system.
- Economy.
- Travel.
- Inventory.
- Win/loss conditions.
- Deterministic RNG streams.
- Unit tests and random/conservative/optimised simulation agents.

No advanced UI required.

## Phase 2 — Playable Free Play

Build:

- Character selection.
- Responsive market, cargo, travel and status UI.
- Encounter engine.
- Bounty.
- Jabba.
- Boba.
- News.
- 10–12 launch encounters, expanding to 20 before full V1.

This phase must produce a complete, enjoyable 30-day run before competitive systems are added.

## Phase 3 — Persistence and Server Authority

Build:

- Authenticated member ownership.
- Transactional server actions and idempotency.
- Autosave/resume.
- Run history and append-only action ledger.
- Engine/configuration versioning.

## Phase 4 — Daily Competition

Build:

- Dublin-dated shared Daily seed.
- One scored attempt enforcement.
- Server-validated score.
- Daily leaderboard and shareable result summary.
- Expiration/reset behaviour.

## Phase 5 — Content and Progression

Build:

- Cantina encounter engine and rumours.
- Lando Sabacc.
- Hondo missions.
- Bluesmobile upgrades.
- Achievements.
- Remaining encounters required for the 20-event launch set.

## Phase 6 — Seasons

Build:

- Season scoring.
- Monthly leaderboard.
- Hall of Fame foundations.

## Phase 7 — Presentation

Build:

- Terminal UI.
- Responsive mobile experience.
- Transitions.
- Transmission screens.
- Optional sound.

## Phase 8 — Balance

Build/run:

- Automated economy simulations.
- Play testing.
- Parameter tuning.

---

# 47. V1 Acceptance Criteria

A release is ready when:

- A user can start and finish a complete 30-day run.
- Game state survives browser refresh/close.
- Trading cannot produce negative inventory or invalid Credits.
- Travel advances exactly one Galactic Day unless a legitimate modifier applies.
- Day 15 Jabba logic works reliably.
- Bounty affects encounters.
- All five planets have meaningfully different economies.
- At least 20 encounters work.
- Sabacc cannot be trivially exploited.
- Hondo missions can be accepted, completed and failed.
- Bluesmobile upgrades modify gameplay.
- Achievements persist.
- Daily players receive a common deterministic scenario.
- One scored Daily attempt is enforced.
- Scores are server validated.
- Daily leaderboard works.
- Game is usable on desktop and mobile.
- Reduced-motion mode works.
- No game-critical action relies solely on colour or sound.

---

# 48. Future Expansion Ideas

After V1 stabilises, consider:

- More planets.
- More commodities.
- Crew cards.
- Unlockable characters.
- Guild-wide cooperative goals.
- Boss encounters.
- Seasonal themes.
- Special SWGOH event tie-ins.
- Player titles.
- Cosmetic Bluesmobile variants.
- Player trading statistics/profile cards.
- Guild chat share cards.
- Challenge-a-guildmate mode.
- Weekly fixed-seed tournaments.
- Hardcore mode.
- Endless mode.

Avoid introducing pay-to-win mechanics.

---

# 49. Guild Social Features

The game should encourage discussion on the guild site/chat.

Provide shareable result summaries such as:

```text
MISSION COMPLETE

STEVE — ELWOOD
────────────────────
ORPHANAGE: SAVED
FINAL CREDITS: 1,487,220
DAYS REMAINING: 4
BOUNTY: ★★★★☆
BIGGEST TRADE: 184,200
SABACC: -25,000

DAILY SCORE: 14,821
GUILD RANK: #3

MISSION FROM GOD
```

Include a **Copy Result** / **Share Result** action.

Do not expose future seeded outcomes in shared data.

---

# 50. Key Retention Loop

The retention strategy is:

```text
PLAY TODAY'S MISSION
        ↓
GET A SCORE
        ↓
COMPARE WITH GUILD
        ↓
DISCUSS STRATEGIES
        ↓
EARN ACHIEVEMENTS
        ↓
RETURN TOMORROW
```

This is more important than simply adding more commodities or planets.

The **Daily Mission + shared seed + guild leaderboard** should therefore be treated as a core feature, not an optional extra.

---

# 51. Product Principles

When making design decisions, use these rules:

1. **Decisions over randomness.** Random events should usually give the player a meaningful choice.
2. **Risk should have reward.** Bounty, Kessel, Hondo and Sabacc should be dangerous because they can also be lucrative.
3. **Information should be imperfect.** News and rumours let skilled players make informed bets without completely solving the market.
4. **Runs should tell stories.** Players should remember the time Boba chased them out of Kessel with 200k of Kyrotechs in the trunk.
5. **Guild competition matters.** Shared Daily scenarios make scores comparable.
6. **SWGOH jokes should reward players without excluding everyone else.**
7. **Blues Brothers humour is the personality layer.**
8. **Mobile is first-class.**
9. **Server owns competitive truth.**
10. **Add encounters more frequently than systems.**

---

# 52. Codex / AI Development Brief

Use the following as the high-level instruction when beginning implementation:

> Build a production-quality game module named **Mission From God** for the existing Blues Brothers SWGOH guild website. It is a retro text-based economic trading game inspired by classic 30-day trading games, but all implementation, UI and content must be original and tailored to the Blues Brothers/SWGOH guild theme.
>
> Players choose Jake or Elwood and receive 30 Galactic Days to raise 1,000,000 Credits to save the Penguin's orphanage from Jabba the Hutt. Players travel between Tatooine, Coruscant, Cantonica, Corellia and Kessel, trading six SWGOH/Star Wars commodities whose prices are generated by a deterministic, configurable market engine with planet modifiers, volatility and events.
>
> Build the game engine separately from the React UI. Use TypeScript throughout. Competitive outcomes, seeded randomness, Credits, inventory and scores must be server authoritative. Implement autosave and resumable runs.
>
> Include the Day 15 Jabba payment, five-level bounty system, recurring Boba Fett nemesis encounters, decision-based random encounters, Galactic News, imperfect Cantina rumours, Lando Sabacc, Hondo delivery missions, Bluesmobile cargo/upgrades, achievements, Daily seeded Missions, Daily leaderboard and monthly Season leaderboard.
>
> The interface should resemble a sophisticated 1980s space terminal rather than a modern SaaS dashboard: deep black/navy surfaces, electric blue terminal typography, restrained scanlines, incoming transmission effects and hyperspace transitions. It must remain highly readable, accessible and excellent on mobile.
>
> Build mechanics from configuration/data rather than embedding game content directly into components. Encounters, planets, commodities, upgrades, achievements and challenges must be easy to extend without rewriting the engine.
>
> Implement incrementally. Begin by auditing the existing repository, authentication, database, styling conventions and deployment architecture. Reuse existing infrastructure where appropriate and do not replace working site systems unnecessarily. Then implement the core game engine and tests before adding advanced presentation.
>
> Do not attempt the entire feature in one uncontrolled code change. Work through the implementation phases in this specification, keeping the application runnable after each phase.

---

# 53. Definition of Success

The game succeeds if guild members begin saying things such as:

> "What did everyone get today?"

> "Don't go to Kessel on Day 8."

> "Where did you find the cheap Kyros?"

> "How the hell did he make 1.8 million?"

> "I told Jabba to stick it and Boba has been chasing me for ten days."

That behaviour indicates the game has moved beyond being a novelty page and become a **repeatable social activity within the guild**.

---

# 54. Final V1 Priority Order

If scope becomes constrained, protect these features in this order:

1. Core 30-day trading loop.
2. Interesting planet-specific market.
3. Decision-based encounters.
4. Jabba / bounty / Boba system.
5. Daily deterministic Mission.
6. Guild leaderboard.
7. Autosave.
8. Lando Sabacc.
9. Hondo missions.
10. Bluesmobile upgrades.
11. Achievements.
12. Galactic News / rumours.
13. Season leaderboard.
14. Additional visual polish.
15. Additional content.

The central objective is not to create the largest game possible.

It is to create a game that guild members **want to play again tomorrow**.

---

# 55. Credits, Attribution & Property Boundaries

**Mission From God** is an original, limited-access, non-commercial guild mini-game. It is not offered for sale, separately distributed or presented as an official product.

## Creative Credit

- Game concept, rules, original code, interface and original writing: Blues Brothers Guild Command / 1Zero9 Studio.
- Genre inspiration: classic short-run economic trading and risk games, including *Dope Wars* / *Drug Wars*. No source code, artwork, text, data or audio from those games is copied.
- The setting references *Star Wars*, *Star Wars: Galaxy of Heroes* and *The Blues Brothers* as a fan-created crossover for a private guild community.

## Ownership Notice

*Star Wars*, *Star Wars: Galaxy of Heroes* and related characters, names, imagery and marks belong to their respective rights holders, including Lucasfilm, Disney, Electronic Arts and Capital Games where applicable. *The Blues Brothers* and related characters, names, imagery and marks belong to their respective rights holders. This project is independent and is not affiliated with, sponsored by or endorsed by those owners.

## Asset and Content Rules

- Build all game code and game-specific visual presentation originally.
- Do not copy movie dialogue, screenplay passages, game text, source code or third-party data beyond brief referential names and original parody-style writing.
- Do not use film clips, commercial music, voice performances, ripped game assets or movie stills unless the repository records a separate valid permission or licence.
- Use original retro-terminal graphics, original sound effects and appropriately licensed fonts/assets.
- Record every adopted external library, asset or substantial data source in `web/THIRD_PARTY_NOTICES.md` and expose the corresponding acknowledgement on `/credits` before release.
- Retain copyright and licence text when a dependency or asset licence requires it.

Credits are a release criterion: a feature is not complete if its required attribution is missing.
