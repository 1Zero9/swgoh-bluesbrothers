import { getViewerAccess } from "@/lib/access-control";
import { setHelpful } from "@/lib/knowledge/notes-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** "This helped me": mark or unmark a published note. Signed-in members only, one mark each. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!access.playerId || !(access.isMember || access.isOfficer)) return fail("Sign in with Discord to do that.", 401);
  const body = (await request.json().catch(() => null)) as { noteId?: unknown; helpful?: unknown } | null;
  if (typeof body?.noteId !== "string" || typeof body.helpful !== "boolean") return fail("Missing note.", 400);
  const result = await setHelpful(body.noteId, access.playerId, body.helpful);
  return result.ok ? Response.json({ ok: true, count: result.count }, { headers: NO_STORE }) : fail(result.error, 409);
}
