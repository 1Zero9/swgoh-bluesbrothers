import { getViewerAccess } from "@/lib/access-control";
import { notifyOnePlayer } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Sends a test notification to the signed-in member's own devices. */
export async function POST() {
  const access = await getViewerAccess();
  if (!access.isMember || !access.playerId) return Response.json({ ok: false, error: "Sign in with Discord first." }, { status: 401 });
  const sent = await notifyOnePlayer(access.playerId);
  return Response.json({ ok: sent > 0, sent, error: sent ? undefined : "No notification could be sent. Turn notifications on first." }, { status: sent ? 200 : 409, headers: { "Cache-Control": "no-store" } });
}
