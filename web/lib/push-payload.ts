/** Pure helpers for what a notification says and who wants it. */

export type PushTopic = "chat" | "droid";
export const PUSH_TOPICS: PushTopic[] = ["chat", "droid"];

export type PushPayload = { title: string; body: string; url: string; tag: string };

function plainText(input: string) {
  return input
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // markdown links -> their text
    .replace(/<@[!&]?\d+>|<#\d+>/g, "") // raw mentions we can't name here
    .replace(/<a?:(\w+):\d+>/g, ":$1:")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(input: string, max = 110) {
  const text = plainText(input);
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function buildPayload(input: { title: string; body: string; url?: string; tag?: string }): PushPayload {
  return {
    title: truncate(input.title, 60) || "Blues Brothers",
    body: truncate(input.body, 110),
    url: input.url && input.url.startsWith("/") ? input.url : "/",
    tag: input.tag ?? "bb",
  };
}

/** Only well-formed browser subscriptions are stored. */
export function validSubscription(value: unknown): { endpoint: string; p256dh: string; auth: string } | null {
  const sub = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  if (!sub || typeof sub.endpoint !== "string" || typeof sub.keys?.p256dh !== "string" || typeof sub.keys?.auth !== "string") return null;
  try {
    const url = new URL(sub.endpoint);
    if (url.protocol !== "https:" || sub.endpoint.length > 1000) return null;
  } catch {
    return null;
  }
  return { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth };
}

export function cleanTopics(value: unknown): PushTopic[] {
  const list = Array.isArray(value) ? value : [];
  return PUSH_TOPICS.filter((topic) => list.includes(topic));
}

/** One chat notification per channel per half minute: the open page already updates live, so bursts needn't buzz. */
const lastChatPush = new Map<string, number>();
export function chatPushAllowed(channel: string, now = Date.now()) {
  const last = lastChatPush.get(channel);
  if (last !== undefined && now - last < 30_000) return false;
  lastChatPush.set(channel, now);
  return true;
}
export function resetChatPushThrottle() {
  lastChatPush.clear();
}
