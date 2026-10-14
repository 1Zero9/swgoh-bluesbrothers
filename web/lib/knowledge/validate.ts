import { isMode, type KbMode } from "@/lib/knowledge/modes";
import type { Via } from "@/lib/knowledge/permissions";
import { checkSquad, type KbMember } from "@/lib/knowledge/squad";
import type { SquadKind } from "@/lib/knowledge/modes";

export const EVIDENCE_TYPES = ["AGGREGATED", "INDIVIDUAL_BATTLE", "DEMONSTRATION", "COMMUNITY_REPORT", "THEORY"] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export type EvidenceInput = {
  type: EvidenceType;
  sourceProvider: string;
  sourceUrl: string | null;
  sourceRef: string | null;
  attribution: string | null;
  publishedAt: Date | null;
  observedAt: Date | null;
  season: string | null;
  gameVersion: string | null;
  conditions: string | null;
  battles: number | null;
  wins: number | null;
  losses: number | null;
  banners: number | null;
  summary: string | null;
};

export type Requirements = { zetas: string[]; omicrons: string[]; ultimates: string[]; minRelic: Record<string, number> };

export type SubmissionInput = {
  mode: KbMode;
  defender: { kind: SquadKind; members: KbMember[] };
  attacker: { kind: SquadKind; members: KbMember[] };
  strategy: string | null;
  opening: string | null;
  targetPriority: string | null;
  failureConditions: string | null;
  relicGuidance: string | null;
  speedNotes: string | null;
  oneShot: boolean | null;
  freshEnemyOnly: boolean | null;
  requirements: Requirements | null;
  datacronDependent: boolean;
  datacronExpiresAt: Date | null;
  evidence: EvidenceInput[];
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Plain text from outside: control characters out, whitespace tidied, length capped. Never trusted as instructions. */
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/[ \t]+/g, " ").trim();
  return text ? text.slice(0, max) : null;
}

/** http(s) links only. Anything else (javascript:, data:, file:) is refused. */
export function cleanUrl(value: unknown): string | null {
  const text = cleanText(value, 500);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

const cleanDate = (value: unknown): Date | null | "bad" => {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "bad" : date;
};

/** Unknown stays unknown: a missing number is null, never zero. A negative or fractional count is an error. */
const cleanCount = (value: unknown): number | null | "bad" => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 1_000_000_000 ? n : "bad";
};

const cleanTriState = (value: unknown): boolean | null => (value === true ? true : value === false ? false : null);

const cleanList = (value: unknown, max: number): string[] =>
  Array.isArray(value) ? [...new Set(value.map((item) => cleanText(item, 60)).filter((item): item is string => item !== null))].slice(0, max) : [];

function cleanRequirements(value: unknown, known: ReadonlySet<string>): Requirements | null {
  if (!value || typeof value !== "object") return null;
  const input = value as { zetas?: unknown; omicrons?: unknown; ultimates?: unknown; minRelic?: unknown };
  const minRelic: Record<string, number> = {};
  if (input.minRelic && typeof input.minRelic === "object") {
    for (const [unitId, level] of Object.entries(input.minRelic as Record<string, unknown>)) {
      const n = Number(level);
      if (known.has(unitId) && Number.isInteger(n) && n >= 0 && n <= 9) minRelic[unitId] = n;
    }
  }
  const result: Requirements = { zetas: cleanList(input.zetas, 10), omicrons: cleanList(input.omicrons, 10), ultimates: cleanList(input.ultimates, 10), minRelic };
  const empty = !result.zetas.length && !result.omicrons.length && !result.ultimates.length && !Object.keys(minRelic).length;
  return empty ? null : result;
}

function cleanEvidence(raw: unknown, via: Via): Result<EvidenceInput> {
  const item = raw as Record<string, unknown> | null;
  if (!item || typeof item !== "object") return { ok: false, error: "Evidence is malformed." };
  const type = item.type as EvidenceType;
  if (!EVIDENCE_TYPES.includes(type)) return { ok: false, error: "Pick what kind of evidence this is." };
  // Only an import of a real aggregated source can claim aggregated battle counts.
  if (type === "AGGREGATED" && via !== "IMPORT") return { ok: false, error: "Aggregated battle counts can only come from an import of a real source." };
  if (via === "BLUE" && type !== "COMMUNITY_REPORT" && type !== "THEORY") return { ok: false, error: "B-Lue3 can only file community reports or theory." };

  const sourceProvider = cleanText(item.sourceProvider, 80);
  if (!sourceProvider) return { ok: false, error: "Say where this evidence comes from." };
  const sourceUrl = item.sourceUrl ? cleanUrl(item.sourceUrl) : null;
  if (item.sourceUrl && !sourceUrl) return { ok: false, error: "The source link must be a normal web address (https://…)." };
  if (via === "BLUE" && !sourceUrl) return { ok: false, error: "B-Lue3 needs a source link to file anything." };

  const publishedAt = cleanDate(item.publishedAt);
  const observedAt = cleanDate(item.observedAt);
  const battles = cleanCount(item.battles);
  const wins = cleanCount(item.wins);
  const losses = cleanCount(item.losses);
  if (publishedAt === "bad" || observedAt === "bad") return { ok: false, error: "A date in the evidence isn't valid." };
  if (battles === "bad" || wins === "bad" || losses === "bad") return { ok: false, error: "Battle counts must be whole numbers, or left blank if unknown." };
  if (battles !== null && wins !== null && wins > battles) return { ok: false, error: "Wins can't be more than battles." };
  if (battles !== null && losses !== null && losses > battles) return { ok: false, error: "Losses can't be more than battles." };
  if (battles !== null && wins !== null && losses !== null && wins + losses > battles) return { ok: false, error: "Wins plus losses can't be more than battles." };
  let banners: number | null = null;
  if (item.banners !== undefined && item.banners !== null && item.banners !== "") {
    const n = Number(item.banners);
    if (!Number.isFinite(n) || n < 0 || n > 1000) return { ok: false, error: "Banners must be a normal number, or blank if unknown." };
    banners = n;
  }
  return {
    ok: true,
    value: {
      type, sourceProvider, sourceUrl,
      sourceRef: cleanText(item.sourceRef, 120), attribution: cleanText(item.attribution, 120),
      publishedAt, observedAt,
      season: cleanText(item.season, 60), gameVersion: cleanText(item.gameVersion, 40), conditions: cleanText(item.conditions, 300),
      battles, wins, losses, banners, summary: cleanText(item.summary, 400),
    },
  };
}

/** Checks a counter submission from a member, B-Lue3 or an import and returns it cleaned, or what is wrong with it. */
export function validateSubmission(body: unknown, via: Via, knownUnits: ReadonlySet<string>): Result<SubmissionInput> {
  const input = body as Record<string, unknown> | null;
  if (!input || typeof input !== "object") return { ok: false, error: "Nothing was submitted." };
  if (!isMode(input.mode)) return { ok: false, error: "Pick the game mode this counter is for." };
  const mode = input.mode;

  const defender = checkSquad((input.defender as { members?: unknown } | null)?.members, mode, knownUnits, "defending");
  if (!defender.ok) return { ok: false, error: defender.error };
  const attacker = checkSquad((input.attacker as { members?: unknown } | null)?.members, mode, knownUnits, "attacking");
  if (!attacker.ok) return { ok: false, error: attacker.error };

  const strategy = cleanText(input.strategy, 1200);
  if (!strategy) return { ok: false, error: "Say how to run it: a few lines on the strategy." };

  const evidenceRaw = Array.isArray(input.evidence) ? input.evidence.slice(0, 5) : [];
  if (via === "BLUE" && !evidenceRaw.length) return { ok: false, error: "B-Lue3 needs at least one source to file anything." };
  const evidence: EvidenceInput[] = [];
  for (const raw of evidenceRaw) {
    const checked = cleanEvidence(raw, via);
    if (!checked.ok) return { ok: false, error: checked.error };
    evidence.push(checked.value);
  }

  const datacron = input.datacron as { dependent?: unknown; expiresAt?: unknown } | null | undefined;
  const datacronDependent = datacron?.dependent === true;
  const expiry = datacronDependent ? cleanDate(datacron?.expiresAt) : null;
  if (expiry === "bad") return { ok: false, error: "The Datacron end date isn't valid." };

  return {
    ok: true,
    value: {
      mode,
      defender: { kind: defender.kind, members: defender.members },
      attacker: { kind: attacker.kind, members: attacker.members },
      strategy,
      opening: cleanText(input.opening, 600),
      targetPriority: cleanText(input.targetPriority, 400),
      failureConditions: cleanText(input.failureConditions, 600),
      relicGuidance: cleanText(input.relicGuidance, 400),
      speedNotes: cleanText(input.speedNotes, 400),
      oneShot: cleanTriState(input.oneShot),
      freshEnemyOnly: cleanTriState(input.freshEnemyOnly),
      requirements: cleanRequirements(input.requirements, knownUnits),
      datacronDependent,
      datacronExpiresAt: expiry,
      evidence,
    },
  };
}
