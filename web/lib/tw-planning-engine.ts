import {
  DEFAULT_ZONES,
  SQUAD_DEFINITIONS,
  SQUAD_KEYS,
  TW_COUNTER_STRATEGIES,
  isFleetSquad,
  type SquadKey,
} from "@/lib/tw-squads";

/**
 * Pure, side-effect-free Territory War planning engine.
 *
 * Nothing in this module touches Prisma, cookies, or React. Every function
 * takes plain data in and returns plain data out, so it can be unit tested
 * directly (see lib/tw-planning-engine.test.ts) and reused from both API
 * routes and, if ever needed, client-side previews.
 */

export type EligiblePlayer = {
  playerId: string;
  name: string;
  joined: boolean;
  galacticPower: number;
  squads: Record<SquadKey, boolean>;
};

export type ZoneInfo = {
  zoneId: number;
  name: string;
  type: "ground" | "fleet";
  purpose: string;
  targetCapacity: number;
};

export type AssignmentRecord = {
  id: string;
  zoneId: number;
  playerId: string;
  squadKey: SquadKey;
  priority: number;
  status: string;
  source: "RECOMMENDED" | "MANUAL";
  locked: boolean;
  officerNote: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type Recommendation = {
  zoneId: number;
  playerId: string;
  squadKey: SquadKey;
  priority: number;
  reason: string;
};

export type PlanWarning = {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
  playerId?: string;
  zoneId?: number;
};

export type OffenceReserveHealth = "Strong" | "Acceptable" | "At Risk" | "Critical";

export type OffenceReserveEntry = {
  squadKey: SquadKey;
  label: string;
  availableCount: number;
  players: { playerId: string; name: string }[];
};

export type OffenceReserve = {
  health: OffenceReserveHealth;
  reservedCount: number;
  totalOffenseCapableSquads: number;
  entries: OffenceReserveEntry[];
};

export type WorkloadEntry = {
  playerId: string;
  name: string;
  assignmentCount: number;
  zones: number[];
  squads: SquadKey[];
  overloaded: boolean;
};

/**
 * Officer-authored overrides for generateRecommendations(), sourced from a
 * StrategyTemplate's `rules` JSON column. Both fields are optional and
 * additive — any zone/squad not mentioned falls back to the built-in
 * purpose/zoneHint-based ordering, so a template can override as much or as
 * little of the default strategy as an officer wants.
 */
export type StrategyTemplateRules = {
  /** zoneId -> fill priority (lower fills first). Overrides the default purpose-based order. */
  zonePriority?: Partial<Record<number, number>>;
  /** zoneId -> ordered list of squad keys to try before the default zoneHint-based order. */
  squadPriority?: Partial<Record<number, SquadKey[]>>;
};

export function isStrategyTemplateRules(value: unknown): value is StrategyTemplateRules {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const zonePriorityOk = record.zonePriority === undefined || (typeof record.zonePriority === "object" && record.zonePriority !== null);
  const squadPriorityOk = record.squadPriority === undefined || (typeof record.squadPriority === "object" && record.squadPriority !== null);
  return zonePriorityOk && squadPriorityOk;
}

/**
 * Rank zones by how "hard" they are to fill so scarce elite squads get
 * placed first. Hard Wall / Fleet Hold zones are filled before flexible
 * back-line zones.
 */
const ZONE_PURPOSE_PRIORITY: Record<string, number> = {
  "Hard Wall": 0,
  "Fleet Hold": 1,
  "Specialist Wall": 2,
  Trap: 3,
  Attrition: 4,
  Flexible: 5,
};

export function generateRecommendations(
  pool: EligiblePlayer[],
  zones: ZoneInfo[] = DEFAULT_ZONES.map((zone) => ({
    zoneId: zone.id,
    name: zone.name,
    type: zone.type,
    purpose: zone.purpose,
    targetCapacity: 25,
  })),
  existingAssignments: AssignmentRecord[] = [],
  rules?: StrategyTemplateRules
): Recommendation[] {
  const lockedOrManual = new Set(
    existingAssignments.filter((a) => a.locked || a.source === "MANUAL").map((a) => a.playerId)
  );
  const usedPlayers = new Set(lockedOrManual);
  const recommendations: Recommendation[] = [];

  const sortedZones = [...zones].sort((a, b) => {
    const aPriority = rules?.zonePriority?.[a.zoneId] ?? ZONE_PURPOSE_PRIORITY[a.purpose] ?? 9;
    const bPriority = rules?.zonePriority?.[b.zoneId] ?? ZONE_PURPOSE_PRIORITY[b.purpose] ?? 9;
    return aPriority - bPriority;
  });

  const eligiblePool = pool.filter((p) => p.joined && !usedPlayers.has(p.playerId));

  for (const zone of sortedZones) {
    const existingInZone = existingAssignments.filter((a) => a.zoneId === zone.zoneId);
    let remainingCapacity = Math.max(0, zone.targetCapacity - existingInZone.length);
    if (remainingCapacity <= 0) continue;

    const zoneTypeKeys = SQUAD_KEYS.filter((key) => {
      const wantsFleet = zone.type === "fleet";
      return isFleetSquad(key) === wantsFleet;
    });

    const preferredOrder = (rules?.squadPriority?.[zone.zoneId] ?? []).filter((key) => zoneTypeKeys.includes(key));
    const remainder = zoneTypeKeys
      .filter((key) => !preferredOrder.includes(key))
      .sort((a, b) => {
        const aMatch = SQUAD_DEFINITIONS[a].zoneHint === zone.name ? 0 : 1;
        const bMatch = SQUAD_DEFINITIONS[b].zoneHint === zone.name ? 0 : 1;
        return aMatch - bMatch;
      });
    const zoneSquadKeys = [...preferredOrder, ...remainder];

    for (const squadKey of zoneSquadKeys) {
      if (remainingCapacity <= 0) break;
      const def = SQUAD_DEFINITIONS[squadKey];
      const candidates = eligiblePool
        .filter((p) => !usedPlayers.has(p.playerId) && p.squads[squadKey])
        .sort((a, b) => b.galacticPower - a.galacticPower);

      for (const candidate of candidates) {
        if (remainingCapacity <= 0) break;
        usedPlayers.add(candidate.playerId);
        recommendations.push({
          zoneId: zone.zoneId,
          playerId: candidate.playerId,
          squadKey,
          priority: recommendations.length,
          reason: `${def.label} matches ${zone.purpose.toLowerCase()} zone "${zone.name}" (${def.recommendation}).`,
        });
        remainingCapacity -= 1;
      }
    }
  }

  return recommendations;
}

export function detectWarnings(
  zones: ZoneInfo[],
  assignments: AssignmentRecord[],
  pool: EligiblePlayer[]
): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const playerById = new Map(pool.map((p) => [p.playerId, p]));
  const zoneById = new Map(zones.map((z) => [z.zoneId, z]));

  const assignmentsByPlayer = new Map<string, AssignmentRecord[]>();
  for (const a of assignments) {
    const list = assignmentsByPlayer.get(a.playerId) ?? [];
    list.push(a);
    assignmentsByPlayer.set(a.playerId, list);
  }

  for (const [playerId, list] of assignmentsByPlayer) {
    if (list.length > 1) {
      const player = playerById.get(playerId);
      warnings.push({
        level: "error",
        code: "DUPLICATE_ASSIGNMENT",
        message: `${player?.name ?? playerId} is assigned to ${list.length} zones (${list
          .map((a) => `Zone ${a.zoneId}`)
          .join(", ")}). A player can only defend one zone.`,
        playerId,
      });
    }
  }

  for (const a of assignments) {
    const player = playerById.get(a.playerId);
    if (!player) {
      warnings.push({
        level: "warning",
        code: "UNKNOWN_PLAYER",
        message: `Assignment references a player (${a.playerId}) with no roster/profile data on record.`,
        playerId: a.playerId,
        zoneId: a.zoneId,
      });
      continue;
    }
    if (!player.joined) {
      warnings.push({
        level: "error",
        code: "NOT_JOINED",
        message: `${player.name} is assigned to Zone ${a.zoneId} but has not joined this Territory War.`,
        playerId: a.playerId,
        zoneId: a.zoneId,
      });
    }
    if (!player.squads[a.squadKey]) {
      warnings.push({
        level: "warning",
        code: "SQUAD_NOT_VERIFIED",
        message: `${player.name} is assigned ${SQUAD_DEFINITIONS[a.squadKey].label} in Zone ${a.zoneId}, but their roster doesn't clearly show this squad ready (leader-unit check failed).`,
        playerId: a.playerId,
        zoneId: a.zoneId,
      });
    }
  }

  for (const zone of zones) {
    const count = assignments.filter((a) => a.zoneId === zone.zoneId).length;
    if (count === 0) {
      warnings.push({
        level: "warning",
        code: "EMPTY_ZONE",
        message: `${zone.name} has no defenders assigned yet.`,
        zoneId: zone.zoneId,
      });
    } else if (count > zone.targetCapacity) {
      warnings.push({
        level: "warning",
        code: "OVER_CAPACITY",
        message: `${zone.name} has ${count} defenders assigned, above its target capacity of ${zone.targetCapacity}.`,
        zoneId: zone.zoneId,
      });
    }
    if (!zoneById.has(zone.zoneId)) {
      warnings.push({
        level: "info",
        code: "UNKNOWN_ZONE",
        message: `Zone ${zone.zoneId} is not part of the default zone map.`,
        zoneId: zone.zoneId,
      });
    }
  }

  return warnings;
}

export function computeOffenceReserve(pool: EligiblePlayer[], assignments: AssignmentRecord[]): OffenceReserve {
  const assignedPlayerIds = new Set(assignments.map((a) => a.playerId));
  const unassigned = pool.filter((p) => p.joined && !assignedPlayerIds.has(p.playerId));

  const entries: OffenceReserveEntry[] = SQUAD_KEYS.map((key) => {
    const def = SQUAD_DEFINITIONS[key];
    const players = unassigned
      .filter((p) => p.squads[key])
      .map((p) => ({ playerId: p.playerId, name: p.name }));
    return { squadKey: key, label: def.label, availableCount: players.length, players };
  }).filter((entry) => entry.availableCount > 0);

  const totalOffenseCapableSquads = entries.reduce((sum, e) => sum + e.availableCount, 0);

  let health: OffenceReserveHealth;
  if (totalOffenseCapableSquads >= 15) health = "Strong";
  else if (totalOffenseCapableSquads >= 8) health = "Acceptable";
  else if (totalOffenseCapableSquads >= 3) health = "At Risk";
  else health = "Critical";

  return {
    health,
    reservedCount: unassigned.length,
    totalOffenseCapableSquads,
    entries,
  };
}

export function computeWorkload(pool: EligiblePlayer[], assignments: AssignmentRecord[]): WorkloadEntry[] {
  const playerById = new Map(pool.map((p) => [p.playerId, p]));
  const byPlayer = new Map<string, AssignmentRecord[]>();
  for (const a of assignments) {
    const list = byPlayer.get(a.playerId) ?? [];
    list.push(a);
    byPlayer.set(a.playerId, list);
  }

  return Array.from(byPlayer.entries()).map(([playerId, list]) => ({
    playerId,
    name: playerById.get(playerId)?.name ?? playerId,
    assignmentCount: list.length,
    zones: list.map((a) => a.zoneId),
    squads: list.map((a) => a.squadKey),
    overloaded: list.length > 1,
  }));
}

export type HoldConfidenceLabel = "Strong Hold" | "Likely Hold" | "Contested" | "Vulnerable";

export type HoldConfidence = {
  /** 0-100. An honest heuristic, not a true win probability — see factors. */
  score: number;
  label: HoldConfidenceLabel;
  factors: string[];
};

/**
 * A labeled "hold confidence" estimate for a squad placed in a TW zone.
 *
 * This is deliberately NOT a true win probability: Comlink never exposes the
 * opposing guild's actual defense composition, only locked zone GP totals.
 * So instead of fabricating a number against data we don't have, this scores
 * only what we can actually observe — the squad's own known counter
 * vulnerability (lib/tw-squads.ts TW_COUNTER_STRATEGIES, sourced from
 * community counter data) and how many other guild members could also field
 * it as backup (a rough proxy for "is this squad genuinely guild-ready, or
 * one unlucky disconnect away from an empty zone"). Every caller-facing
 * label must keep saying "confidence" / "hold", never "win chance".
 */
export function computeHoldConfidence(
  squadKey: SquadKey,
  pool: EligiblePlayer[],
  assignedPlayerId?: string
): HoldConfidence {
  const def = SQUAD_DEFINITIONS[squadKey];
  const strategy = TW_COUNTER_STRATEGIES[squadKey];
  const vulnerability = strategy?.vulnerability ?? "Medium";
  const baseScore = vulnerability === "Low" ? 72 : vulnerability === "Medium" ? 54 : 36;

  const backups = pool.filter(
    (p) => p.joined && p.squads[squadKey] && p.playerId !== assignedPlayerId
  ).length;
  const depthBonus = Math.min(20, backups * 4);

  const score = Math.max(5, Math.min(95, baseScore + depthBonus));

  let label: HoldConfidenceLabel;
  if (score >= 75) label = "Strong Hold";
  else if (score >= 55) label = "Likely Hold";
  else if (score >= 35) label = "Contested";
  else label = "Vulnerable";

  const factors = [
    `${def.label} carries ${vulnerability.toLowerCase()} known counter vulnerability against common counters.`,
    backups > 0
      ? `${backups} other joined member${backups === 1 ? "" : "s"} can also field this squad as backup.`
      : "No other joined members currently show this squad ready — thin backup depth.",
  ];

  return { score, label, factors };
}

export function buildDiscordGuildMessage(
  planName: string,
  zones: ZoneInfo[],
  assignments: AssignmentRecord[],
  pool: EligiblePlayer[],
  detailed = false
): string {
  const playerById = new Map(pool.map((p) => [p.playerId, p]));
  const lines: string[] = [`**Territory War Defence Plan — ${planName}**`, ""];

  const sortedZones = [...zones].sort((a, b) => a.zoneId - b.zoneId);
  for (const zone of sortedZones) {
    const zoneAssignments = assignments
      .filter((a) => a.zoneId === zone.zoneId)
      .sort((a, b) => a.priority - b.priority);
    if (zoneAssignments.length === 0) continue;
    lines.push(`__${zone.name}__`);
    for (const a of zoneAssignments) {
      const player = playerById.get(a.playerId);
      const def = SQUAD_DEFINITIONS[a.squadKey];
      const note = detailed && a.officerNote ? ` — _${a.officerNote}_` : "";
      lines.push(`• ${player?.name ?? a.playerId}: ${def.label}${note}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function buildDiscordPersonalMessage(
  player: EligiblePlayer,
  assignments: AssignmentRecord[],
  zones: ZoneInfo[]
): string {
  const own = assignments.filter((a) => a.playerId === player.playerId);
  if (own.length === 0) {
    return `Hey ${player.name} — no defensive assignment yet for this Territory War. Check with an officer.`;
  }
  const zoneById = new Map(zones.map((z) => [z.zoneId, z]));
  const parts = own.map((a) => {
    const def = SQUAD_DEFINITIONS[a.squadKey];
    const zone = zoneById.get(a.zoneId);
    return `${def.label} in ${zone?.name ?? `Zone ${a.zoneId}`}`;
  });
  return `Hey ${player.name} — your Territory War defence: ${parts.join(", ")}. Please place before the deadline and confirm once placed.`;
}
