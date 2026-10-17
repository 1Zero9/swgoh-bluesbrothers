/** Who's online: pure helpers (tested). The database side is in presence-data.ts. */

/** A member counts as on the site while their last heartbeat (sent about every minute) is under this old. */
export const SITE_ONLINE_MS = 150_000;
/** "Last seen in the game" lists members the game reported active within this window (the game data is refreshed hourly). */
export const GAME_RECENT_MS = 24 * 3_600_000;

export const isOnSite = (lastSeen: Date | number, now = Date.now()) => now - new Date(lastSeen).getTime() < SITE_ONLINE_MS;

/** The game reports last activity as a number of milliseconds (or seconds) since 1970, usually as text. */
export function parseActivity(value: unknown): Date | null {
  const n = typeof value === "number" ? value : typeof value === "string" && /^\d{9,14}$/.test(value.trim()) ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  const ms = n < 1e11 ? n * 1000 : n;
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  return year >= 2012 && year <= 2100 ? date : null;
}

export function agoLabel(at: Date | number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(at).getTime()) / 1000));
  if (seconds < 90) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} h ago`;
}
