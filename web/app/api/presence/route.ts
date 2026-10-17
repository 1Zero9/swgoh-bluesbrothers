import { getViewerAccess } from "@/lib/access-control";
import { presenceSummary, touchPresence } from "@/lib/presence-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/** A member's browser says "I'm here" (about once a minute while the tab is visible) and gets back who is online. Members and officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return new Response(null, { status: 403 });
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer) || !access.playerId) return Response.json({ ok: false }, { status: 401, headers: NO_STORE });
  const body = (await request.json().catch(() => null)) as { path?: unknown; hidden?: unknown } | null;
  const path = typeof body?.path === "string" && body.path.startsWith("/") ? body.path.split("?")[0].slice(0, 120) : null;
  try {
    await touchPresence(access.playerId, access.playerName ?? "Member", path, body?.hidden === true);
    return Response.json({ ok: true, ...(await presenceSummary(access.playerId)) }, { headers: NO_STORE });
  } catch (error) {
    console.error("presence: failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ ok: false }, { status: 500, headers: NO_STORE });
  }
}
