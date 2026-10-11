import { counterReadiness, type CounterReadiness, type MemberUnits, type SquadSlot } from "@/lib/counters";
import { getPrisma } from "@/lib/prisma";
import { unitName } from "@/lib/wins";

type UnitRow = { playerId: string; name: string; unitId: string; stars: string | null; gear: string | null; relic: string | null };

/**
 * Every current member's level on just these units, read in the database so only small rows travel back.
 * (Loading whole rosters takes seconds; this takes a fraction of one.)
 */
export async function loadMemberUnits(unitIds: string[]): Promise<MemberUnits[]> {
  if (!unitIds.length) return [];
  const rows = await getPrisma().$queryRaw<UnitRow[]>`
    SELECT p.id AS "playerId", p."currentName" AS name,
           split_part(u->>'definitionId', ':', 1) AS "unitId",
           u->>'currentRarity' AS stars, u->>'currentTier' AS gear, u->'relic'->>'currentTier' AS relic
    FROM "Player" p, jsonb_array_elements(p."profilePayload"->'rosterUnit') u
    WHERE p."profilePayload" IS NOT NULL
      AND split_part(u->>'definitionId', ':', 1) = ANY(${unitIds}::text[])
      AND EXISTS (SELECT 1 FROM "MembershipTerm" t WHERE t."playerId" = p.id AND t.state = 'ACTIVE')`;

  const members = new Map<string, MemberUnits>();
  for (const row of rows) {
    const member = members.get(row.playerId) ?? { playerId: row.playerId, name: row.name, units: new Map() };
    member.units.set(row.unitId, {
      stars: Number(row.stars ?? 0),
      gear: Number(row.gear ?? 0),
      relic: row.relic === null ? 0 : Math.max(0, Number(row.relic) - 2),
    });
    members.set(row.playerId, member);
  }
  return [...members.values()];
}

export type CounterView = {
  id: string;
  title: string;
  mode: string;
  enemy: { id: string; name: string };
  squad: (SquadSlot & { name: string })[];
  notes: string | null;
  createdByName: string;
  createdAt: string;
  mine: boolean;
  readiness: CounterReadiness;
};

/** Counters (for one enemy leader, or the newest few) with who in the guild can run each one right now. */
export async function listCounters(options: { enemyId?: string | null; youPlayerId?: string | null; limit?: number }): Promise<CounterView[]> {
  const rows = await getPrisma().counter.findMany({
    where: options.enemyId ? { enemyLeaderId: options.enemyId } : undefined,
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 20,
  });
  const squads = rows.map((row) => ({ row, squad: (Array.isArray(row.squad) ? row.squad : []) as SquadSlot[] }));
  const members = await loadMemberUnits([...new Set(squads.flatMap((entry) => entry.squad.map((slot) => slot.unitId)))]);

  return squads.map(({ row, squad }) => ({
    id: row.id,
    title: row.title,
    mode: row.mode,
    enemy: { id: row.enemyLeaderId, name: unitName(row.enemyLeaderId) ?? row.enemyLeaderId },
    squad: squad.map((slot) => ({ ...slot, name: unitName(slot.unitId) ?? slot.unitId })),
    notes: row.notes,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    mine: Boolean(options.youPlayerId && row.createdById === options.youPlayerId),
    readiness: counterReadiness(squad, members, (id) => unitName(id) ?? id, options.youPlayerId),
  }));
}
