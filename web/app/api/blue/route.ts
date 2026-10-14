import { getViewerAccess } from "@/lib/access-control";
import { askBlue, blueEnabled } from "@/lib/blue/ask";
import { cleanConversation, refundQuestion, safeErrorDetail, takeQuestion } from "@/lib/blue/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** Ask B-Lue3 a question. Signed-in members and officers only; a weekly allowance each. */
export async function POST(request: Request) {
  // Only the site itself may call this: a page on another origin must not spend the guild's AI budget.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);

  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return fail("Sign in with Discord to talk to B-Lue3.", 401);
  if (!blueEnabled()) return fail("B-Lue3 is on a break. Check back soon.", 503);

  const body = (await request.json().catch(() => null)) as { messages?: unknown } | null;
  const conversation = cleanConversation(body?.messages);
  if (!conversation) return fail("Ask B-Lue3 a question first.", 400);

  const left = await takeQuestion(access.playerId ?? "officer");
  if (left === null) return fail("You've used this week's questions for B-Lue3. Your roster report below is still here, and it resets on Monday.", 429);

  try {
    const { text, sources, webSearch, searchError } = await askBlue({ playerId: access.playerId ?? null, isOfficer: access.isOfficer }, conversation);
    return Response.json({ ok: true, answer: text, sources, webSearch, left, ...(access.isOfficer && searchError ? { searchError } : {}) }, { headers: NO_STORE });
  } catch (error) {
    const detail = safeErrorDetail(error);
    console.error("blue: ask failed", detail);
    await refundQuestion(access.playerId ?? "officer").catch(() => undefined);
    // Officers get the reason so a broken key or model can be fixed; members just get the friendly line.
    return Response.json({ ok: false, error: "B-Lue3 lost the signal. Try again in a minute.", ...(access.isOfficer ? { detail } : {}) }, { status: 502, headers: NO_STORE });
  }
}
