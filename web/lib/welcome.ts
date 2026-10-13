/** A new arrival stays on the welcome banner for three weeks, long enough for everyone to say hello. */
export const FRESH_DAYS = 21;
export const MAX_NAMES = 4;

type Newcomer = { name: string; joinedAt: Date };

export type Welcome = { names: string[]; more: number; latest: string; single: boolean };

export function joinedLabel(joinedAt: Date, now: number) {
  const days = Math.floor((now - joinedAt.getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

/** Who to welcome right now, or null when nobody is new. `members` is newest first. */
export function buildWelcome(members: Newcomer[], now: number): Welcome | null {
  const fresh = members.filter((member) => new Date(member.joinedAt).getTime() >= now - FRESH_DAYS * 86_400_000);
  if (!fresh.length) return null;
  const shown = fresh.slice(0, MAX_NAMES);
  return { names: shown.map((member) => member.name), more: fresh.length - shown.length, latest: joinedLabel(new Date(shown[0].joinedAt), now), single: fresh.length === 1 };
}
