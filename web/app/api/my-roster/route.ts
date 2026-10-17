import { getViewerAccess } from "@/lib/access-control";
import { topUnits } from "@/lib/my-roster";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The signed-in member's strongest units, as quick picks for the add-a-counter form. Their own roster only. */
export async function GET() {
  const access = await getViewerAccess();
  if (!access.playerId || !(access.isMember || access.isOfficer)) return Response.json({ ok: true, units: [] }, { headers: { "Cache-Control": "no-store" } });
  const player = await getPrisma().player.findUnique({ where: { id: access.playerId }, select: { profilePayload: true } });
  return Response.json({ ok: true, units: topUnits(player?.profilePayload) }, { headers: { "Cache-Control": "no-store" } });
}
