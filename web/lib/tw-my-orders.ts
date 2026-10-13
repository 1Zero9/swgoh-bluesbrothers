import { DEFAULT_ZONES, SQUAD_LABELS, type SquadKey } from "@/lib/tw-squads";

type PlanLike = {
  zonePlans: { id: string; zoneId: number; note: string | null; command: { name: string } | null }[];
  assignments: { zonePlanId: string; playerId: string; squadKey: string; status: string }[];
  attackAssignments: { zoneLabel: string; enemySquad: string | null; assignedPlayerId: string | null; status: string; note: string | null }[];
};

export type MyDefenceOrder = { zone: string; squad: string; note: string | null; placed: boolean };
export type MyAttackOrder = { zone: string; enemySquad: string | null; note: string | null; cleared: boolean };
export type MyOrders = { defence: MyDefenceOrder[]; attack: MyAttackOrder[] };

// A suggestion is the planner's idea, not an order; EXEMPT and MISSING are not for the member to act on.
const DEFENCE_ORDERS = new Set(["ASSIGNED", "ACKNOWLEDGED", "PLACED", "CHANGED"]);
const ATTACK_ORDERS = new Set(["ASSIGNED", "IN_PROGRESS", "FAILED", "NEEDS_SPECIALIST", "CLEARED"]);

/** What the officers have asked this one member to do in the war. Pure, so it is easy to test. */
export function buildMyOrders(plan: PlanLike, playerId: string): MyOrders {
  const zonePlans = new Map(plan.zonePlans.map((zone) => [zone.id, zone]));
  const defence = plan.assignments
    .filter((a) => a.playerId === playerId && DEFENCE_ORDERS.has(a.status))
    .map((a): MyDefenceOrder | null => {
      const zone = zonePlans.get(a.zonePlanId);
      if (!zone) return null;
      return {
        zone: DEFAULT_ZONES.find((z) => z.id === zone.zoneId)?.name ?? `Zone ${zone.zoneId}`,
        squad: SQUAD_LABELS[a.squadKey as SquadKey] ?? zone.command?.name ?? a.squadKey,
        note: zone.note,
        placed: a.status === "PLACED",
      };
    })
    .filter((order): order is MyDefenceOrder => order !== null);
  const attack = plan.attackAssignments
    .filter((a) => a.assignedPlayerId === playerId && ATTACK_ORDERS.has(a.status))
    .map((a) => ({ zone: a.zoneLabel, enemySquad: a.enemySquad, note: a.note, cleared: a.status === "CLEARED" }));
  return { defence, attack };
}
