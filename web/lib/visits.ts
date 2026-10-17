/** Who uses the site, and from where. Pure helpers (tested); the database side is in visits-data.ts. */

export type Geo = { country: string | null; region: string | null; city: string | null };

const clean = (value: string | null | undefined, max: number) => {
  if (!value) return null;
  let text = value;
  try { text = decodeURIComponent(value); } catch { /* keep as sent */ }
  text = text.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
  return text || null;
};

/** The place the host works out from the request (city level only). The IP address itself is never read or stored. */
export function geoFrom(headers: { get(name: string): string | null }): Geo {
  const country = clean(headers.get("x-vercel-ip-country"), 2)?.toUpperCase() ?? null;
  return { country, region: clean(headers.get("x-vercel-ip-country-region"), 8)?.toUpperCase() ?? null, city: clean(headers.get("x-vercel-ip-city"), 60) };
}

export function deviceFrom(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  const ua = (userAgent ?? "").toLowerCase();
  if (/ipad|tablet/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))) return "tablet";
  if (/iphone|ipod|android|mobile/.test(ua)) return "mobile";
  return "desktop";
}

export type VisitRow = { playerId: string | null; playerName: string; at: Date; country: string | null; region: string | null; city: string | null; device: string | null };

export const placeLabel = (geo: Pick<Geo, "country" | "region" | "city">) => [geo.city, geo.region && geo.country === "US" ? geo.region : null, geo.country].filter(Boolean).join(", ") || "Unknown";

export type MemberUse = { playerId: string; name: string; visits: number; lastAt: Date | null; place: string; device: string | null };
export type UseSummary = {
  active: MemberUse[];
  quiet: MemberUse[];
  never: { playerId: string; name: string }[];
  places: { place: string; members: number; visits: number }[];
  countries: { country: string; members: number }[];
  usStates: { region: string; members: number }[];
};

/**
 * Turn visit rows and the current roster into: who uses the site, who has gone quiet, who has never been seen, and where people are.
 * "Quiet" = seen before but not within `quietDays`.
 */
export function summariseUse(visits: VisitRow[], roster: { playerId: string; name: string }[], now = Date.now(), quietDays = 14): UseSummary {
  const byMember = new Map<string, { rows: VisitRow[] }>();
  for (const visit of visits) {
    if (!visit.playerId) continue;
    const entry = byMember.get(visit.playerId) ?? { rows: [] };
    entry.rows.push(visit);
    byMember.set(visit.playerId, entry);
  }
  const mostCommon = (values: (string | null)[]) => {
    const counts = new Map<string, number>();
    for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  const active: MemberUse[] = [];
  const quiet: MemberUse[] = [];
  const never: { playerId: string; name: string }[] = [];
  const cutoff = now - quietDays * 86_400_000;
  const memberPlace = new Map<string, Pick<Geo, "country" | "region" | "city">>();
  for (const member of roster) {
    const entry = byMember.get(member.playerId);
    if (!entry) { never.push(member); continue; }
    const lastAt = entry.rows.reduce((max, row) => (row.at > max ? row.at : max), entry.rows[0].at);
    const geo = { country: mostCommon(entry.rows.map((row) => row.country)), region: mostCommon(entry.rows.map((row) => row.region)), city: mostCommon(entry.rows.map((row) => row.city)) };
    memberPlace.set(member.playerId, geo);
    const use: MemberUse = { playerId: member.playerId, name: member.name, visits: entry.rows.length, lastAt, place: placeLabel(geo), device: mostCommon(entry.rows.map((row) => row.device)) };
    (lastAt.getTime() >= cutoff ? active : quiet).push(use);
  }
  active.sort((a, b) => b.visits - a.visits);
  quiet.sort((a, b) => (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0));
  never.sort((a, b) => a.name.localeCompare(b.name));

  const placeMap = new Map<string, { members: Set<string>; visits: number }>();
  const countryMap = new Map<string, Set<string>>();
  const stateMap = new Map<string, Set<string>>();
  for (const visit of visits) {
    if (!visit.playerId) continue;
    const label = placeLabel(visit);
    const place = placeMap.get(label) ?? { members: new Set<string>(), visits: 0 };
    place.members.add(visit.playerId); place.visits += 1; placeMap.set(label, place);
  }
  for (const [playerId, geo] of memberPlace) {
    if (geo.country) countryMap.set(geo.country, (countryMap.get(geo.country) ?? new Set()).add(playerId));
    if (geo.country === "US" && geo.region) stateMap.set(geo.region, (stateMap.get(geo.region) ?? new Set()).add(playerId));
  }
  return {
    active, quiet, never,
    places: [...placeMap].map(([place, v]) => ({ place, members: v.members.size, visits: v.visits })).sort((a, b) => b.members - a.members || b.visits - a.visits).slice(0, 40),
    countries: [...countryMap].map(([country, set]) => ({ country, members: set.size })).sort((a, b) => b.members - a.members),
    usStates: [...stateMap].map(([region, set]) => ({ region, members: set.size })).sort((a, b) => b.members - a.members),
  };
}
