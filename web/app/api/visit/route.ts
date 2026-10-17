import { getViewerAccess } from "@/lib/access-control";
import { getPrisma } from "@/lib/prisma";
import { deviceFrom, geoFrom } from "@/lib/visits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A signed-in member's browser says "I'm here" (at most every half hour). We keep the place (city level), device and first page. No IP address. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return new Response(null, { status: 403 });
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer) || !access.playerId) return new Response(null, { status: 204 });
  const body = (await request.json().catch(() => null)) as { path?: unknown } | null;
  const path = typeof body?.path === "string" && body.path.startsWith("/") ? body.path.split("?")[0].slice(0, 120) : null;
  try {
    await getPrisma().memberVisit.create({ data: { playerId: access.playerId, playerName: (access.playerName ?? "Member").slice(0, 80), ...geoFrom(request.headers), device: deviceFrom(request.headers.get("user-agent")), path } });
  } catch (error) {
    console.error("visit: not recorded", error instanceof Error ? error.message : "unknown");
  }
  return new Response(null, { status: 204 });
}
