import { getViewerAccess } from "@/lib/access-control";
import { coverage, getMatchupDetail, reviewMatchup, reviewQueue } from "@/lib/knowledge/data";
import { isAction } from "@/lib/knowledge/lifecycle";
import { canReview } from "@/lib/knowledge/permissions";
import { cleanText } from "@/lib/knowledge/validate";
import { getOfficerIdentity } from "@/lib/officer-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** The review queue, coverage and (with `?id=`) one counter in full. Officers only. */
export async function GET(request: Request) {
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const detail = await getMatchupDetail(id);
    return detail ? Response.json({ ok: true, detail }, { headers: NO_STORE }) : fail("Not found.", 404);
  }
  const [queue, summary] = await Promise.all([reviewQueue(), coverage()]);
  return Response.json({ ok: true, queue, coverage: summary }, { headers: NO_STORE });
}

/** A reviewer's decision: PUBLISH, REJECT, DISPUTE, OUTDATE or RESTORE. Officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  const body = (await request.json().catch(() => null)) as { id?: unknown; action?: unknown; note?: unknown } | null;
  if (typeof body?.id !== "string" || !isAction(body.action)) return fail("Missing id or action.", 400);
  const officer = await getOfficerIdentity();
  const result = await reviewMatchup(body.id, body.action, officer ?? access.playerName ?? "An officer", cleanText(body.note, 300));
  return result.ok ? Response.json({ ok: true, status: result.status }, { headers: NO_STORE }) : fail(result.error, 409);
}
