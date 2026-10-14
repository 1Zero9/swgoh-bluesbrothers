import { MAX_STARTING_SHIPS, squadRules, type KbMode, type SquadKind } from "@/lib/knowledge/modes";

export type MemberRole = "LEADER" | "CORE" | "OPTIONAL" | "STARTING" | "REINFORCEMENT";
export type KbMember = { unitId: string; role: MemberRole; alternatives?: string[] };

const SQUAD_ROLES: MemberRole[] = ["LEADER", "CORE", "OPTIONAL"];
const FLEET_ROLES: MemberRole[] = ["LEADER", "STARTING", "OPTIONAL", "REINFORCEMENT"];

/**
 * The identity of an exact squad: kind, leader and the set of units. Order and optional-slot alternatives do not change it,
 * so the same squad typed two ways is one squad. Different units, or a different leader, are a different variant.
 */
export function variantKey(kind: SquadKind, members: KbMember[]): string {
  const leader = members.find((member) => member.role === "LEADER")?.unitId ?? "";
  const rest = members.filter((member) => member.role !== "LEADER" && member.role !== "REINFORCEMENT").map((member) => member.unitId).sort();
  const reinforcements = members.filter((member) => member.role === "REINFORCEMENT").map((member) => member.unitId).sort();
  return `${kind}|${leader}|${rest.join(",")}|${reinforcements.join(",")}`;
}

export type SquadCheck = { ok: true; kind: SquadKind; members: KbMember[] } | { ok: false; error: string };

/** Checks a squad against a mode's shape and the game's unit list, and returns it cleaned. */
export function checkSquad(raw: unknown, mode: KbMode, knownUnits: ReadonlySet<string>, side: "defending" | "attacking"): SquadCheck {
  const rules = squadRules(mode);
  if (!Array.isArray(raw)) return { ok: false, error: `The ${side} squad is missing.` };
  const roles = rules.kind === "FLEET" ? FLEET_ROLES : SQUAD_ROLES;
  const members: KbMember[] = [];
  const seen = new Set<string>();

  for (const item of raw as { unitId?: unknown; role?: unknown; alternatives?: unknown }[]) {
    const unitId = typeof item?.unitId === "string" ? item.unitId : "";
    if (!knownUnits.has(unitId)) return { ok: false, error: `The ${side} squad has a unit the game doesn't know. Pick every unit from the list.` };
    if (seen.has(unitId)) return { ok: false, error: `The ${side} squad has the same unit twice.` };
    seen.add(unitId);
    const role = item.role as MemberRole;
    if (!roles.includes(role)) return { ok: false, error: `The ${side} squad has an invalid role for ${unitId}.` };
    const alternatives = Array.isArray(item.alternatives) ? [...new Set((item.alternatives as unknown[]).filter((value): value is string => typeof value === "string" && knownUnits.has(value) && value !== unitId))].slice(0, 5) : [];
    if (alternatives.length && role !== "OPTIONAL") return { ok: false, error: `Only an optional slot can list alternatives (${unitId}).` };
    members.push(alternatives.length ? { unitId, role, alternatives } : { unitId, role });
  }

  if (members.length < rules.min || members.length > rules.max) {
    const wanted = rules.min === rules.max ? `${rules.min}` : `${rules.min} to ${rules.max}`;
    return { ok: false, error: `A ${side} squad in this mode has ${wanted} units; this one has ${members.length}.` };
  }
  if (members.filter((member) => member.role === "LEADER").length !== 1) return { ok: false, error: `The ${side} squad needs exactly one leader.` };
  if (rules.kind === "FLEET" && members.filter((member) => member.role !== "REINFORCEMENT").length > MAX_STARTING_SHIPS) {
    return { ok: false, error: `A fleet starts with at most ${MAX_STARTING_SHIPS} ships; the rest are reinforcements.` };
  }
  return { ok: true, kind: rules.kind, members };
}
