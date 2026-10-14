/**
 * Where a counter applies. They are kept strictly apart: a 3v3 counter says nothing about 5v5, and Territory War
 * has its own rules (no turn-meter reset between rounds, different omicron effects), so nothing is ever merged across modes.
 */
export const MODES = ["GAC_5V5", "GAC_3V3", "TW", "GAC_FLEET", "TW_FLEET"] as const;
export type KbMode = (typeof MODES)[number];

export const MODE_LABELS: Record<KbMode, string> = {
  GAC_5V5: "Grand Arena 5v5",
  GAC_3V3: "Grand Arena 3v3",
  TW: "Territory War",
  GAC_FLEET: "Grand Arena fleet",
  TW_FLEET: "Territory War fleet",
};

export function isMode(value: unknown): value is KbMode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

export type SquadKind = "SQUAD" | "FLEET";

/** How many units a squad has in this mode. Fleets are a capital ship or leader, starting ships and reinforcements. */
export function squadRules(mode: KbMode): { kind: SquadKind; min: number; max: number } {
  switch (mode) {
    case "GAC_3V3": return { kind: "SQUAD", min: 3, max: 3 };
    case "GAC_5V5":
    case "TW": return { kind: "SQUAD", min: 5, max: 5 };
    case "GAC_FLEET":
    case "TW_FLEET": return { kind: "FLEET", min: 2, max: 8 };
  }
}

export const MAX_STARTING_SHIPS = 5;
