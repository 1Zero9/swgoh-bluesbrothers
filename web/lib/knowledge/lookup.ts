import { loadMemberUnits } from "@/lib/counters-data";
import { squadStatus, type SquadSlot } from "@/lib/counters";
import { findMatchups, unitLabel } from "@/lib/knowledge/data";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import { getPrisma } from "@/lib/prisma";

export type KnownCounter = {
  id: string;
  mode: string;
  modeLabel: string;
  exactMatch: boolean;
  attackingSquad: string[];
  strategy: string | null;
  requirements: { zetas?: string[]; omicrons?: string[]; ultimates?: string[]; minRelic?: Record<string, number> } | null;
  datacronDependent: boolean;
  datacronEnds: string | null;
  guildmatesWhoUseIt: number;
  evidence: { type: string; source: string; url: string | null; date: string }[];
  lastReviewed: string | null;
  memberCanRunIt: boolean | null;
  memberStillNeeds: string[];
};

/**
 * Published, reviewed, unexpired counters for an enemy leader, optionally in one mode, with whether this member can run each.
 * Reads the database only: no AI. Used by the free database-first answer and by B-Lue3's findKnownCounters tool.
 */
export async function lookupKnownCounters(unitId: string, mode: KbMode | null, playerId: string | null, limit = 5): Promise<{ published: number; counters: KnownCounter[] }> {
  const hits = (await findMatchups({ defenderUnitId: unitId, mode: mode ?? undefined, usableOnly: true }, playerId)).slice(0, limit);
  const mine = playerId ? (await loadMemberUnits([...new Set(hits.flatMap((hit) => hit.attacker.memberIds))])).find((member) => member.playerId === playerId) : undefined;
  const evidence = hits.length
    ? await getPrisma().kbEvidence.findMany({ where: { matchupId: { in: hits.map((hit) => hit.id) } }, orderBy: { createdAt: "desc" }, select: { matchupId: true, type: true, sourceProvider: true, sourceUrl: true, observedAt: true, publishedAt: true } })
    : [];
  return {
    published: hits.length,
    counters: hits.map((hit) => {
      const needs = (hit.requirements as { minRelic?: Record<string, number> } | null)?.minRelic ?? {};
      const slots: SquadSlot[] = hit.attacker.memberIds.map((id) => ({ unitId: id, minStars: 7, minRelic: needs[id] ?? 0 }));
      const status = playerId ? squadStatus(slots, mine, unitLabel) : null;
      return {
        id: hit.id,
        mode: hit.mode,
        modeLabel: MODE_LABELS[hit.mode as KbMode] ?? hit.mode,
        exactMatch: hit.match === "EXACT",
        attackingSquad: hit.attacker.memberIds.map(unitLabel),
        strategy: hit.strategy,
        requirements: hit.requirements as KnownCounter["requirements"],
        datacronDependent: hit.datacronDependent,
        datacronEnds: hit.datacronExpiresAt?.toISOString().slice(0, 10) ?? null,
        guildmatesWhoUseIt: hit.useCount,
        evidence: evidence.filter((item) => item.matchupId === hit.id).slice(0, 3).map((item) => ({ type: item.type, source: item.sourceProvider, url: item.sourceUrl, date: (item.observedAt ?? item.publishedAt)?.toISOString().slice(0, 10) ?? "date unknown" })),
        lastReviewed: hit.reviewedAt?.toISOString().slice(0, 10) ?? null,
        memberCanRunIt: status ? status.ready : null,
        memberStillNeeds: status && !status.ready ? status.gaps : [],
      };
    }),
  };
}
