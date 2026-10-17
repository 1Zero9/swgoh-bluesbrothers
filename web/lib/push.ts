import webpush from "web-push";
import { buildPayload, chatPushAllowed, type PushPayload, type PushTopic } from "@/lib/push-payload";
import { getPrisma } from "@/lib/prisma";

let configured: boolean | null = null;

/** Push needs a VAPID key pair; without one every function here quietly does nothing. */
export function pushConfigured() {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey, privateKey);
  return (configured = true);
}

export function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

type Target = { id: string; endpoint: string; p256dh: string; auth: string };

async function deliver(targets: Target[], payload: PushPayload) {
  const prisma = getPrisma();
  const body = JSON.stringify(payload);
  let sent = 0;
  for (let i = 0; i < targets.length; i += 10) {
    await Promise.all(targets.slice(i, i + 10).map(async (target) => {
      try {
        await webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, body, { TTL: 3600, urgency: "normal" });
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // The device unsubscribed or the subscription expired: forget it.
        if (status === 404 || status === 410) await prisma.pushSubscription.delete({ where: { id: target.id } }).catch(() => undefined);
      }
    }));
  }
  if (sent) await prisma.pushSubscription.updateMany({ where: { id: { in: targets.map((t) => t.id) } }, data: { lastNotifiedAt: new Date() } }).catch(() => undefined);
  return sent;
}

/** Notify every current member who asked for this topic (optionally skipping one person). */
export async function notifyMembers(topic: PushTopic, input: { title: string; body: string; url?: string; tag?: string }, options: { excludePlayerId?: string } = {}) {
  if (!pushConfigured()) return 0;
  try {
    const targets = await getPrisma().pushSubscription.findMany({
      where: {
        topics: { has: topic },
        ...(options.excludePlayerId ? { playerId: { not: options.excludePlayerId } } : {}),
        player: { membershipTerms: { some: { state: "ACTIVE" } } },
      },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });
    if (!targets.length) return 0;
    return await deliver(targets, buildPayload({ tag: topic, ...input }));
  } catch (error) {
    console.error("push notify failed", error);
    return 0;
  }
}

/** An automatic post by the Droid (a war result, a milestone, the weekly question...). */
export function notifyDroidPost(post: { title: string; description: string }) {
  return notifyMembers("droid", { title: post.title, body: post.description, url: "/chat", tag: "droid" });
}

/** A message someone sent from the site's chat. Bursts are throttled per channel. */
export function notifyChatMessage(channelLabel: string, senderName: string, content: string, senderPlayerId: string, channelKey: string) {
  if (!chatPushAllowed(channelKey)) return Promise.resolve(0);
  return notifyMembers("chat", { title: `${channelLabel} · ${senderName}`, body: content, url: "/chat", tag: `chat-${channelKey}` }, { excludePlayerId: senderPlayerId });
}

/** A test notification to one member's own devices. */
export async function notifyOnePlayer(playerId: string) {
  if (!pushConfigured()) return 0;
  const targets = await getPrisma().pushSubscription.findMany({ where: { playerId }, select: { id: true, endpoint: true, p256dh: true, auth: true } });
  if (!targets.length) return 0;
  return deliver(targets, buildPayload({ title: "Blues Brothers", body: "Notifications are on. You'll hear about wins, war results and chat here.", url: "/me", tag: "test" }));
}

/** A direct message to specific members' devices (for example, "your counter is ready"). They asked for it, so no topic is needed. */
export async function notifyPlayers(playerIds: string[], input: { title: string; body: string; url?: string; tag?: string }) {
  if (!pushConfigured() || !playerIds.length) return 0;
  try {
    const targets = await getPrisma().pushSubscription.findMany({ where: { playerId: { in: playerIds } }, select: { id: true, endpoint: true, p256dh: true, auth: true } });
    if (!targets.length) return 0;
    return await deliver(targets, buildPayload(input));
  } catch (error) {
    console.error("push notify failed", error);
    return 0;
  }
}
