import { freshness, isCurrentlyUsable } from "@/lib/knowledge/lifecycle";
import type { KbMode } from "@/lib/knowledge/modes";

export type SquadView = { teamName: string; aliases: string[]; leaderUnitId: string | null; memberIds: string[]; variantKey: string };

export type MatchupRow = {
  id: string;
  status: string;
  mode: string;
  defender: SquadView;
  attacker: SquadView;
  datacronDependent: boolean;
  datacronExpiresAt: Date | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type SearchQuery = {
  text?: string;
  mode?: KbMode;
  /** The defending squad's exact variant key: only this exact squad matches. */
  defenderVariantKey?: string;
  /** A defending leader (or any unit): the whole team family matches. */
  defenderUnitId?: string;
  /** Include candidates, disputed and outdated records (reviewers). Off by default: members only see published. */
  includeUnpublished?: boolean;
  /** Hide counters whose Datacron has expired (what B-Lue3 uses). */
  usableOnly?: boolean;
};

export type MatchKind = "EXACT" | "FAMILY" | "TEXT";
export type Hit<T extends MatchupRow> = T & { match: MatchKind; usable: boolean };

const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Finds match-ups. Mode is always an exact filter. Exact variant beats team family beats text match; counters
 * that can be used today come before ones with an expired Datacron.
 */
export function searchMatchups<T extends MatchupRow>(rows: T[], query: SearchQuery, nameOf: (unitId: string) => string, now: number): Hit<T>[] {
  const text = query.text ? norm(query.text) : "";
  const hits: Hit<T>[] = [];
  for (const row of rows) {
    if (!query.includeUnpublished && row.status !== "PUBLISHED") continue;
    if (query.mode && row.mode !== query.mode) continue;
    const usable = isCurrentlyUsable(row, now);
    if (query.usableOnly && !usable) continue;

    let match: MatchKind | null = null;
    if (query.defenderVariantKey) {
      if (row.defender.variantKey !== query.defenderVariantKey) continue;
      match = "EXACT";
    } else if (query.defenderUnitId) {
      if (row.defender.leaderUnitId !== query.defenderUnitId && !row.defender.memberIds.includes(query.defenderUnitId)) continue;
      match = row.defender.leaderUnitId === query.defenderUnitId ? "FAMILY" : "TEXT";
    }
    if (text) {
      const haystack = [row.defender.teamName, ...row.defender.aliases, row.attacker.teamName, ...row.attacker.aliases, ...row.defender.memberIds.map(nameOf), ...row.attacker.memberIds.map(nameOf)].map(norm);
      if (!text.split(" ").every((word) => haystack.some((entry) => entry.includes(word)))) continue;
      match ??= "TEXT";
    }
    hits.push({ ...row, match: match ?? "TEXT", usable });
  }
  const rank = { EXACT: 0, FAMILY: 1, TEXT: 2 } as const;
  return hits.sort((a, b) => Number(b.usable) - Number(a.usable) || rank[a.match] - rank[b.match] || Number(freshness(a, now).needsRefresh) - Number(freshness(b, now).needsRefresh));
}
