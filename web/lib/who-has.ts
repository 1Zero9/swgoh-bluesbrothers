import type { CalloutRoster } from "@/lib/tb-callout-match";
import { allUnitNames } from "@/lib/wins";
import unitNameData from "@/lib/unit-names.json";

export type UnitMatch = { id: string; name: string };
export type Holder = { name: string; stars: number; relic: number; gear: number };

const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Unit suggestions for a typed query: names starting with it first, then names containing every word. */
export function searchUnits(query: string, limit = 25, units: UnitMatch[] = allUnitNames()): UnitMatch[] {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(" ");
  const ranked = units
    .map((unit) => {
      const name = norm(unit.name);
      const idText = unit.id.toLowerCase();
      const rank = name.startsWith(q) ? 0 : name.split(" ").some((word) => word.startsWith(words[0])) && words.every((w) => name.includes(w)) ? 1 : words.every((w) => name.includes(w) || idText.includes(w)) ? 2 : 3;
      return { unit, rank };
    })
    .filter((entry) => entry.rank < 3)
    .sort((a, b) => a.rank - b.rank || a.unit.name.localeCompare(b.unit.name));
  return ranked.slice(0, limit).map((entry) => entry.unit);
}

/** A unit from whatever was given: an exact id, an exact name, or the best search match. */
export function resolveUnit(input: string, units: UnitMatch[] = allUnitNames()): UnitMatch | null {
  const text = input.trim();
  if (!text) return null;
  const byId = units.find((unit) => unit.id === text || unit.id.toLowerCase() === text.toLowerCase());
  if (byId) return byId;
  const byName = units.find((unit) => norm(unit.name) === norm(text));
  if (byName) return byName;
  // The site shortens a few names ("Jedi Master Luke"); web pages and the AI use the game's full ones ("Jedi Master Luke Skywalker").
  const official = Object.entries(unitNameData as Record<string, string>).find(([, name]) => norm(name) === norm(text));
  const byOfficial = official ? units.find((unit) => unit.id === official[0]) : undefined;
  if (byOfficial) return byOfficial;
  return searchUnits(text, 1, units)[0] ?? null;
}

/** Best first: stars, then relic, then gear, then name. */
export function sortHolders(holders: Holder[]): Holder[] {
  return [...holders].sort((a, b) => b.stars - a.stars || b.relic - a.relic || b.gear - a.gear || a.name.localeCompare(b.name));
}

/** Everyone who has the unit, best first, optionally at a minimum star level. */
export function findHolders(rosters: CalloutRoster[], unitId: string, minStars = 0): Holder[] {
  return sortHolders(
    rosters.flatMap((roster) => {
      const unit = roster.units?.get(unitId);
      return unit && unit.stars >= minStars ? [{ name: roster.playerName, stars: unit.stars, relic: unit.relic, gear: unit.gear ?? 0 }] : [];
    }),
  );
}

/** The reply text for Discord (kept under its 2,000-character limit). */
export function formatHolders(unit: UnitMatch, holders: Holder[], minStars: number, totalMembers: number) {
  const where = minStars > 0 ? ` at ${minStars}★ or more` : "";
  if (!holders.length) return `Nobody in the guild has **${unit.name}**${where}.`;
  const line = (holder: Holder) => `**${holder.stars}★** ${holder.relic > 0 ? `R${holder.relic}` : `G${holder.gear}`} · ${holder.name}`;
  const shown = holders.slice(0, 40).map(line);
  const more = holders.length - shown.length;
  const head = `**${unit.name}**${where}: ${holders.length} of ${totalMembers} members`;
  return [head, ...shown, more > 0 ? `…and ${more} more.` : ""].filter(Boolean).join("\n").slice(0, 1990);
}

export type WhoHasResult = { unit: UnitMatch | null; holders: Holder[]; totalMembers: number };

type HolderRow = { name: string; stars: string | null; gear: string | null; relic: string | null };

/**
 * The live lookup. The database picks out just this unit from each current member's stored roster, so
 * only a few small rows travel back (loading every full roster takes several seconds).
 */
export async function whoHas(input: string, minStars = 0): Promise<WhoHasResult> {
  const unit = resolveUnit(input);
  if (!unit) return { unit: null, holders: [], totalMembers: 0 };

  const { getPrisma } = await import("@/lib/prisma");
  const prisma = getPrisma();
  const [rows, members] = await Promise.all([
    prisma.$queryRaw<HolderRow[]>`
      SELECT p."currentName" AS name,
             u->>'currentRarity' AS stars,
             u->>'currentTier' AS gear,
             u->'relic'->>'currentTier' AS relic
      FROM "Player" p, jsonb_array_elements(p."profilePayload"->'rosterUnit') u
      WHERE p."profilePayload" IS NOT NULL
        AND split_part(u->>'definitionId', ':', 1) = ${unit.id}
        AND EXISTS (SELECT 1 FROM "MembershipTerm" t WHERE t."playerId" = p.id AND t.state = 'ACTIVE')`,
    prisma.player.count({ where: { membershipTerms: { some: { state: "ACTIVE" } } } }),
  ]);

  const holders = rows
    .map((row) => ({
      name: row.name,
      stars: Number(row.stars ?? 0),
      gear: Number(row.gear ?? 0),
      relic: row.relic === null ? 0 : Math.max(0, Number(row.relic) - 2),
    }))
    .filter((holder) => holder.stars >= minStars);
  return { unit, holders: sortHolders(holders), totalMembers: members };
}
