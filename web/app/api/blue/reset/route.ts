import { getViewerAccess } from "@/lib/access-control";
import { getUsage, resetUsage } from "@/lib/blue/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/** Officers only: start your own B-Lue3 week again (for testing, or to put right a bad count). */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return Response.json({ ok: false, error: "Not allowed." }, { status: 403, headers: NO_STORE });
  const access = await getViewerAccess();
  if (!access.isOfficer) return Response.json({ ok: false, error: "Officers only." }, { status: 403, headers: NO_STORE });
  const who = access.playerId ?? "officer";
  await resetUsage(who);
  return Response.json({ ok: true, usage: await getUsage(who) }, { headers: NO_STORE });
}
