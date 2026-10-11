import { resolveUnit, type UnitMatch } from "@/lib/who-has";
import { allUnitNames } from "@/lib/wins";

export type SquadSlot = { unitId: string; minStars: number; minRelic: number };
export type CounterMode = "TW" | "GAC" | "BOTH";
export const COUNTER_MODES: CounterMode[] = ["TW", "GAC", "BOTH"];
export const MAX_SQUAD = 5;

export type CounterInput = { enemyLeaderId: string; title: string; mode: CounterMode; squad: SquadSlot[]; notes: string | null };

const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Checks a new counter from the browser; returns the cleaned counter or what is wrong with it. */
export function validateCounter(body: unknown, units: UnitMatch[] = allUnitNames()): { ok: true; counter: CounterInput } | { ok: false; error: string } {
  const input = body as { enemyLeaderId?: unknown; title?: unknown; mode?: unknown; squad?: unknown; notes?: unknown } | null;
  const known = new Set(units.map((unit) => unit.id));

  const enemy = typeof input?.enemyLeaderId === "string" ? resolveUnit(input.enemyLeaderId, units) : null;
  if (!enemy || !known.has(enemy.id) || enemy.id.toLowerCase() !== String(input?.enemyLeaderId).toLowerCase()) return { ok: false, error: "Pick the enemy squad's leader from the list." };

  const title = typeof input?.title === "string" ? input.title.trim().slice(0, 60) : "";
  if (!title) return { ok: false, error: "Give the counter a short name." };

  const rawSquad = Array.isArray(input?.squad) ? input.squad : [];
  if (rawSquad.length < 1 || rawSquad.length > MAX_SQUAD) return { ok: false, error: `A counter squad has 1 to ${MAX_SQUAD} units.` };
  const squad: SquadSlot[] = [];
  for (const slot of rawSquad as { unitId?: unknown; minStars?: unknown; minRelic?: unknown }[]) {
    const unitId = typeof slot?.unitId === "string" ? slot.unitId : "";
    if (!known.has(unitId)) return { ok: false, error: "Every unit in the squad must be picked from the list." };
    if (squad.some((existing) => existing.unitId === unitId)) return { ok: false, error: "A unit can only be in the squad once." };
    squad.push({ unitId, minStars: clampInt(slot.minStars, 1, 7, 7), minRelic: clampInt(slot.minRelic, 0, 9, 0) });
  }

  const mode = COUNTER_MODES.includes(input?.mode as CounterMode) ? (input?.mode as CounterMode) : "BOTH";
  const notes = typeof input?.notes === "string" && input.notes.trim() ? input.notes.trim().slice(0, 400) : null;
  return { ok: true, counter: { enemyLeaderId: enemy.id, title, mode, squad, notes } };
}

export type MemberUnits = { playerId: string; name: string; units: Map<string, { stars: number; relic: number; gear: number }> };

export type SquadStatus = {
  ready: boolean;
  /** One line per unit that isn't good enough yet, e.g. "Bo-Katan: not owned" or "JMK: R5 → R7". */
  gaps: string[];
  /** A rough size of the work left (lower is closer). Infinity when a unit isn't owned. */
  effort: number;
};

/** Can this member run the squad as written? */
export function squadStatus(squad: SquadSlot[], member: MemberUnits | undefined, nameOf: (id: string) => string): SquadStatus {
  const gaps: string[] = [];
  let effort = 0;
  for (const slot of squad) {
    const have = member?.units.get(slot.unitId);
    if (!have) { gaps.push(`${nameOf(slot.unitId)}: not owned`); effort = Number.POSITIVE_INFINITY; continue; }
    const starsShort = Math.max(0, slot.minStars - have.stars);
    const relicShort = Math.max(0, slot.minRelic - have.relic);
    if (starsShort || relicShort) {
      gaps.push(`${nameOf(slot.unitId)}: ${[starsShort ? `${have.stars}★ → ${slot.minStars}★` : "", relicShort ? `R${have.relic} → R${slot.minRelic}` : ""].filter(Boolean).join(", ")}`);
      effort += starsShort * 3 + relicShort;
    }
  }
  return { ready: gaps.length === 0, gaps, effort };
}

export type CounterReadiness = {
  ready: string[];
  close: { name: string; gaps: string[] }[];
  you: SquadStatus | null;
};

/** Across the whole guild: who can run it now, who is closest, and how you stand. */
export function counterReadiness(squad: SquadSlot[], members: MemberUnits[], nameOf: (id: string) => string, youPlayerId?: string | null): CounterReadiness {
  const ready: string[] = [];
  const close: { name: string; gaps: string[]; effort: number }[] = [];
  let you: SquadStatus | null = null;
  for (const member of members) {
    const status = squadStatus(squad, member, nameOf);
    if (member.playerId === youPlayerId) you = status;
    if (status.ready) ready.push(member.name);
    else if (Number.isFinite(status.effort)) close.push({ name: member.name, gaps: status.gaps, effort: status.effort });
  }
  if (youPlayerId && !you) you = squadStatus(squad, undefined, nameOf);
  close.sort((a, b) => a.effort - b.effort || a.name.localeCompare(b.name));
  return { ready: ready.sort((a, b) => a.localeCompare(b)), close: close.slice(0, 6).map(({ name, gaps }) => ({ name, gaps })), you };
}

const MODE_LABEL: Record<string, string> = { TW: "TW", GAC: "GAC", BOTH: "TW + GAC" };

export type CounterReply = {
  title: string;
  mode: string;
  squad: { name: string; minStars: number; minRelic: number }[];
  notes: string | null;
  createdByName: string;
  readiness: CounterReadiness;
};

/** The private Discord reply for /counter: each counter, whether you can run it, and who can. */
export function formatCounters(enemyName: string, counters: CounterReply[], canAddUrl: string) {
  if (!counters.length) return `Nobody has added a counter to **${enemyName}** yet. Add one at ${canAddUrl}`;
  const blocks = counters.slice(0, 5).map((counter, index) => {
    const squad = counter.squad.map((slot) => `${slot.name}${slot.minRelic > 0 ? ` R${slot.minRelic}+` : ` ${slot.minStars}★`}`).join(", ");
    const you = counter.readiness.you;
    const status = !you ? "" : you.ready ? "✅ **You can run it**" : `❌ ${you.gaps.slice(0, 2).join("; ")}`;
    const who = counter.readiness.ready.length
      ? `Ready now (${counter.readiness.ready.length}): ${counter.readiness.ready.slice(0, 6).join(", ")}${counter.readiness.ready.length > 6 ? ", …" : ""}`
      : "Nobody can run it yet.";
    return [`**${index + 1}. ${counter.title}** (${MODE_LABEL[counter.mode] ?? counter.mode}) · by ${counter.createdByName}`, squad, status, who, counter.notes ? `_${counter.notes}_` : ""].filter(Boolean).join("\n");
  });
  const more = counters.length > 5 ? `\n…and ${counters.length - 5} more on the site.` : "";
  return `**Counters to ${enemyName}**\n\n${blocks.join("\n\n")}${more}`.slice(0, 1990);
}
