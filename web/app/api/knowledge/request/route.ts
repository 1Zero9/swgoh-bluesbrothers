import { getViewerAccess } from "@/lib/access-control";
import { countRecentRequests, createRequest, knownUnitIds, openRequests } from "@/lib/knowledge/data";
import { REQUESTS_PER_DAY, validateRequest } from "@/lib/knowledge/requests";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** Open calls for help. Members and officers only. */
export async function GET() {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return fail("Members only.", 401);
  return Response.json({ ok: true, requests: await openRequests(access.playerId ?? null) }, { headers: NO_STORE });
}

/** Ask the guild for a counter. Posts to the counters Discord channel when one is set up. Signed-in members only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!access.playerId || !(access.isMember || access.isOfficer)) return fail("Sign in with Discord to ask for help.", 401);

  const checked = validateRequest(await request.json().catch(() => null), knownUnitIds);
  if (!checked.ok) return fail(checked.error, 400);
  if ((await countRecentRequests(access.playerId)) >= REQUESTS_PER_DAY) return fail("You've asked a few times today already. Try again tomorrow.", 429);

  const player = await getPrisma().player.findUnique({ where: { id: access.playerId }, select: { currentName: true } });
  const result = await createRequest(checked.value, { id: access.playerId, name: player?.currentName ?? "A member" });
  return Response.json({ ok: true, ...result }, { headers: NO_STORE });
}
