export const SQUAD_KEYS = [
  "lordVader",
  "jabba",
  "rey",
  "jmk",
  "reva",
  "malgus",
  "gas",
  "zorii",
  "cere",
  "executor",
  "profundity",
  "leviathan",
] as const;

export type SquadKey = typeof SQUAD_KEYS[number];
export type SquadGroup = "gl" | "elite" | "fleet";
export type SquadRole = "Defense" | "Offense";

export type SquadDefinition = {
  key: SquadKey;
  label: string;
  code: string;
  group: SquadGroup;
  defaultRole: SquadRole;
  leaderDefId: string;
  minStars: number;
  minRelic: number;
  minGear: number;
  /**
   * Canonical 5-member (or capital-ship) roster for display/reference only.
   * Eligibility is only ever verified against the leader unit above — see
   * the "Known limitations" note in lib/territory-war.ts and the Prepare
   * mode UI. These lists exist so officers can see who else a squad needs,
   * not to gate recommendations.
   */
  members: string[];
  recommendation: string;
  zoneHint: string;
};

export const SQUAD_DEFINITIONS: Record<SquadKey, SquadDefinition> = {
  lordVader: {
    key: "lordVader", label: "Lord Vader GL", code: "LV", group: "gl", defaultRole: "Defense",
    leaderDefId: "LORDVADER", minStars: 7, minRelic: 7, minGear: 0,
    members: ["Lord Vader", "Emperor's Wrath", "Snowtrooper", "Death Trooper", "5th Brother"],
    recommendation: "Excellent defense anchor. Pair with Maul/Royal Guard. Minimum Relic 7.",
    zoneHint: "Zone 1 (Top Front)",
  },
  jabba: {
    key: "jabba", label: "Jabba the Hutt GL", code: "JB", group: "gl", defaultRole: "Defense",
    leaderDefId: "JABBATHEHUTT", minStars: 7, minRelic: 5, minGear: 0,
    members: ["Jabba the Hutt", "Boushh (Leia)", "Bib Fortuna", "Krrsantan", "IG-88 or EE-Rebel"],
    recommendation: "Extremely tough defense wall. Heavy hold potential. Target Relic 5+.",
    zoneHint: "Zone 2 (Bottom Front)",
  },
  rey: {
    key: "rey", label: "Rey GL", code: "RY", group: "gl", defaultRole: "Defense",
    leaderDefId: "GLREY", minStars: 7, minRelic: 5, minGear: 0,
    members: ["Rey", "Finn", "BB-8", "Rose Tico", "Ben Solo (borrowed)"],
    recommendation: "Great defensive GL. Pair with Ben Solo to steal banners. Target Relic 5+.",
    zoneHint: "Zone 2 (Bottom Front)",
  },
  jmk: {
    key: "jmk", label: "Jedi Master Kenobi GL", code: "JMK", group: "gl", defaultRole: "Offense",
    leaderDefId: "JEDIMASTERKENOBI", minStars: 7, minRelic: 7, minGear: 0,
    members: ["Jedi Master Kenobi", "Bo-Katan", "Bail Organa", "Clone Wars Chewbacca", "Mace Windu"],
    recommendation: "Highly versatile. Best saved for offense sweeps (e.g. Jabba counter).",
    zoneHint: "Zone 5 (Top Mid-Back)",
  },
  reva: {
    key: "reva", label: "Reva Inquisitorius", code: "RV", group: "elite", defaultRole: "Defense",
    leaderDefId: "THIRDSISTER", minStars: 7, minRelic: 7, minGear: 0,
    members: ["Third Sister (Reva)", "Grand Inquisitor", "Fifth Brother", "Seventh Sister", "Eighth Brother"],
    recommendation: "Elite defense block. Place in Zone 1 to block top path. Target Relic 7+.",
    zoneHint: "Zone 1 (Top Front)",
  },
  malgus: {
    key: "malgus", label: "Darth Malgus", code: "MG", group: "elite", defaultRole: "Defense",
    leaderDefId: "DARTHMALGUS", minStars: 7, minRelic: 5, minGear: 0,
    members: ["Darth Malgus", "Eeth Koth", "Satele Shan", "T3-M4", "Nadia Grell"],
    recommendation: "Premium non-GL defense wall in Mid-Front sectors (Zone 3). Target Relic 5+.",
    zoneHint: "Zone 3 (Top Mid-Front)",
  },
  gas: {
    key: "gas", label: "GAS 501st", code: "GS", group: "elite", defaultRole: "Defense",
    leaderDefId: "GENERALSKYWALKER", minStars: 7, minRelic: 5, minGear: 0,
    members: ["General Skywalker", "Captain Rex", "Fives", "Echo", "501st Clone Trooper"],
    recommendation: "Solid defense wall or high-tier offensive counter. Target Relic 5+.",
    zoneHint: "Zone 3 (Top Mid-Front)",
  },
  zorii: {
    key: "zorii", label: "Zorii Resistance", code: "ZR", group: "elite", defaultRole: "Defense",
    leaderDefId: "ZORIIBLISS", minStars: 7, minRelic: -1, minGear: 12,
    members: ["Zorii Bliss", "Finn", "Rose Tico", "Resistance Trooper", "C-3PO"],
    recommendation: "High-hold defense team in Mid-Bottom sectors (Zone 4). Target G12+.",
    zoneHint: "Zone 4 (Bottom Mid-Front)",
  },
  cere: {
    key: "cere", label: "Cere & Malicos", code: "CM", group: "elite", defaultRole: "Defense",
    leaderDefId: "CEREJUNDA", minStars: 7, minRelic: -1, minGear: 12,
    members: ["Cere Junda", "Taron Malicos", "Cal Kestis", "Second Sister", "Nightsister Zombie"],
    recommendation: "Nasty defense hold. Place in Mid-Bottom sectors (Zone 4). Target G12+.",
    zoneHint: "Zone 4 (Bottom Mid-Front)",
  },
  executor: {
    key: "executor", label: "Executor Fleet", code: "EX", group: "fleet", defaultRole: "Defense",
    leaderDefId: "CAPITALEXECUTOR", minStars: 7, minRelic: -1, minGear: 0,
    members: ["Executor", "Tie Advanced", "Tie Bomber", "Vader's Shuttle", "Tie Fighter"],
    recommendation: "Strong fleet blockade. Place in Fleet Back (Zone 10) to block path. Target 7★.",
    zoneHint: "Zone 10 (Fleet Back)",
  },
  profundity: {
    key: "profundity", label: "Profundity Fleet", code: "PF", group: "fleet", defaultRole: "Defense",
    leaderDefId: "CAPITALPROFUNDITY", minStars: 7, minRelic: -1, minGear: 0,
    members: ["Profundity", "Biggs' X-wing", "Rebel Y-wing", "Ahsoka's Fighter", "Hyena Bomber"],
    recommendation: "Reliable fleet blockade or offensive counter ship. Target 7★.",
    zoneHint: "Zone 9 (Fleet Front)",
  },
  leviathan: {
    key: "leviathan", label: "Leviathan Fleet", code: "LE", group: "fleet", defaultRole: "Defense",
    leaderDefId: "CAPITALLEVIATHAN", minStars: 7, minRelic: -1, minGear: 0,
    members: ["Leviathan", "Fury-class Interceptor", "Dagger Squadron", "Tie Defender", "Tie Interceptor"],
    recommendation: "Elite fleet wall. Place in Fleet Front (Zone 9). Target 7★.",
    zoneHint: "Zone 9 (Fleet Front)",
  },
};

export const SQUAD_LABELS: Record<SquadKey, string> = Object.fromEntries(
  SQUAD_KEYS.map((key) => [key, SQUAD_DEFINITIONS[key].label]),
) as Record<SquadKey, string>;

export function isFleetSquad(key: SquadKey) {
  return SQUAD_DEFINITIONS[key].group === "fleet";
}

export function emptyAllocation(): Record<SquadKey, number> {
  return Object.fromEntries(SQUAD_KEYS.map((key) => [key, 0])) as Record<SquadKey, number>;
}

type CounterTeam = {
  name: string;
  successRate: string;
  efficiency: string;
  notes: string;
};

export type SquadStrategy = {
  defendingSquad: string;
  vulnerability: "High" | "Medium" | "Low";
  primaryCounter: CounterTeam;
  secondaryCounter: CounterTeam;
  cheaperCounter: CounterTeam;
  killOrder: string;
};

export const TW_COUNTER_STRATEGIES: Record<SquadKey, SquadStrategy> = {
  reva: {
    defendingSquad: "Reva Inquisitorius",
    vulnerability: "Medium",
    primaryCounter: { name: "Lord Vader GL", successRate: "95%", efficiency: "High", notes: "Use Lord Vader with Maul. Focus Reva first. Keep dots stacked." },
    secondaryCounter: { name: "Jedi Master Kenobi GL", successRate: "88%", efficiency: "Medium", notes: "CAT stun on Reva. Focus Grand Inquisitor next." },
    cheaperCounter: { name: "Cere Junda + Malicos", successRate: "75%", efficiency: "High (Non-GL)", notes: "Malicos massive burst on Reva. Crucial to have high tenacity." },
    killOrder: "Reva ➔ Grand Inquisitor ➔ Fifth Brother ➔ Seventh Sister",
  },
  lordVader: {
    defendingSquad: "Lord Vader GL",
    vulnerability: "Medium",
    primaryCounter: { name: "Bounty Hunters (Fennec Shan lead)", successRate: "90%", efficiency: "Elite (Non-GL)", notes: "Fennec Shan lead with Greef, Bossk, Zam, and Mando. Get quick contract to disintegrate Lord Vader." },
    secondaryCounter: { name: "JMK + CAT", successRate: "95%", efficiency: "Medium", notes: "CAT instant-kill on Maul or Royal Guard. Stun Lord Vader." },
    cheaperCounter: { name: "Imperial Troopers (Veers lead)", successRate: "65%", efficiency: "High (Budget)", notes: "High speed required to run turn meter train. Fragile." },
    killOrder: "Maul ➔ Royal Guard ➔ Lord Vader",
  },
  jabba: {
    defendingSquad: "Jabba the Hutt GL",
    vulnerability: "Low",
    primaryCounter: { name: "Supreme Leader Kylo Ren (SLKR)", successRate: "92%", efficiency: "High", notes: "Use standard SLKR team with Kru, Hux, Lobster, and FO Officer. Poke Jabba to drain mastery." },
    secondaryCounter: { name: "JMK + CAT", successRate: "88%", efficiency: "Medium", notes: "CAT leap on Krrsantan. Avoid hitting Jabba until ult is ready." },
    cheaperCounter: { name: "Aphra + Droids", successRate: "70%", efficiency: "High (Non-GL)", notes: "Use BT-1 and 0-0-0 to stack debuffs and control turn meter." },
    killOrder: "Boushh (Leia) ➔ Krrsantan ➔ Jabba",
  },
  rey: {
    defendingSquad: "Rey GL",
    vulnerability: "Medium",
    primaryCounter: { name: "Starkiller (Palpatine/Mara lead)", successRate: "94%", efficiency: "Elite (Non-GL)", notes: "Palpatine, Mara Jade, Starkiller, Visas, and light-side tank. Starkiller wipes out Rey with ult." },
    secondaryCounter: { name: "Jedi Knight Luke (JKLS lead)", successRate: "90%", efficiency: "High", notes: "JML lead with JKLS and Revan. Keep Rey ability blocked." },
    cheaperCounter: { name: "GAS 501st", successRate: "60%", efficiency: "Medium", notes: "Keep Rex alive to trigger Aerial Advantage. Trigger Rey's damage immunity carefully." },
    killOrder: "Ben Solo ➔ Rey",
  },
  jmk: {
    defendingSquad: "Jedi Master Kenobi GL",
    vulnerability: "Low",
    primaryCounter: { name: "Jabba the Hutt GL", successRate: "95%", efficiency: "High", notes: "Use standard Jabba team. Thermals bypass Kenobi's protection pools." },
    secondaryCounter: { name: "Rey GL + Ben Solo", successRate: "85%", efficiency: "Medium", notes: "Rey's sudden whirlwind to bypass General Kenobi's taunt." },
    cheaperCounter: { name: "Grand Admiral Thrawn + Magma", successRate: "50%", efficiency: "Low (Very Budget)", notes: "Fracture CAT immediately to prevent instant kill." },
    killOrder: "Commander Ahsoka Tano (CAT) ➔ General Kenobi ➔ JMK",
  },
  malgus: {
    defendingSquad: "Darth Malgus",
    vulnerability: "Medium",
    primaryCounter: { name: "Jedi Knight Luke (JKLS lead)", successRate: "92%", efficiency: "High", notes: "JKLS lead with JKR and Bastila. Speed reduction slow-down strategy is extremely effective." },
    secondaryCounter: { name: "GAS 501st", successRate: "80%", efficiency: "Medium", notes: "Keep Malgus ability blocked. Avoid AoE triggers when Malgus has doubt." },
    cheaperCounter: { name: "Imperial Troopers (Veers lead)", successRate: "70%", efficiency: "High (Budget)", notes: "Requires very fast speed stats to run the turn train before Malgus moves." },
    killOrder: "Darth Revan ➔ Bastila Shan (Fallen) ➔ Malgus",
  },
  gas: {
    defendingSquad: "GAS 501st",
    vulnerability: "High",
    primaryCounter: { name: "Commander Luke Skywalker (CLS)", successRate: "95%", efficiency: "High (Non-GL)", notes: "CLS with Han, Chewie, Threepio & Chewie, C-3PO. Focus Rex immediately at start." },
    secondaryCounter: { name: "Darth Revan + Malak", successRate: "90%", efficiency: "High", notes: "Fear mechanics bypass clone protection blocks." },
    cheaperCounter: { name: "Sith Triumvirate (Traya lead)", successRate: "85%", efficiency: "Elite (Budget)", notes: "Traya lead with Sion and Nihilus. Isolating GAS completely disables his counterattacks." },
    killOrder: "Rex ➔ Fives ➔ Echo ➔ Arc Trooper ➔ General Skywalker",
  },
  zorii: {
    defendingSquad: "Zorii Resistance",
    vulnerability: "High",
    primaryCounter: { name: "Imperial Troopers (Veers lead)", successRate: "96%", efficiency: "High (Non-GL)", notes: "Standard Veers team. Target Rose Tico or Finn first. Clean turn train sweep." },
    secondaryCounter: { name: "Traya + Savage Opress", successRate: "90%", efficiency: "High", notes: "Savage Opress solo or Traya lead. High durability to tank the resistance assists." },
    cheaperCounter: { name: "Bounty Hunters (Aurra lead)", successRate: "75%", efficiency: "Medium", notes: "Aurra Sing lead to get fast disintegrate on Zorii." },
    killOrder: "Zorii Bliss ➔ Finn ➔ Rose Tico",
  },
  cere: {
    defendingSquad: "Cere & Malicos",
    vulnerability: "Medium",
    primaryCounter: { name: "Sith Empire (Darth Revan lead)", successRate: "90%", efficiency: "High (Non-GL)", notes: "DR lead with Malak and Badstila. Shock prevents Malicos from gaining TM." },
    secondaryCounter: { name: "CLS Rebels", successRate: "82%", efficiency: "Medium", notes: "Burst down Malicos before he can trigger heavy lightsaber attacks." },
    cheaperCounter: { name: "Jedi Revan (JKR)", successRate: "70%", efficiency: "Medium", notes: "Mark Malicos immediately. Keep him controlled." },
    killOrder: "Taron Malicos ➔ Cere Junda ➔ Cal Kestis",
  },
  executor: {
    defendingSquad: "Executor Fleet",
    vulnerability: "Medium",
    primaryCounter: { name: "Profundity Fleet", successRate: "94%", efficiency: "High", notes: "Bring Outrider, Falcon, Y-Wing. Target Hound's Tooth or Xanadu Blood." },
    secondaryCounter: { name: "Malevolence Fleet", successRate: "80%", efficiency: "High (Budget)", notes: "Use Hyena Bomber and Vulture Droid to stack buzz droids and control turn meter." },
    cheaperCounter: { name: "Chimera + Tie Defender", successRate: "85%", efficiency: "Elite (Non-GL)", notes: "Use Iden Versio's TIE Defender to stun and dodge Executor's target locks." },
    killOrder: "Xanadu Blood ➔ Razor Crest ➔ Executor",
  },
  profundity: {
    defendingSquad: "Profundity Fleet",
    vulnerability: "Medium",
    primaryCounter: { name: "Leviathan Fleet", successRate: "98%", efficiency: "High", notes: "Use standard Leviathan loadout. Seize hangar control quickly." },
    secondaryCounter: { name: "Executor Fleet", successRate: "85%", efficiency: "Medium", notes: "Hound's Tooth, Razor Crest, Xanadu Blood. Target Outrider first." },
    cheaperCounter: { name: "Malevolence Fleet", successRate: "70%", efficiency: "High (Budget)", notes: "Ion cannon shot on Profundity. Spam droid assists." },
    killOrder: "Outrider ➔ Rebel Y-Wing ➔ Profundity",
  },
  leviathan: {
    defendingSquad: "Leviathan Fleet",
    vulnerability: "Low",
    primaryCounter: { name: "Leviathan Fleet (Mirror)", successRate: "90%", efficiency: "Medium", notes: "Match speed stats. Target Fury-Class Interceptor first." },
    secondaryCounter: { name: "Profundity Fleet", successRate: "75%", efficiency: "High", notes: "High RNG factor. Requires Outrider to avoid getting early target locked." },
    cheaperCounter: { name: "Chimera + Interceptor", successRate: "60%", efficiency: "High (Skill)", notes: "Requires perfect reinforcement timing with TIE Defender and Emperor's Shuttle." },
    killOrder: "Fury-Class Interceptor ➔ Dagger Starfighter ➔ Leviathan",
  },
};

export type ZonePurpose = "Hard Wall" | "Specialist Wall" | "Attrition" | "Trap" | "Fleet Hold" | "Flexible";

export const DEFAULT_ZONES: { id: number; name: string; type: "ground" | "fleet"; description: string; purpose: ZonePurpose }[] = [
  { id: 1, name: "Zone 1 (Top Front)", type: "ground", description: "Top front line. Target elite GLs or Inquisitors (Reva/LV).", purpose: "Hard Wall" },
  { id: 2, name: "Zone 2 (Bottom Front)", type: "ground", description: "Bottom front line. Best for tanky hold squads (Jabba/Rey).", purpose: "Hard Wall" },
  { id: 3, name: "Zone 3 (Top Mid-Front)", type: "ground", description: "Top mid-front. Best for solid non-GL walls (GAS/Malgus).", purpose: "Specialist Wall" },
  { id: 4, name: "Zone 4 (Bottom Mid-Front)", type: "ground", description: "Bottom mid-front. Best for off-meta holds (Zorii/Cere).", purpose: "Specialist Wall" },
  { id: 5, name: "Zone 5 (Top Mid-Back)", type: "ground", description: "Top mid-back fallback. Secondary hold structures.", purpose: "Attrition" },
  { id: 6, name: "Zone 6 (Bottom Mid-Back)", type: "ground", description: "Bottom mid-back fallback. Residual synergy cards.", purpose: "Attrition" },
  { id: 7, name: "Zone 7 (Top Back)", type: "ground", description: "Top back wall. Place fallback squads to prevent full clears.", purpose: "Trap" },
  { id: 8, name: "Zone 8 (Bottom Back)", type: "ground", description: "Bottom back wall. Residual holds and general filler squads.", purpose: "Flexible" },
  { id: 9, name: "Zone 9 (Fleet Front)", type: "fleet", description: "Front fleet sector. Guard with Leviathan or Profundity blockades.", purpose: "Fleet Hold" },
  { id: 10, name: "Zone 10 (Fleet Back)", type: "fleet", description: "Back fleet sector. Guard with Executor or Chimaera blockades.", purpose: "Fleet Hold" },
];
