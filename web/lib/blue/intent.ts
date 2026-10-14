import type { KbMode } from "@/lib/knowledge/modes";

export type UnitRef = { id: string; name: string };

/** What members actually type for a few leaders. Ids checked against the game data; "hondo" alone is left out because two units answer to it. */
export const ALIASES: Record<string, string> = {
  gas: "GENERALSKYWALKER", "general skywalker": "GENERALSKYWALKER",
  jmk: "JEDIMASTERKENOBI", jkr: "JEDIKNIGHTREVAN", jkl: "JEDIKNIGHTLUKE", slkr: "SUPREMELEADERKYLOREN", cls: "COMMANDERLUKESKYWALKER",
  dr: "DARTHREVAN", see: "SITHPALPATINE",
  "night sisters": "MOTHERTALZIN", nightsisters: "MOTHERTALZIN", "night sister": "MOTHERTALZIN", nightsister: "MOTHERTALZIN", "great mothers": "MOTHERTALZIN",
  "pirate king hondo": "GLHONDO", "pk hondo": "GLHONDO", "pirate king": "GLHONDO",
  jabba: "JABBATHEHUTT", "jabba the hutt": "JABBATHEHUTT",
};

export type Intent =
  | { kind: "counter"; unit: UnitRef; mode: KbMode | null }
  | { kind: "whohas"; unit: UnitRef }
  | { kind: "other" };

const norm = (text: string) => ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

/** The mode a member mentions, or null if they didn't say. */
export function detectMode(text: string): KbMode | null {
  const t = norm(text);
  if (/ (territory war|tw|territory wars) /.test(t)) return "TW";
  if (/ 3v3 | 3 v 3 /.test(t)) return "GAC_3V3";
  if (/ (gac|grand arena|5v5|5 v 5) /.test(t)) return "GAC_5V5";
  return null;
}

/**
 * The unit a question is about. Prefers the one named after "against / vs / beat / for", since "I have Revan, how do I beat Vader"
 * is about Vader. Longest name wins ("Darth Revan" over "Revan"). Returns null when nothing (or only an ambiguous name) matches.
 */
export function findUnit(text: string, units: UnitRef[]): UnitRef | null {
  const t = norm(text);
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const candidates: { at: number; length: number; unit: UnitRef }[] = [];
  const consider = (phrase: string, unit: UnitRef | undefined) => {
    if (!unit) return;
    const needle = ` ${phrase} `;
    let at = t.indexOf(needle);
    while (at !== -1) { candidates.push({ at, length: phrase.length, unit }); at = t.indexOf(needle, at + 1); }
  };
  for (const [alias, id] of Object.entries(ALIASES)) consider(alias, byId.get(id));
  for (const unit of units) {
    const name = norm(unit.name).trim();
    if (name.length >= 4) consider(name, unit);
  }
  if (!candidates.length) return null;

  const cue = /\b(against|versus|vs|beat|beating|defeat|counter(?:s|ing)? (?:for|to)|for)\b/g;
  let cueAt = -1;
  for (const match of t.matchAll(cue)) cueAt = match.index ?? cueAt;
  const after = cueAt >= 0 ? candidates.filter((candidate) => candidate.at >= cueAt) : [];
  const pool = after.length ? after : candidates;
  return pool.sort((a, b) => b.length - a.length || a.at - b.at)[0].unit;
}

/** Is this a question the database can answer with no AI? Counter questions and "who has X". Everything else is left to the AI. */
export function detectIntent(text: string, units: UnitRef[]): Intent {
  const t = norm(text);
  const unit = findUnit(text, units);
  if (!unit) return { kind: "other" };
  if (/ (who has|who owns|who got|who can use|who s got|which members have) /.test(t)) return { kind: "whohas", unit };
  if (/ (counter|counters|beat|beating|defeat|against|versus|vs|take down|deal with) /.test(t)) return { kind: "counter", unit, mode: detectMode(text) };
  return { kind: "other" };
}
