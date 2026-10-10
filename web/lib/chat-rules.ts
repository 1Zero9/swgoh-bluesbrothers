/** Small, pure rules for posting from the site into Discord. */

export const MAX_MESSAGE_LENGTH = 1000;

/** Discord rejects webhook names containing these, and caps the length at 80. */
export function webhookDisplayName(name: string) {
  const cleaned = name.replace(/clyde|discord/gi, "•").replace(/[@#:`]/g, "").trim();
  return (cleaned || "Guild member").slice(0, 80);
}

export function cleanMessage(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const text = input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return null;
  return text.slice(0, MAX_MESSAGE_LENGTH);
}

const posts = new Map<string, number[]>();

/** One message every 2 seconds and 15 a minute per member (best effort per server instance). */
export function postingAllowed(playerId: string, now = Date.now()) {
  const recent = (posts.get(playerId) ?? []).filter((time) => now - time < 60_000);
  const last = recent[recent.length - 1];
  if ((last !== undefined && now - last < 2000) || recent.length >= 15) {
    posts.set(playerId, recent);
    return false;
  }
  recent.push(now);
  posts.set(playerId, recent);
  if (posts.size > 500) for (const [key, times] of posts) if (times.every((time) => now - time >= 60_000)) posts.delete(key);
  return true;
}

export function resetPostingLimits() {
  posts.clear();
}
