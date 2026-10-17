import { getViewerAccess } from "@/lib/access-control";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/** Mark a "Help me, Obi-Wan" request as dealt with. Officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return Response.json({ ok: false }, { status: 403, headers: NO_STORE });
  const access = await getViewerAccess();
  if (!access.isOfficer) return Response.json({ ok: false, error: "Officers only." }, { status: 403, headers: NO_STORE });
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string") return Response.json({ ok: false }, { status: 400, headers: NO_STORE });
  await getPrisma().signInHelp.updateMany({ where: { id: body.id, status: "OPEN" }, data: { status: "DONE", doneBy: (access.playerName ?? "An officer").slice(0, 80), doneAt: new Date() } });
  return Response.json({ ok: true }, { headers: NO_STORE });
}
