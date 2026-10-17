import type { SubmissionInput } from "@/lib/knowledge/validate";
import type { KbMember } from "@/lib/knowledge/squad";
import type { KbMode } from "@/lib/knowledge/modes";

/** A row of the older "Saved squads" list: one enemy leader, the squad that beats it, and a mode of TW, GAC or both. */
export type SavedCounterRow = {
  id: string; enemyLeaderId: string; title: string; mode: string; notes: string | null;
  squad: { unitId: string; minStars?: number; minRelic?: number }[];
  createdById: string | null; createdByName: string; createdAt: Date;
};

export const savedImportKey = (id: string) => `saved:${id}`;

/**
 * Saved squads only said "GAC", not 5v5 or 3v3, and the knowledge base never mixes modes. So GAC counters come in as 5v5 with a plain
 * note asking the reviewer to confirm, and a "both" counter comes in once for Territory War and once for GAC 5v5.
 */
export function modesFor(mode: string): KbMode[] {
  if (mode === "TW") return ["TW"];
  if (mode === "GAC") return ["GAC_5V5"];
  return ["TW", "GAC_5V5"];
}

/** Turn one saved squad into submissions for the knowledge base (always candidates: an officer checks them). */
export function savedToSubmissions(row: SavedCounterRow): { mode: KbMode; importKey: string; input: SubmissionInput }[] {
  const members = row.squad.map((slot, index) => ({ unitId: slot.unitId, role: index === 0 ? "LEADER" : "CORE" } as KbMember));
  const minRelic: Record<string, number> = {};
  for (const slot of row.squad) if ((slot.minRelic ?? 0) > 0) minRelic[slot.unitId] = slot.minRelic as number;
  const modes = modesFor(row.mode);
  return modes.map((mode) => ({
    mode,
    importKey: modes.length > 1 ? `${savedImportKey(row.id)}:${mode}` : savedImportKey(row.id),
    input: {
      mode,
      defender: { kind: "SQUAD", members: [{ unitId: row.enemyLeaderId, role: "LEADER" } as KbMember] },
      attacker: { kind: "SQUAD", members },
      strategy: [row.notes, mode === "GAC_5V5" && row.mode !== "TW" ? "Imported from Saved squads, which did not say 5v5 or 3v3. Please confirm the mode." : null].filter(Boolean).join(" ") || null,
      opening: null, targetPriority: null, failureConditions: null, relicGuidance: null, speedNotes: null, oneShot: null, freshEnemyOnly: null,
      requirements: Object.keys(minRelic).length ? { zetas: [], omicrons: [], ultimates: [], minRelic } : null,
      datacronDependent: false, datacronExpiresAt: null,
      evidence: [{
        type: "COMMUNITY_REPORT", sourceProvider: "Saved squads (guild member)", sourceUrl: null, sourceRef: savedImportKey(row.id), attribution: row.createdByName,
        publishedAt: row.createdAt, observedAt: row.createdAt, season: null, gameVersion: null, conditions: null, battles: null, wins: null, losses: null, banners: null,
        summary: `"${row.title}", saved by ${row.createdByName}.`,
      }],
    },
  }));
}
