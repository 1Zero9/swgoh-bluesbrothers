import { getViewerAccess } from "@/lib/access-control";
import { setUse } from "@/lib/knowledge/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** "This is what I use": mark or unmark a published counter. Signed-in members only, one mark each. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!access.playerId || !(access.isMember || access.isOfficer)) return fail("Sign in with Discord to do that.", 401);
  const body = (await request.json().catch(() => null)) as { matchupId?: unknown; using?: unknown } | null;
  if (typeof body?.matchupId !== "string" || typeof body.using !== "boolean") return fail("Missing counter.", 400);
  const result = await setUse(body.matchupId, access.playerId, body.using);
  return result.ok ? Response.json({ ok: true, count: result.count }, { headers: NO_STORE }) : fail(result.error, 409);
}
