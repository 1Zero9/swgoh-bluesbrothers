/**
 * The guild's shorthand, in plain words. Two kinds: nicknames for units (JMK, CLS, GAS...), which are matched to the real unit list
 * so searches and questions understand them, and general game terms (TM, TW, GAC...).
 */

export type UnitNickname = { abbr: string; name: string };
export type Term = { abbr: string; meaning: string; detail?: string };

/** `name` is the game's own name for the unit; it is looked up in the unit list, so a wrong name fails the tests. */
export const UNIT_NICKNAMES: UnitNickname[] = [
  { abbr: "CLS", name: "Commander Luke Skywalker" },
  { abbr: "GAS", name: "General Skywalker" },
  { abbr: "JKA", name: "Jedi Knight Anakin" },
  { abbr: "JKL", name: "Jedi Knight Luke Skywalker" },
  { abbr: "JML", name: "Jedi Master Luke Skywalker" },
  { abbr: "JKR", name: "Jedi Knight Revan" },
  { abbr: "JKCK", name: "Jedi Knight Cal Kestis" },
  { abbr: "JMK", name: "Jedi Master Kenobi" },
  { abbr: "GMY", name: "Grand Master Yoda" },
  { abbr: "QGJ", name: "Qui-Gon Jinn" },
  { abbr: "KAM", name: "Ki-Adi-Mundi" },
  { abbr: "CAT", name: "Commander Ahsoka Tano" },
  { abbr: "JTR", name: "Rey (Jedi Training)" },
  { abbr: "SEE", name: "Sith Eternal Emperor" },
  { abbr: "SLKR", name: "Supreme Leader Kylo Ren" },
  { abbr: "KRU", name: "Kylo Ren (Unmasked)" },
  { abbr: "BSF", name: "Bastila Shan (Fallen)" },
  { abbr: "SK", name: "Starkiller" },
  { abbr: "RG", name: "Royal Guard" },
  { abbr: "BAM", name: "The Mandalorian (Beskar Armor)" },
  { abbr: "ARC", name: "ARC Trooper" },
  { abbr: "DTMG", name: "Dark Trooper Moff Gideon" },
  { abbr: "FOST", name: "First Order Stormtrooper" },
  { abbr: "FOE", name: "First Order Executioner" },
  { abbr: "FOTP", name: "First Order TIE Pilot" },
];

export const TERMS: Term[] = [
  { abbr: "TW", meaning: "Territory War", detail: "The guild-versus-guild war. Set defence squads and attack the other guild's." },
  { abbr: "TB", meaning: "Territory Battles", detail: "The guild's co-operative campaign over several days." },
  { abbr: "GAC", meaning: "Grand Arena Championship", detail: "The weekly player-versus-player league." },
  { abbr: "GL", meaning: "Galactic Legend", detail: "The most powerful units in the game." },
  { abbr: "TM", meaning: "Turn Meter", detail: "The bar that fills to give a unit its turn. Speed fills it faster; some abilities add to it or remove it." },
  { abbr: "CC", meaning: "Critical Chance", detail: "How often an attack lands a critical hit." },
  { abbr: "CD", meaning: "Critical Damage", detail: "How much extra damage a critical hit does." },
  { abbr: "HP", meaning: "Health points" },
  { abbr: "DPS", meaning: "Damage dealer", detail: "A unit whose job is to do the damage." },
  { abbr: "AoE", meaning: "Area of effect", detail: "An attack that hits every enemy." },
  { abbr: "G12", meaning: "Gear level 12", detail: "The last gear level before relics." },
  { abbr: "R5", meaning: "Relic level 5", detail: "Relic levels (R1 to R9) come after gear 13. R7 and R9 are common targets for the top units." },
  { abbr: "Omi", meaning: "Omicron", detail: "An upgrade to a unit's ability that only works in certain game modes. The handbook lists which ones matter most." },
  { abbr: "Ult", meaning: "Ultimate", detail: "A unit's most powerful ability, charged by taking part in battle." },
  { abbr: "FO", meaning: "First Order", detail: "A faction of units." },
  { abbr: "GR", meaning: "Galactic Republic", detail: "A faction of units." },
  { abbr: "RO", meaning: "Rogue One", detail: "A faction of units." },
  { abbr: "SWGOH", meaning: "Star Wars: Galaxy of Heroes" },
];

const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Everything that can be written in short form, for the glossary page and the hover hints. */
export const ALL_ABBR: { abbr: string; meaning: string }[] = [
  ...UNIT_NICKNAMES.map((nick) => ({ abbr: nick.abbr, meaning: nick.name })),
  ...TERMS.map((term) => ({ abbr: term.abbr, meaning: term.meaning })),
];

const BY_ABBR = new Map(ALL_ABBR.map((item) => [item.abbr.toLowerCase(), item.meaning]));

/** The full name for a short form, if we know it. */
export const meaningOf = (abbr: string) => BY_ABBR.get(abbr.toLowerCase()) ?? null;

/** The game name behind a unit nickname ("JMK" gives "Jedi Master Kenobi"), or null. Used to find units by nickname. */
export function unitNameForNickname(text: string): string | null {
  const wanted = norm(text);
  return UNIT_NICKNAMES.find((nick) => norm(nick.abbr) === wanted)?.name ?? null;
}

/** "How do I beat JMK in TW?" becomes "How do I beat Jedi Master Kenobi in TW?", so the unit lookups understand it. Only unit nicknames are changed. */
export function expandUnitNicknames(text: string): string {
  return text.replace(/\b[A-Za-z]{2,5}\b/g, (word) => {
    if (word !== word.toUpperCase()) return word;
    return unitNameForNickname(word) ?? word;
  });
}

/** Text split into plain pieces and known short forms, so the page can put a hover hint on each short form. */
export function splitAcronyms(text: string): { text: string; meaning?: string }[] {
  const out: { text: string; meaning?: string }[] = [];
  let last = 0;
  for (const match of text.matchAll(/\b[A-Za-z][A-Za-z0-9]{1,4}\b/g)) {
    const word = match[0];
    if (word !== word.toUpperCase() && word !== "Omi" && word !== "Ult" && word !== "AoE") continue;
    const meaning = meaningOf(word);
    if (!meaning) continue;
    if (match.index > last) out.push({ text: text.slice(last, match.index) });
    out.push({ text: word, meaning });
    last = match.index + word.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** One line per short form for B-Lue3's instructions, so he understands them in questions and can spell them out. */
export function glossaryForPrompt(): string {
  return ALL_ABBR.map((item) => `${item.abbr} = ${item.meaning}`).join("; ");
}
