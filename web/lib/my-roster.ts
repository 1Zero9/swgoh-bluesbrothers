import { unitName } from "@/lib/wins";

export type RosterPick = { id: string; name: string; stars: number; relic: number };

type Unit = { definitionId?: string; currentRarity?: number | string; relic?: { currentTier?: number | string } };

/** A member's strongest units (most relic levels, then stars), as quick picks when they add a counter. Pure, so it is tested. */
export function topUnits(payload: unknown, limit = 48): RosterPick[] {
  const roster = payload && typeof payload === "object" && Array.isArray((payload as { rosterUnit?: unknown }).rosterUnit) ? ((payload as { rosterUnit: Unit[] }).rosterUnit) : [];
  const picks: RosterPick[] = [];
  for (const unit of roster) {
    const id = String(unit.definitionId ?? "").split(":")[0];
    if (!id) continue;
    const tier = Number(unit.relic?.currentTier ?? 0);
    picks.push({ id, name: unitName(id) ?? id, stars: Number(unit.currentRarity ?? 0) || 0, relic: tier > 2 ? tier - 2 : 0 });
  }
  return picks.sort((a, b) => b.relic - a.relic || b.stars - a.stars || a.name.localeCompare(b.name)).slice(0, limit);
}
