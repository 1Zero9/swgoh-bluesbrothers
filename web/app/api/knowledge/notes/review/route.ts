import { getViewerAccess } from "@/lib/access-control";
import { isAction } from "@/lib/knowledge/lifecycle";
import { noteReviewQueue, reviewNote } from "@/lib/knowledge/notes-data";
import { canReview } from "@/lib/knowledge/permissions";
import { cleanText } from "@/lib/knowledge/validate";
import { getOfficerIdentity } from "@/lib/officer-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** Tips and ideas waiting for a check. Officers only. */
export async function GET() {
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  return Response.json({ ok: true, queue: await noteReviewQueue() }, { headers: NO_STORE });
}

/** An officer's decision on a note: PUBLISH, REJECT, OUTDATE or RESTORE. Officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  const body = (await request.json().catch(() => null)) as { id?: unknown; action?: unknown; note?: unknown } | null;
  if (typeof body?.id !== "string" || !isAction(body.action)) return fail("Missing id or action.", 400);
  const officer = await getOfficerIdentity();
  const result = await reviewNote(body.id, body.action, officer ?? access.playerName ?? "An officer", cleanText(body.note, 300));
  return result.ok ? Response.json({ ok: true, status: result.status }, { headers: NO_STORE }) : fail(result.error, 409);
}
