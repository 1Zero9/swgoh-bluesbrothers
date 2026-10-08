import { UNIT_CHECKLIST } from "@/lib/unit-checklist";

export type WinKind = "GL_UNLOCK" | "ULTIMATE" | "RELIC" | "UNIT_UNLOCK" | "DATACRON";

export type WinDraft = {
  kind: WinKind;
  /** Unit base id, or "" when the unit isn't known (backfilled history, datacrons). */
  subject: string;
  /** GL count, ultimate count, relic level, or datacron count — makes the win idempotent. */
  value: number;
};

type RosterUnit = {
  definitionId?: string;
  relic?: { currentTier?: string | number };
  purchasedAbilityId?: string[];
};

type Profile = {
  rosterUnit?: RosterUnit[];
  datacron?: unknown[];
};

const GL_IDS = new Set(UNIT_CHECKLIST["Galactic Legends"].map((unit) => unit.definitionId));
const UNIT_NAMES = new Map(Object.values(UNIT_CHECKLIST).flat().map((unit) => [unit.definitionId, unit.name]));

function baseId(definitionId: string | undefined) {
  return String(definitionId ?? "").split(":")[0];
}

/** Relic level 0 = not relic-eligible yet; Comlink's currentTier is level + 2. */
function relicLevel(unit: RosterUnit) {
  const tier = Number(unit.relic?.currentTier ?? 0);
  return Number.isFinite(tier) && tier > 2 ? tier - 2 : 0;
}

function ultimateCount(unit: RosterUnit) {
  return (unit.purchasedAbilityId ?? []).filter((id) => id.startsWith("ultimateability_")).length;
}

function indexRoster(profile: Profile) {
  const units = new Map<string, RosterUnit>();
  for (const unit of Array.isArray(profile.rosterUnit) ? profile.rosterUnit : []) {
    const id = baseId(unit.definitionId);
    if (id) units.set(id, unit);
  }
  return units;
}

/**
 * Compares a player's previous and latest profile. Returns nothing without a
 * previous profile so a player's first sync never floods the feed.
 */
export function detectWins(previous: Profile | null | undefined, next: Profile): WinDraft[] {
  if (!previous) return [];
  const before = indexRoster(previous);
  const after = indexRoster(next);
  const wins: WinDraft[] = [];

  const glCount = [...after.keys()].filter((id) => GL_IDS.has(id)).length;
  const glBefore = [...before.keys()].filter((id) => GL_IDS.has(id)).length;
  const ultimates = [...after.values()].reduce((sum, unit) => sum + ultimateCount(unit), 0);
  const ultimatesBefore = [...before.values()].reduce((sum, unit) => sum + ultimateCount(unit), 0);

  for (const [id, unit] of after) {
    const prior = before.get(id);
    if (!prior) {
      if (GL_IDS.has(id)) wins.push({ kind: "GL_UNLOCK", subject: id, value: glCount });
      else wins.push({ kind: "UNIT_UNLOCK", subject: id, value: 1 });
      continue;
    }
    if (ultimateCount(unit) > ultimateCount(prior)) {
      wins.push({ kind: "ULTIMATE", subject: id, value: ultimates });
    }
    const level = relicLevel(unit);
    if (level > relicLevel(prior)) wins.push({ kind: "RELIC", subject: id, value: level });
  }

  // Count-based values only make sense when the count actually moved forward.
  return wins.filter((win) => {
    if (win.kind === "GL_UNLOCK") return glCount > glBefore;
    if (win.kind === "ULTIMATE") return ultimates > ultimatesBefore;
    return true;
  }).concat(datacronWin(previous, next));
}

function datacronWin(previous: Profile, next: Profile): WinDraft[] {
  const was = Array.isArray(previous.datacron) ? previous.datacron.length : 0;
  const now = Array.isArray(next.datacron) ? next.datacron.length : 0;
  return now > was ? [{ kind: "DATACRON", subject: "", value: now }] : [];
}

export function unitName(subject: string) {
  if (!subject) return null;
  return UNIT_NAMES.get(subject) ?? subject.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ordinal(n: number) {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
}

export type WinTier = "headline" | "standard";

export function describeWin(win: WinDraft): { text: string; tag: string; icon: string; tier: WinTier } {
  const unit = unitName(win.subject);
  switch (win.kind) {
    case "GL_UNLOCK":
      return {
        text: unit ? `unlocked ${unit} — their ${ordinal(win.value)} Galactic Legend` : `unlocked their ${ordinal(win.value)} Galactic Legend`,
        tag: "Galactic Legend", icon: "★", tier: "headline",
      };
    case "ULTIMATE":
      return {
        text: unit ? `unlocked the ${unit} Ultimate — ultimate #${win.value}` : `unlocked ultimate #${win.value}`,
        tag: "Ultimate", icon: "⚡", tier: "headline",
      };
    case "RELIC":
      return {
        text: `took ${unit ?? "a unit"} to Relic ${win.value}`,
        tag: "Relic", icon: "◆", tier: win.value >= 7 ? "headline" : "standard",
      };
    case "UNIT_UNLOCK":
      return { text: `unlocked ${unit ?? "a new unit"}`, tag: "New unit", icon: "＋", tier: "standard" };
    case "DATACRON":
      return { text: `reached ${win.value} datacrons`, tag: "Datacrons", icon: "✦", tier: "standard" };
  }
}
