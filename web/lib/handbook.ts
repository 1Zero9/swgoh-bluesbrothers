/**
 * The guild's combat handbook: mods, mod sets, slicing and the Mod Store, turn orders for three top squads, and the omicron priority list.
 * Written by an officer (docs/swgoh_ultimate_combat_handbook.html); the numbers are the handbook's own and are worth checking in game.
 */

export type ModSlot = { shape: string; name: string; slot: number; kind: string; primaries: string[]; note: string };
export const MOD_SLOTS: ModSlot[] = [
  { shape: "Square", name: "Transmitter", slot: 1, kind: "Fixed", primaries: ["Offense % only (+5.88% / +8.5%)"], note: "The primary is guaranteed, so the mod's worth comes from its Speed secondary and the other substats." },
  { shape: "Arrow", name: "Receiver", slot: 2, kind: "Speed slot", primaries: ["Speed (+30 / +32)", "Offense %", "Health %", "Protection %", "Crit Avoid", "Defense %", "Accuracy"], note: "90% of characters want a Speed primary. High-relic attackers (Drogan, Dark Trooper) can use Offense % arrows if their secondary speed rolls are 20+." },
  { shape: "Diamond", name: "Processor", slot: 3, kind: "Fixed", primaries: ["Defense % only (+11.75% / +20%)"], note: "A fixed defense primary. Like the square, sell it if no speed substat shows up by Tier C (Blue)." },
  { shape: "Triangle", name: "Holofiber", slot: 4, kind: "Rarest slot", primaries: ["Crit Damage (+36% / +42%)", "Crit Chance %", "Offense %", "Health %", "Protection %", "Defense %"], note: "The biggest damage slot. Keep every Crit Damage and Offense % triangle that shows Speed." },
  { shape: "Circle", name: "Data-Bus", slot: 5, kind: "Two choices", primaries: ["Protection % (+23.5% / +24%)", "Health % (+5.88% / +16%)"], note: "Pick Health % for units that grow on max HP (Grievous, Malak, Padmé, Kelleran Beq) and Protection % for units that regenerate shields." },
  { shape: "Cross", name: "Multiplexer", slot: 6, kind: "Utility", primaries: ["Potency % (+24% / +30%)", "Tenacity % (+24% / +35%)", "Offense %", "Health %", "Protection %", "Defense %"], note: "Potency on debuff engines (Vader, Mara Jade, C-3PO) and Tenacity on solo bruisers (Wampa, Savage, Malak)." },
];

export type ModSet = { name: string; needs: number; bonus: string; note: string };
export const MOD_SETS: ModSet[] = [
  { name: "Speed", needs: 4, bonus: "+10% base speed", note: "Scales off the unit's raw speed. Needed for turn-0 starters: Piett, Rex, Mara Jade, Gideon." },
  { name: "Offense", needs: 4, bonus: "+15% offense", note: "Best on units whose damage can't crit (Dark Trooper) or that multi-hit on assists (Drogan, ARC)." },
  { name: "Crit Damage", needs: 4, bonus: "+30% crit damage", note: "For high crit-chance attackers. Gives Han Solo, JKA and Echo big bursts on every crit." },
  { name: "Crit Chance", needs: 2, bonus: "+8% crit chance", note: "A 2-piece filler so units reliably reach the crit levels their kits need." },
  { name: "Health", needs: 2, bonus: "+10% max health", note: "Stack three sets on health-scaling units: General Grievous, Darth Malak, Old Daka, Savage Opress." },
  { name: "Defense", needs: 2, bonus: "+25% defense", note: "Cuts damage taken. Good on Fives, Ninth Sister, Bossk and General Kenobi." },
  { name: "Potency", needs: 2, bonus: "+15% potency", note: "Gets past high enemy tenacity. Key for Emperor Palpatine, C-3PO, CLS and Darth Vader." },
  { name: "Tenacity", needs: 2, bonus: "+20% tenacity", note: "Resists debuffs and ability blocks. Stack three on soloists like Wampa, Savage Opress and Chewbacca." },
];

export const SLICING: { tier: string; shows: string; advice: string }[] = [
  { tier: "5-E (Grey)", shows: "0 secondaries showing", advice: "Level to 12. If it has no speed, sell it." },
  { tier: "5-D (Green)", shows: "1 secondary showing", advice: "Level to 9. It needs +4 to +5 speed." },
  { tier: "5-C (Blue)", shows: "2 secondaries showing", advice: "It needs at least two rolls in Speed." },
  { tier: "5-B (Purple)", shows: "3 secondaries showing", advice: "Aim for +10 speed or more before slicing to gold." },
  { tier: "5-A (Gold)", shows: "All 4 secondaries showing", advice: "Aim for +15 speed or more before slicing to 6-dot." },
  { tier: "6-E to 6-A (Red, 6-dot)", shows: "Needs gear 12 or higher", advice: "Boosts the primary and the secondaries." },
];

export const MOD_STORE = {
  intro: "The Mod Store refreshes every 6 hours. Use credits and ship building materials carefully.",
  buy: [
    "+30 Speed arrows on Speed, Health, Offense or Potency sets.",
    "Gold (5-A) mods showing +5 speed with at least two complementary % stats (for example Offense % and crit chance, or Health % and Defense %).",
    "Crit Damage triangles (Crit Damage or Offense set) that show +4 or +5 speed.",
    "Potency or Tenacity crosses matching their set icon with visible +4 or +5 speed.",
  ],
  skip: [
    "Never spend crystals in the Mod Store. Use crystals for energy refreshes instead.",
    "Grey (5-E) mods in the store: never gamble on blind substats.",
    "Accuracy arrows and Defense crosses (very niche, no speed value).",
    "1-dot to 4-dot mods (they can't reach 6-dot).",
  ],
};

export type TurnOrderUnit = { toon: string; sets: string; arrow: string; triangle: string; cross: string; target: string };
export type SquadOrder = { name: string; engine: string; steps: string[]; units: TurnOrderUnit[]; note?: string };
export const SQUAD_ORDERS: SquadOrder[] = [
  {
    name: "Commander Luke Skywalker (CLS Rebels)", engine: "Turn-meter reduction loop",
    steps: [
      "Han Solo: turn 0 \"Shoots First\" at the enemy turn-meter starter (for example Piett or Rex).",
      "Chewbacca: dispel a buff and spread Tenacity Up.",
      "CLS (leader): Special 2 (Use the Force) to remove turn meter and inflict Buff Immunity.",
      "Chewpio: Special (Chewie's Rage), an area Blind and a stat share.",
      "C-3PO: mass assist (Wait for Me!) stacks Confuse and Expose.",
    ],
    units: [
      { toon: "CLS (leader)", sets: "Speed + Potency", arrow: "Speed", triangle: "Crit Damage", cross: "Potency", target: "315+ Speed, 90%+ Potency" },
      { toon: "Han Solo", sets: "Crit Damage + Crit Chance", arrow: "Crit Damage / Speed", triangle: "Crit Damage", cross: "Offense %", target: "4,200+ Offense, 75%+ Crit Chance" },
      { toon: "Chewbacca", sets: "Tenacity x3", arrow: "Speed / Offense", triangle: "Crit Damage", cross: "Tenacity", target: "150%+ Tenacity, Guard on CLS and Chewpio" },
      { toon: "Chewpio", sets: "Offense + Tenacity", arrow: "Speed / Offense", triangle: "Offense %", cross: "Offense %", target: "9,000+ Physical Offense" },
      { toon: "C-3PO", sets: "Speed + Potency", arrow: "Speed", triangle: "Protection %", cross: "Potency", target: "290+ Speed, 110%+ Potency" },
    ],
    note: "Guard rule: mod CLS and Chewpio with lower combined HP and Protection than Han and 3PO, so Chewbacca reliably protects them.",
  },
  {
    name: "Imperial Troopers (Veers lead)", engine: "Endless assist train",
    steps: [
      "Piett / Gideon: Piett marks Dark Trooper with Imperial Ambition or an area attack.",
      "Range Trooper: Special 1 (Power in Numbers) gives team buffs and triggers Veers' turn meter.",
      "General Veers: area Special applies Speed Down and feeds more turn meter.",
      "Dark Trooper: Punch or Bombardment (a pure physical nuke).",
      "Starck / Gideon: cycles buffs and removes all enemy turn meter.",
    ],
    units: [
      { toon: "Adm. Piett", sets: "Speed + Potency", arrow: "Speed", triangle: "Protection %", cross: "Potency", target: "335+ Speed (the crucial opener)" },
      { toon: "Dark Trooper", sets: "Offense + Health", arrow: "Offense %", triangle: "Offense %", cross: "Offense %", target: "10,000+ Physical Offense" },
      { toon: "Gen. Veers (leader)", sets: "Speed + Potency", arrow: "Speed", triangle: "Crit Damage", cross: "Potency", target: "270+ Speed" },
      { toon: "Range Trooper", sets: "Speed + Health", arrow: "Speed", triangle: "Protection %", cross: "Protection %", target: "270+ Speed" },
      { toon: "Moff Gideon", sets: "Speed (fastest possible)", arrow: "Speed", triangle: "Protection %", cross: "Potency", target: "345+ Speed" },
    ],
  },
  {
    name: "Darth Traya (+ Savage Opress omicron)", engine: "Out-of-turn punishment and Isolate",
    steps: [
      "Darth Talon: fast opener (+20 Sith speed passive), uses an area stealth.",
      "Darth Traya: Special (Isolate) on the main enemy engine.",
      "Darth Nihilus: Special (Drain Force) to lengthen cooldowns and prepare Annihilate.",
      "Darth Sion: area Torment to cycle the Held by Hatred taunt.",
      "Savage Opress: cleanses debuffs on hit and finishes targets with Overpower.",
    ],
    units: [
      { toon: "Traya (leader)", sets: "Health + Defense", arrow: "Speed", triangle: "Health %", cross: "Health %", target: "80k+ Health, 260+ Speed" },
      { toon: "Savage Opress", sets: "Health x3", arrow: "Health %", triangle: "Health %", cross: "Health %", target: "120k+ Health, 65%+ Armor" },
      { toon: "Nihilus", sets: "Speed + Health", arrow: "Speed", triangle: "Health %", cross: "Health %", target: "110k+ Health, 275+ Speed" },
      { toon: "Darth Talon", sets: "Speed + Health", arrow: "Speed", triangle: "Crit Damage", cross: "Offense %", target: "315+ Speed" },
      { toon: "Darth Sion", sets: "Defense x2 + Health", arrow: "Speed", triangle: "Defense %", cross: "Defense %", target: "High Armor and Health" },
    ],
  },
];

export type Omicron = { unit: string; ability: string; mode: string; why: string };
export const OMICRON_TIERS: { tier: string; label: string; items: Omicron[] }[] = [
  {
    tier: "S+", label: "Must-have (Galactic Legend killers and core)",
    items: [
      { unit: "Darth Traya", ability: "Unique: Lord of Betrayal", mode: "GAC", why: "Punishes out-of-turn attacks, gives big Protection Up, counter-attacks, and refunds Isolate cooldowns." },
      { unit: "Savage Opress", ability: "Unique: Brute", mode: "GAC", why: "Unlocks solo and duo play. Cleanse on damage, turn-meter gain and an instant-kill threshold." },
      { unit: "Captain Rex", ability: "Unique: The Lost Commander", mode: "GAC", why: "Makes Phoenix a high-tier counter to the Reva Inquisitors." },
      { unit: "Wampa", ability: "Unique: Cornered Beast", mode: "GAC", why: "Turns Wampa into a solo wrecker against Iden, Mon Mothma, SEE and Grievous." },
      { unit: "Starkiller", ability: "Unique: There Is No Conflict", mode: "GAC", why: "Needed for Starkiller to pull down the Star Destroyer and counter Rey." },
    ],
  },
  {
    tier: "S", label: "High-value staples",
    items: [
      { unit: "Qui-Gon Jinn", ability: "Leader: Agility Training", mode: "GAC", why: "A trade threat: if QGJ dies, JKA gets +400% offense and a bonus turn to wipe the enemy team." },
      { unit: "Iden Versio", ability: "Unique: First Sister", mode: "GAC", why: "A free team revive, a turn-meter push and dispels. Makes leftover Troopers a nightmare." },
      { unit: "Merrin", ability: "Special 2: Magick of the Shadows", mode: "GAC", why: "Continuous revives, full cleanses, and shuts down enemy turn-meter tricks." },
      { unit: "Juhani", ability: "Special: Battle Meditation", mode: "TW", why: "An unkillable taunt wall under Starkiller. A guild Territory War staple." },
      { unit: "Zam Wesell", ability: "Unique: Shapeshifter", mode: "GAC", why: "A big speed and mastery boost to all Bounty Hunters." },
    ],
  },
  {
    tier: "A", label: "Niche and Territory War staples",
    items: [
      { unit: "Poggle the Lesser", ability: "Unique: Hive Mind", mode: "TW", why: "Summons a B1 droid to cycle endless attacks for Geonosians." },
      { unit: "Dash Rendar", ability: "Leader: Prepared for Anything", mode: "GAC", why: "Stat sharing and multi-assists for Scoundrel squads." },
      { unit: "Fulcrum Ahsoka", ability: "Unique: Whirlwind", mode: "TW", why: "A solo wrecking ball with buff immunity and endless counter-attacks." },
      { unit: "Admiral Raddus", ability: "Unique: Transmission from Scarif", mode: "GAC", why: "Uploads Hope quickly so Rogue One can secure Galactic Legend kills." },
      { unit: "Captain Phasma", ability: "Leader: Veteran Commander", mode: "TW", why: "Relentless First Order assist trains." },
    ],
  },
];
