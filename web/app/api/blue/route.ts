import { getViewerAccess } from "@/lib/access-control";
import { askBlue, blueEnabled } from "@/lib/blue/ask";
import { answerFromDatabase } from "@/lib/blue/db-answer";
import { checkQuestion, isModelRefusal, REFUSAL_MESSAGE } from "@/lib/blue/guard";
import { isCutOff, logQuestion } from "@/lib/blue/log";
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

  const latest = conversation[conversation.length - 1].content;
  const who = access.playerId ?? null;
  const name = access.playerName ?? (access.isOfficer && !who ? "Officer (shared password)" : "Member");

  // Cut off by the site admin: nothing is answered and nothing is spent.
  if (await isCutOff(who)) {
    void logQuestion({ playerId: who, playerName: name, question: latest, route: "blocked", verdict: "BLOCKED", reason: "member is cut off" });
    return fail("B-Lue3 has been switched off for your account. Speak to the guild leader.", 403);
  }

  // The free guardrail: obvious misuse is refused before anything is spent, and recorded.
  const guard = checkQuestion(latest);
  if (!guard.ok) {
    void logQuestion({ playerId: who, playerName: name, question: latest, route: "blocked", verdict: "BLOCKED", reason: guard.reason });
    return Response.json({ ok: true, answer: REFUSAL_MESSAGE, sources: [], route: "blocked", left: (await getUsage(access.playerId ?? "officer")).left }, { headers: NO_STORE });
  }

  // The free step comes first: counter questions and "who has X" are answered from the guild's own database with no AI and no question used.
  // The member can then choose to spend a question on a web search (webSearch: true skips this step).
  if (body?.webSearch !== true) {
    const free = await answerFromDatabase(access.playerId ?? null, conversation[conversation.length - 1].content).catch(() => null);
    if (free) {
      const usage = await getUsage(access.playerId ?? "officer");
      void logQuestion({ playerId: who, playerName: name, question: latest, route: "database", answer: free.text });
      return Response.json({ ok: true, answer: free.text, sources: [], route: "database", needsWebSearch: free.needsWebSearch, offer: free.offer ?? null, left: usage.left }, { headers: NO_STORE });
    }
  }

  const left = await takeQuestion(access.playerId ?? "officer");
  if (left === null) return fail("You've used this week's questions for B-Lue3. Your roster report below is still here, and it resets on Monday.", 429);

  try {
    const { text, sources, webSearch, searchError } = await askBlue({ playerId: access.playerId ?? null, isOfficer: access.isOfficer }, conversation, { webSearch: body?.webSearch === true });
    if (isModelRefusal(text)) {
      // The model judged it off-topic: give the question back and record it as a strike.
      await refundQuestion(access.playerId ?? "officer").catch(() => undefined);
      void logQuestion({ playerId: who, playerName: name, question: latest, route: "blocked", verdict: "BLOCKED", reason: "judged off-topic by B-Lue3" });
      return Response.json({ ok: true, answer: REFUSAL_MESSAGE, sources: [], route: "blocked", left: left + 1 }, { headers: NO_STORE });
    }
    void logQuestion({ playerId: who, playerName: name, question: latest, route: "ai", answer: text });
    return Response.json({ ok: true, answer: text, sources, webSearch, route: "ai", left, ...(access.isOfficer && searchError ? { searchError } : {}) }, { headers: NO_STORE });
  } catch (error) {
    const detail = safeErrorDetail(error);
    console.error("blue: ask failed", detail);
    await refundQuestion(access.playerId ?? "officer").catch(() => undefined);
    // Officers get the reason so a broken key or model can be fixed; members just get the friendly line.
    return Response.json({ ok: false, error: "B-Lue3 lost the signal. Try again in a minute.", ...(access.isOfficer ? { detail } : {}) }, { status: 502, headers: NO_STORE });
  }
}
