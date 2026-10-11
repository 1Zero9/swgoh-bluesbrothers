import { getViewerAccess } from "@/lib/access-control";
import { getPrisma } from "@/lib/prisma";
import { pushConfigured, vapidPublicKey } from "@/lib/push";
import { cleanTopics, validSubscription } from "@/lib/push-payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, { status, headers: NO_STORE });
}

/** Is push switched on, and what does this device (by endpoint) currently subscribe to? */
export async function GET(request: Request) {
  const access = await getViewerAccess();
  if (!access.isMember || !access.playerId) return fail("Sign in with Discord first.", 401);
  const endpoint = new URL(request.url).searchParams.get("endpoint");
  const existing = endpoint
    ? await getPrisma().pushSubscription.findFirst({ where: { endpoint, playerId: access.playerId }, select: { topics: true } })
    : null;
  return Response.json({ ok: true, configured: pushConfigured(), publicKey: vapidPublicKey(), subscribed: Boolean(existing), topics: existing?.topics ?? [] }, { headers: NO_STORE });
}

/** Save (or update) this device's subscription for the signed-in member. */
export async function POST(request: Request) {
  const access = await getViewerAccess();
  if (!access.isMember || !access.playerId) return fail("Sign in with Discord first.", 401);
  if (!pushConfigured()) return fail("Notifications aren't switched on for the site yet.", 503);

  const body = (await request.json().catch(() => null)) as { subscription?: unknown; topics?: unknown } | null;
  const subscription = validSubscription(body?.subscription);
  if (!subscription) return fail("That subscription isn't valid.", 400);
  const topics = cleanTopics(body?.topics ?? ["chat", "droid"]);

  await getPrisma().pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { playerId: access.playerId, p256dh: subscription.p256dh, auth: subscription.auth, topics },
    create: { playerId: access.playerId, ...subscription, topics, userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null },
  });
  return Response.json({ ok: true, topics }, { headers: NO_STORE });
}

/** Change which topics this device wants. */
export async function PATCH(request: Request) {
  const access = await getViewerAccess();
  if (!access.isMember || !access.playerId) return fail("Sign in with Discord first.", 401);
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown; topics?: unknown } | null;
  if (typeof body?.endpoint !== "string") return fail("Missing endpoint.", 400);
  const updated = await getPrisma().pushSubscription.updateMany({
    where: { endpoint: body.endpoint, playerId: access.playerId },
    data: { topics: cleanTopics(body.topics) },
  });
  return updated.count ? Response.json({ ok: true }, { headers: NO_STORE }) : fail("That device isn't subscribed.", 404);
}

/** Turn notifications off for this device. */
export async function DELETE(request: Request) {
  const access = await getViewerAccess();
  if (!access.isMember || !access.playerId) return fail("Sign in with Discord first.", 401);
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string") return fail("Missing endpoint.", 400);
  await getPrisma().pushSubscription.deleteMany({ where: { endpoint: body.endpoint, playerId: access.playerId } });
  return Response.json({ ok: true }, { headers: NO_STORE });
}
