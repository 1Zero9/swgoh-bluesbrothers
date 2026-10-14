import { getViewerAccess } from "@/lib/access-control";
import { askBlue, blueEnabled } from "@/lib/blue/ask";
import { answerFromDatabase } from "@/lib/blue/db-answer";
import { cleanConversation, getUsage, refundQuestion, safeErrorDetail, takeQuestion } from "@/lib/blue/limits";

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

  const body = (await request.json().catch(() => null)) as { messages?: unknown; webSearch?: unknown } | null;
  const conversation = cleanConversation(body?.messages);
  if (!conversation) return fail("Ask B-Lue3 a question first.", 400);

  // The free step comes first: counter questions and "who has X" are answered from the guild's own database with no AI and no question used.
  // The member can then choose to spend a question on a web search (webSearch: true skips this step).
  if (body?.webSearch !== true) {
    const free = await answerFromDatabase(access.playerId ?? null, conversation[conversation.length - 1].content).catch(() => null);
    if (free) {
      const usage = await getUsage(access.playerId ?? "officer");
      return Response.json({ ok: true, answer: free.text, sources: [], route: "database", needsWebSearch: free.needsWebSearch, offer: free.offer ?? null, left: usage.left }, { headers: NO_STORE });
    }
  }

  const left = await takeQuestion(access.playerId ?? "officer");
  if (left === null) return fail("You've used this week's questions for B-Lue3. Your roster report below is still here, and it resets on Monday.", 429);

  try {
    const { text, sources, webSearch, searchError } = await askBlue({ playerId: access.playerId ?? null, isOfficer: access.isOfficer }, conversation);
    return Response.json({ ok: true, answer: text, sources, webSearch, route: "ai", left, ...(access.isOfficer && searchError ? { searchError } : {}) }, { headers: NO_STORE });
  } catch (error) {
    const detail = safeErrorDetail(error);
    console.error("blue: ask failed", detail);
    await refundQuestion(access.playerId ?? "officer").catch(() => undefined);
    // Officers get the reason so a broken key or model can be fixed; members just get the friendly line.
    return Response.json({ ok: false, error: "B-Lue3 lost the signal. Try again in a minute.", ...(access.isOfficer ? { detail } : {}) }, { status: 502, headers: NO_STORE });
  }
}
