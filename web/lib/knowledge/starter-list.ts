/**
 * A starter list of 50 popular enemy squads (Grand Arena and Territory War) with the usual line-up and the counters people mention,
 * added by an officer so searches don't come back empty. It was written without sources, so it is brought in as TIPS waiting for an
 * officer to check and publish, never as checked counters.
 */
export type StarterEntry = { defence: string; lineup: string; counters: string };

export const STARTER_ENTRIES: StarterEntry[] = [
  // Tier 1: Galactic Legends and apex defences
  { defence: "Galactic Legend Leia Organa", lineup: "GL Leia, R2-D2, Drogan, Old Ben, Baze Malbus", counters: "Lord Vader (with Maul), JML + JKCK, or SEE + Savage/Wat. Kill Drogan first to stop burst damage." },
  { defence: "Lord Vader", lineup: "Lord Vader, Maul, RG, Thrawn, Piett / Reva", counters: "Bounty Hunters (Fennec lead, Greef, Bossk, BAM, Mando), JMKenobi + CAT, or SLKR + Daka/Zombie cheese." },
  { defence: "Jedi Master Kenobi (JMK)", lineup: "JMK, CAT, General Kenobi, Ahsoka Tano, Padmé / GAS", counters: "JMK mirror (faster CAT leaps their CAT), Jedi Master Luke (with JKCK & JKL), or Lord Vader (high relic)." },
  { defence: "Jedi Master Luke (JML)", lineup: "JML, JKL, Jedi Knight Cal Kestis, Hoda, Revan", counters: "Sith Eternal Emperor (SEE) + Wat Tambor (SEE exploits Jedi buffs), Darth Malgus, or SLKR." },
  { defence: "Sith Eternal Emperor (SEE)", lineup: "SEE, Wat Tambor, Darth Bane / Armorer", counters: "Imperial Troopers (Veers/Piett/Dark Trooper blitz before ultimate), Wampa (solo if low adds), or Rey + Swank." },
  { defence: "Supreme Leader Kylo Ren (SLKR)", lineup: "SLKR, KRU, Hux, Sith Trooper, FO Stormtrooper", counters: "Jedi Knight Luke lead (slows FO speed to base), JMK (with CAT), or GAS 501st (if no Hux/malice)." },
  { defence: "Rey", lineup: "Rey, Ben Solo, JTR, L3-37, 50R-T / Holdo", counters: "Starkiller (Palpatine/Mara Jade/SK), Lord Vader, or SEE + Wat (dodge whirlwind via damage immunity)." },
  { defence: "Jabba the Hutt", lineup: "Jabba, Krrsantan, Boushh, Skiff Lando, Embo/Bobafett", counters: "Supreme Leader Kylo Ren + Nightsisters (Daka/Zombie), Aphra (with datacron/droids), or JMK." },
  { defence: "Grand Inquisitor / Reva", lineup: "Reva lead, Grand Inquisitor, 5th Brother, 7th Sister, 8th Brother", counters: "Jedi Master Kenobi, Bo-Katan (Mand'alor), Traya + Nihilus + Savage (cleanses debuffs), or CLS (very high relic)." },
  { defence: "Bo-Katan (Mand'alor)", lineup: "Bo-Katan (Mand'alor), Paz Vizsla, Beskar Mando, IG-12 & Grogu, Armorer", counters: "Reva Inquisitors, Darth Malgus, Lord Vader, or JMK. Heavy dps needed to bypass Paz's revives." },
  // Tier 2: Conquest and Epic Confrontation cornerstones
  { defence: "Darth Malgus (Sith Empire)", lineup: "Malgus, Darth Revan, Malak, BSF, Talon", counters: "GAS 501st (needs high offense), JML / JKCK, or Imperial Troopers (if turn meter train can start through fear)." },
  { defence: "General Skywalker (GAS 501st)", lineup: "GAS, Fives, Rex, Echo, ARC Trooper", counters: "CLS Rebels (turn meter loop bypasses GAS), Padmé Amidala (courage bursts GAS down), or Darth Revan (fear control)." },
  { defence: "Commander Luke Skywalker (CLS)", lineup: "CLS, Han Solo, Chewbacca, Chewpio, C-3PO", counters: "Savage Opress (Omicron solo/duo), Padmé (out-of-turn attacks trigger protection up), Traya trio, or Imperial Troopers (if Han stunned)." },
  { defence: "Darth Revan (no Malgus)", lineup: "Darth Revan, Malak, Bastila Shan (Fallen), HK-47, Marauder", counters: "Imperial Troopers (Veers/Piett, outspeed and turn-meter loop), Padmé, or GAS 501st." },
  { defence: "Jedi Knight Revan (JKR)", lineup: "JKR, Bastila, Jolee, GMY, General Kenobi", counters: "Darth Traya (Nihilus isolates GMY/Jolee), Padmé, or Imperial Troopers (burst Jolee first)." },
  { defence: "Doctor Aphra", lineup: "Aphra, BT-1, 0-0-0, IG-88, Krrsantan", counters: "Padmé Amidala (punishes debuff spam and assists), General Skywalker, or Dash Rendar Smugglers." },
  { defence: "Starkiller", lineup: "Emperor Palpatine, Mara Jade, Starkiller, Visas Marr, Juhani / Old Ben", counters: "Grievous Droids (B2 cleanses debuffs and feeds TM), Traya + Savage, or CLS Rebels (Han shoots Mara Jade first)." },
  { defence: "Darth Malak (solo or duo)", lineup: "Malak, with or without a Sith partner", counters: "Padmé (courage ignores defense/health pool), Wampa (with Tenacity), or Mando (Disintegrate)." },
  { defence: "Traya Sith Trio (with Omicron)", lineup: "Traya, Nihilus, Sion, Savage Opress (Omi), Talon", counters: "Imperial Troopers (careful not to feed Traya TM), Bounty Hunters (Mando disintegrates Nihilus/Savage), or GAS 501st." },
  { defence: "Kelleran Beq (GR Jedi)", lineup: "Kelleran Beq, Mace Windu, Qui-Gon Jinn, KAM, Plo Koon / JKA", counters: "Darth Malgus, Starkiller, or Traya (isolate Beq to shut down heavy assist synergy)." },
  // Tier 3: core competitive and Territory War squads
  { defence: "Padmé Amidala", lineup: "Padmé, JKA, General Kenobi, Ahsoka, C-3PO / Shaak Ti", counters: "Darth Revan (fear stops out-of-turn bonus protection), Traya, or Bad Batch. Avoid assist-heavy teams like CLS or Troopers." },
  { defence: "General Grievous Droids", lineup: "Grievous, B2, B1, MagnaGuard, Droideka / Nute", counters: "Bad Batch (Daze stops B2 / assists), Jedi Knight Revan (mark Grievous directly), or Padmé." },
  { defence: "Bad Batch", lineup: "Hunter, Tech, Wrecker, Echo, Omega", counters: "Padmé Amidala, Commander Luke Skywalker (Han stuns Echo early), or Imperial Troopers (if outspeeding)." },
  { defence: "Imperial Troopers (Veers)", lineup: "Veers, Piett, Dark Trooper, Range, Gideon / Starck", counters: "CLS Rebels (Han stuns Piett on turn 0 to break the TM train), Padmé, or Savage Opress (Omicron)." },
  { defence: "Iden Versio Troopers", lineup: "Iden, Death Trooper, Snowtrooper, Magmatrooper, Shoretrooper", counters: "Wampa (Omicron solo), Traya Trio (debuff cleanse), or Grievous Droids." },
  { defence: "Bounty Hunters (Bossk lead)", lineup: "Bossk, Boba Fett, Greef Karga, Mando, Dengar", counters: "Imperial Troopers (TM train runs over them), CLS Rebels, or Bad Batch." },
  { defence: "Bounty Hunters (Fennec / Zam Omi)", lineup: "Fennec / Aurra / Bossk, Zam (Omi), Greef, Mando", counters: "CLS Rebels, Imperial Troopers, or Padmé (resists contract debuffs)." },
  { defence: "Maul Mandos", lineup: "Maul, BAM, Bo-Katan, Canderous, Armorer", counters: "GAS 501st (GAS stands back up and controls Maul), Padmé (Canderous multi-hits feed infinite courage), or Traya." },
  { defence: "Savage Opress (Omicron solo)", lineup: "Savage Opress on his own", counters: "Padmé + JKA (healing immunity + courage), Bounty Hunters (Mando Disintegrate), or Traya + Nihilus (Annihilate)." },
  { defence: "Wampa (Omicron solo)", lineup: "Wampa on his own", counters: "Tenacity Down / Healing Immunity (e.g. Canderous, JKA), Mando Disintegrate, or Boba Fett (Execute)." },
  // Tier 4: faction pillars and synergistic heavyweights
  { defence: "Captain Rex Phoenix", lineup: "Hera Syndulla, Captain Rex, Chopper, Kanan, Sabine", counters: "Imperial Troopers (must outspeed Rex), Traya + Nihilus (punishes constant assists), or GAS 501st." },
  { defence: "Nightsisters (Merrin)", lineup: "Mother Talzin, Merrin, Old Daka, Asajj, Zombie", counters: "Imperial Troopers (Veers gains turn meter on every Zombie revive), Bad Batch, or Boba Fett / Mando (perma-kills)." },
  { defence: "Qui-Gon Jinn (Omicron)", lineup: "QGJ (Omi), JKA, KAM / Mace, Aayla, Plo Koon", counters: "Bad Batch (stuns/controls JKA before QGJ dies), Darth Revan (fear disables JKA's bonus turn), or Padmé." },
  { defence: "Dash Rendar Smugglers", lineup: "Dash, Vandor Chewbacca, Qi'ra, L3-37, Young Han", counters: "Traya + Nihilus (isolate Vandor Chewbacca to halt revives), Imperial Troopers, or GAS 501st." },
  { defence: "Geonosians", lineup: "Brood Alpha, Spy, Soldier, Poggle, Sun Fac", counters: "Traya Trio (Traya's lead kills Geos via shared assists), Vader solo (Merciless Massacre), or Jawa squad (thermal det cheese)." },
  { defence: "Admiral Raddus (Rogue One)", lineup: "Raddus, Jyn Erso, Cassian, K-2SO, Bistan / Chirrut", counters: "Starkiller, Imperial Troopers, or Traya Trio (prevents Hope transmission buildup)." },
  { defence: "First Order (Phasma Omicron)", lineup: "Phasma, FOST, FOTP, FOE, Kylo Ren", counters: "Wampa (Omicron), CLS Rebels, or Imperial Troopers." },
  { defence: "Moff Gideon (Dark Trooper)", lineup: "DTMG, Death Trooper (Peridea), Dark Trooper, Scout, Stormtrooper", counters: "CLS Rebels, Padmé Amidala, or GAS 501st." },
  { defence: "Cere Junda (Unaligned Force)", lineup: "Cere Junda, Cal Kestis, Fulcrum, KRU, Malakos", counters: "General Skywalker, Traya + Savage, or Darth Malgus." },
  { defence: "Tarfful Wookiees", lineup: "Tarfful, Zaalbar, Chewbacca, Veteran Smuggler Chewie, Krrsantan", counters: "Imperial Troopers, Traya Trio, or Bad Batch (Daze completely prevents Retaliate counter-attacks)." },
  // Tier 5: cleanups, back-wall defences and fleet relatives
  { defence: "Gorgan / Boss Nass Gungans", lineup: "Boss Nass, Captain Tarpals, Phalanx, Boomadier, Jar Jar", counters: "Darth Traya + Savage (cleanses Plasma Shield shock), Lord Vader, or Jedi Knight Cal Kestis." },
  { defence: "Mon Mothma Rebels", lineup: "Mon Mothma, Kyle Katarn, Cara Dune, Pao, Hoth Scout", counters: "Wampa (Omicron solo), Darth Vader solo, or Imperial Troopers (easy TM train)." },
  { defence: "Sith Empire (Sith Marauder / Talon)", lineup: "Darth Revan, Malak, BSF, Talon, Marauder", counters: "Imperial Troopers (Veers blitz), Padmé, or GAS 501st." },
  { defence: "Sana Starros Smugglers", lineup: "Sana Starros, Cara Dune, Stormtrooper Han, RO Officers", counters: "Traya + Nihilus, Bad Batch, or Imperial Troopers." },
  { defence: "Ewoks (Kneesaa)", lineup: "Chirpa, Kneesaa, Elder, Wicket, Paploo", counters: "Darth Vader solo, Wampa (Omicron), or Imperial Troopers (Snowtrooper sweeps)." },
  { defence: "Jedi Knight Luke (lead)", lineup: "JKL, Hermit Yoda, Old Ben, Plo Koon, Shaak Ti", counters: "Darth Revan + Malak (Sith speed is immune to the JKL cap), Padmé, or Traya." },
  { defence: "Saw Gerrera Rebels", lineup: "Saw Gerrera, Chaze (Chirrut & Baze), Wedge, Biggs", counters: "Imperial Troopers, Wampa solo, or Bounty Hunters." },
  { defence: "Hutt Cartel (Boba Fett lead)", lineup: "Boba Fett, Cad Bane, Greedo, Mob Enforcer, Krrsantan", counters: "CLS Rebels, Imperial Troopers, or Wampa solo." },
  { defence: "Old Republic (Carth lead)", lineup: "Carth Onasi, Mission, Zaalbar, Juhani, Canderous", counters: "Darth Vader solo, Kylo Ren (solo), or Imperial Troopers." },
  { defence: "Imperial Super Commando / Gar Saxon", lineup: "Gar Saxon, Imperial Super Commando, Mauldolorian adds", counters: "Traya / Nihilus (punishes rapid basic counters), Padmé, or Bad Batch (Daze stops counter-attacks)." },
];

export const STARTER_AUTHOR = "Starter list";
export const STARTER_HOW_KNOWN = "From a starter list an officer added. Not yet checked in game, so treat it as a starting point.";

/** One tip per enemy squad. Plain text, within the note limits. */
export function starterNotes(entries: StarterEntry[] = STARTER_ENTRIES) {
  return entries.map((entry) => ({
    kind: "TIP" as const,
    title: `Beating ${entry.defence}`.slice(0, 100),
    topic: "Territory War",
    howKnown: STARTER_HOW_KNOWN,
    body: `Usual defence: ${entry.lineup}.\n\nCounters people use: ${entry.counters}`.slice(0, 1500),
  }));
}
