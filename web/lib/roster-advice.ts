import type { CalloutRoster } from "@/lib/tb-callout-match";
import { SQUAD_DEFINITIONS, SQUAD_KEYS, type SquadDefinition } from "@/lib/tw-squads";
import { loadRostersForUnits } from "@/lib/tb-callouts";

/** A squad the guild is "thin" on: fewer than this many members can field it. */
export const THIN_BELOW = 15;

export type SquadAdviceItem = {
  key: string;
  label: string;
  group: "gl" | "elite" | "fleet";
  qualifiers: number;
  thin: boolean;
  status: "ready" | "close" | "missing";
  /** Short description of what is left to do, e.g. "R5 → R7 (2 more levels)". */
  gap: string;
  leader: string;
  gapSize: number;
  haveStars: number | null;
  haveRelic: number | null;
  haveGear: number | null;
  targetStars: number;
  targetRelic: number;
  targetGear: number;
};

export type SquadAdvice = {
  ready: SquadAdviceItem[];
  close: SquadAdviceItem[];
  missing: SquadAdviceItem[];
};

function standing(units: Map<string, { stars: number; relic: number; gear?: number }> | null, def: SquadDefinition) {
  const have = units?.get(def.leaderDefId);
  if (!have) return { status: "missing" as const, gap: "Not unlocked yet", gapSize: Number.POSITIVE_INFINITY, have: null };
  const starsShort = Math.max(0, def.minStars - have.stars);
  const relicShort = def.minRelic >= 0 ? Math.max(0, def.minRelic - have.relic) : 0;
  const gearShort = def.minRelic < 0 ? Math.max(0, def.minGear - (have.gear ?? 0)) : 0;
  if (starsShort === 0 && relicShort === 0 && gearShort === 0) return { status: "ready" as const, gap: "", gapSize: 0, have };
  const parts = [
    starsShort ? `${have.stars}★ → ${def.minStars}★` : "",
    relicShort ? `R${have.relic} → R${def.minRelic} (${relicShort} more level${relicShort === 1 ? "" : "s"})` : "",
    gearShort ? `G${have.gear ?? 0} → G${def.minGear}` : "",
  ].filter(Boolean);
  return { status: "close" as const, gap: parts.join(", "), gapSize: starsShort * 3 + relicShort + gearShort, have };
}

/** Which of the guild's squads this member can field, is close to fielding, or hasn't started. */
export function buildSquadAdvice(rosters: CalloutRoster[], playerId: string): SquadAdvice | null {
  const me = rosters.find((roster) => roster.playerId === playerId);
  if (!me || !me.units) return null;

  const items = SQUAD_KEYS.map((key): SquadAdviceItem => {
    const def = SQUAD_DEFINITIONS[key];
    const qualifiers = rosters.filter((roster) => standing(roster.units, def).status === "ready").length;
    const mine = standing(me.units, def);
    return {
      key,
      label: def.label,
      group: def.group,
      qualifiers,
      thin: qualifiers < THIN_BELOW,
      status: mine.status,
      gap: mine.gap,
      leader: def.members[0] ?? def.label,
      gapSize: mine.gapSize,
      haveStars: mine.have?.stars ?? null,
      haveRelic: mine.have?.relic ?? null,
      haveGear: mine.have?.gear ?? null,
      targetStars: def.minStars,
      targetRelic: def.minRelic,
      targetGear: def.minGear,
    };
  });

  // Thin squads first (the guild needs those most), then the smallest gap.
  const byNeed = (a: SquadAdviceItem, b: SquadAdviceItem) => Number(b.thin) - Number(a.thin) || a.gapSize - b.gapSize || a.qualifiers - b.qualifiers;
  return {
    ready: items.filter((item) => item.status === "ready").sort((a, b) => a.qualifiers - b.qualifiers),
    close: items.filter((item) => item.status === "close").sort(byNeed),
    missing: items.filter((item) => item.status === "missing").sort((a, b) => a.qualifiers - b.qualifiers),
  };
}

export async function getSquadAdvice(playerId: string): Promise<SquadAdvice | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    return buildSquadAdvice(await loadRostersForUnits(SQUAD_KEYS.map((key) => SQUAD_DEFINITIONS[key].leaderDefId)), playerId);
  } catch {
    return null;
  }
}
