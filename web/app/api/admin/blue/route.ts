import { getViewerAccess } from "@/lib/access-control";
import { adminOverview } from "@/lib/blue/log";
import { isSiteAdmin } from "@/lib/site-admin";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** The recorded questions. Site admin only (not officers). */
export async function GET(request: Request) {
  const access = await getViewerAccess();
  if (!isSiteAdmin(access)) return fail("Site admin only.", 403);
  const filter = new URL(request.url).searchParams.get("filter") === "blocked" ? "blocked" : "all";
  return Response.json({ ok: true, ...(await adminOverview(filter)) }, { headers: NO_STORE });
}

/** Cut a member off from B-Lue3, or restore them. Site admin only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!isSiteAdmin(access)) return fail("Site admin only.", 403);
  const body = (await request.json().catch(() => null)) as { action?: unknown; playerId?: unknown; name?: unknown; reason?: unknown } | null;
  if (typeof body?.playerId !== "string" || !body.playerId) return fail("Missing member.", 400);
  const db = getPrisma();
  if (body.action === "cutoff") {
    const name = typeof body.name === "string" ? body.name.slice(0, 80) : "Member";
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 200) : null;
    await db.blueCutoff.upsert({ where: { playerId: body.playerId }, create: { playerId: body.playerId, name, reason }, update: { name, reason } });
    return Response.json({ ok: true }, { headers: NO_STORE });
  }
  if (body.action === "restore") {
    await db.blueCutoff.deleteMany({ where: { playerId: body.playerId } });
    return Response.json({ ok: true }, { headers: NO_STORE });
  }
  return fail("Unknown action.", 400);
}
