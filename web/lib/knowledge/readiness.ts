import { loadMemberUnits } from "@/lib/counters-data";
import { squadStatus, type Need, type SquadSlot } from "@/lib/counters";
import { unitName } from "@/lib/wins";

export type Readiness = { ready: boolean; gaps: string[]; needs: Need[] };

/** For each listed counter, can this member run it as written? One roster query for all of them. */
export async function readinessFor<T extends { id: string; attacker: { memberIds: string[] }; requirements: unknown }>(hits: T[], playerId: string | null): Promise<Record<string, Readiness>> {
  if (!playerId || !hits.length) return {};
  const members = await loadMemberUnits([...new Set(hits.flatMap((hit) => hit.attacker.memberIds))]);
  const mine = members.find((member) => member.playerId === playerId);
  const out: Record<string, Readiness> = {};
  for (const hit of hits) {
    const needs = (hit.requirements as { minRelic?: Record<string, number> } | null)?.minRelic ?? {};
    const slots: SquadSlot[] = hit.attacker.memberIds.map((id) => ({ unitId: id, minStars: 7, minRelic: needs[id] ?? 0 }));
    const status = squadStatus(slots, mine, (id) => unitName(id) ?? id);
    out[hit.id] = { ready: status.ready, gaps: status.gaps.slice(0, 4), needs: status.needs };
  }
  return out;
}
