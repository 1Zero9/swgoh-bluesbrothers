import { DEFAULT_ZONES, type SquadKey } from "@/lib/tw-squads";
import {
  computeHoldConfidence,
  type AssignmentRecord,
  type EligiblePlayer,
  type HoldConfidence,
  type ZoneInfo,
} from "@/lib/tw-planning-engine";

/**
 * Pure view-model shaping shared between the server-rendered page and the
 * client workspace. Converts the flat, persisted Prisma shapes into the
 * shapes lib/tw-planning-engine.ts expects, and back again. No Prisma or
 * React imports here — safe to use from either side.
 */

export type CommandSummary = {
  id: string;
  name: string;
  squadKey: string | null;
  kitNotes: string | null;
  isBuiltIn: boolean;
};

export type EffectiveZone = ZoneInfo & {
  name: string;
  type: "ground" | "fleet";
  description: string;
  updatedBy: string | null;
  commandId: string | null;
  command: CommandSummary | null;
  holdConfidence: HoldConfidence | null;
};

export type PersistedZonePlan = {
  id: string;
  zoneId: number;
  purpose: string | null;
  targetCapacity: number;
  note: string | null;
  updatedBy: string | null;
  commandId: string | null;
  command: CommandSummary | null;
};

export type PersistedAssignment = {
  id: string;
  zonePlanId: string;
  playerId: string;
  squadKey: string;
  priority: number;
  status: string;
  source: string;
  locked: boolean;
  officerNote: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type PersistedAttackAssignment = {
  id: string;
  zoneLabel: string;
  enemySquad: string | null;
  assignedPlayerId: string | null;
  status: string;
  note: string | null;
  updatedBy: string | null;
};

/**
 * Builds the 12 default TW zones merged with any officer overrides
 * (purpose/capacity/note/assigned Command). When `pool` is supplied, also
 * attaches a hold-confidence estimate for whichever squad the zone's
 * assigned Command represents — see computeHoldConfidence() for why this is
 * a labeled heuristic, not a true win probability.
 */
export function buildEffectiveZones(zonePlans: PersistedZonePlan[], pool: EligiblePlayer[] = []): EffectiveZone[] {
  const byZoneId = new Map(zonePlans.map((z) => [z.zoneId, z]));
  return DEFAULT_ZONES.map((zone) => {
    const override = byZoneId.get(zone.id);
    const command = override?.command ?? null;
    const holdConfidence =
      command?.squadKey && pool.length
        ? computeHoldConfidence(command.squadKey as SquadKey, pool)
        : null;
    return {
      zoneId: zone.id,
      name: zone.name,
      type: zone.type,
      description: zone.description,
      purpose: override?.purpose ?? zone.purpose,
      targetCapacity: override?.targetCapacity ?? (zone.type === "fleet" ? 15 : 25),
      updatedBy: override?.updatedBy ?? null,
      commandId: override?.commandId ?? null,
      command,
      holdConfidence,
    };
  });
}

export function buildAssignmentRecords(
  zonePlans: PersistedZonePlan[],
  assignments: PersistedAssignment[]
): AssignmentRecord[] {
  const zoneIdByPlanId = new Map(zonePlans.map((z) => [z.id, z.zoneId]));
  const records: AssignmentRecord[] = [];
  for (const a of assignments) {
    const zoneId = zoneIdByPlanId.get(a.zonePlanId);
    if (zoneId === undefined) continue;
    records.push({
      id: a.id,
      zoneId,
      playerId: a.playerId,
      squadKey: a.squadKey as SquadKey,
      priority: a.priority,
      status: a.status,
      source: a.source as "RECOMMENDED" | "MANUAL",
      locked: a.locked,
      officerNote: a.officerNote,
      createdBy: a.createdBy,
      updatedBy: a.updatedBy,
    });
  }
  return records;
}

export function buildPool(
  squadsPool: { playerId: string; joined: boolean; squads: Record<SquadKey, boolean> }[],
  members: { playerId: string; name: string; galacticPower: string }[]
): EligiblePlayer[] {
  const memberById = new Map(members.map((m) => [m.playerId, m]));
  return squadsPool.map((entry) => {
    const member = memberById.get(entry.playerId);
    return {
      playerId: entry.playerId,
      name: member?.name ?? entry.playerId,
      joined: entry.joined,
      galacticPower: member ? Number(member.galacticPower) : 0,
      squads: entry.squads,
    };
  });
}
