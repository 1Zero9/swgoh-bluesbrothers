import { getViewerAccess } from "@/lib/access-control";
import { POSTS_PER_DAY, validateFeedback, validateUpdate } from "@/lib/feedback";
import { addFeedback, deleteFeedback, listFeedback, postedToday, setVote, updateFeedback } from "@/lib/feedback-data";
import { getOfficerIdentity } from "@/lib/officer-identity";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });
const sameOrigin = (request: Request) => { const origin = request.headers.get("origin"); return !origin || new URL(origin).host === request.headers.get("host"); };

/** The whole board. Members and officers. */
export async function GET() {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return fail("Members only.", 401);
  return Response.json({ ok: true, items: await listFeedback(access.playerId ?? null) }, { headers: NO_STORE });
}

/**
 * POST { kind, title, body } adds an item (members and officers).
 * POST { id, vote: true|false } votes "me too".
 * POST { id, status?, reply? } is an officer edit.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return fail("Sign in with Discord first.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (typeof body?.id === "string" && typeof body.vote === "boolean") {
    if (!access.playerId) return fail("Link your game account to vote.", 401);
    const result = await setVote(body.id, access.playerId, body.vote);
    return result.ok ? Response.json({ ok: true, votes: result.votes }, { headers: NO_STORE }) : fail(result.error, 404);
  }

  if (typeof body?.id === "string") {
    if (!access.isOfficer) return fail("Only officers can change the status.", 403);
    const checked = validateUpdate(body);
    if (!checked.ok) return fail(checked.error, 400);
    const result = await updateFeedback(body.id, checked.value, await getOfficerIdentity());
    return result.ok ? Response.json({ ok: true }, { headers: NO_STORE }) : fail(result.error, 404);
  }

  const checked = validateFeedback(body);
  if (!checked.ok) return fail(checked.error, 400);
  if (!access.playerId) return fail("Link your game account to post.", 401);
  if (await postedToday(access.playerId)) return fail(`That's ${POSTS_PER_DAY} posts today. Try again tomorrow.`, 429);
  const player = await getPrisma().player.findUnique({ where: { id: access.playerId }, select: { currentName: true } });
  await addFeedback(checked.value, { id: access.playerId, name: player?.currentName ?? access.playerName ?? "A member" });
  return Response.json({ ok: true }, { headers: NO_STORE });
}

/** Remove an item. Officers, or the member who posted it while nobody has acted on it. */
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return fail("Sign in with Discord first.", 401);
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string") return fail("Missing item.", 400);
  if (!access.isOfficer) {
    const row = await getPrisma().feedbackItem.findUnique({ where: { id: body.id }, select: { submittedById: true, status: true } });
    if (!row || row.submittedById !== access.playerId || row.status !== "OPEN") return fail("Only officers can remove that.", 403);
  }
  await deleteFeedback(body.id);
  return Response.json({ ok: true }, { headers: NO_STORE });
}
