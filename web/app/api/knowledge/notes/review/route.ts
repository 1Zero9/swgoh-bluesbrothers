import { getViewerAccess } from "@/lib/access-control";
import { isAction } from "@/lib/knowledge/lifecycle";
import { STARTER_AUTHOR } from "@/lib/knowledge/starter-list";
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
  const officer = await getOfficerIdentity();
  // "Publish all starter tips": only the tips an officer brought in as a batch. Tips members wrote are always checked one by one.
  if (body?.action === "PUBLISH_STARTER") {
    const waiting = (await noteReviewQueue()).filter((note) => note.authorName === STARTER_AUTHOR);
    let published = 0;
    for (const note of waiting) {
      const done = await reviewNote(note.id, "PUBLISH", officer ?? access.playerName ?? "An officer", "Published in bulk").catch(() => null);
      if (done?.ok) published += 1;
    }
    return Response.json({ ok: true, published, left: waiting.length - published }, { headers: NO_STORE });
  }
  if (typeof body?.id !== "string" || !isAction(body.action)) return fail("Missing id or action.", 400);
  const result = await reviewNote(body.id, body.action, officer ?? access.playerName ?? "An officer", cleanText(body.note, 300));
  return result.ok ? Response.json({ ok: true, status: result.status }, { headers: NO_STORE }) : fail(result.error, 409);
}
