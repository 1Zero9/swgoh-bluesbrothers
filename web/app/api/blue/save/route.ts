import { getViewerAccess } from "@/lib/access-control";
import { blueEnabled } from "@/lib/blue/ask";
import { safeErrorDetail } from "@/lib/blue/limits";
import { saveAnswerCounters } from "@/lib/blue/research";
import type { AnswerSource } from "@/lib/blue/sources";
import { countRecentSubmissions } from "@/lib/knowledge/data";
import { canSubmit } from "@/lib/knowledge/permissions";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };
const DAILY_SUBMISSIONS = 15;
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

function cleanSources(value: unknown): AnswerSource[] {
  if (!Array.isArray(value)) return [];
  const out: AnswerSource[] = [];
  for (const item of value.slice(0, 12)) {
    const raw = item as { url?: unknown; title?: unknown };
    if (typeof raw?.url !== "string") continue;
    try {
      const url = new URL(raw.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      out.push({ url: url.toString().slice(0, 500), host: url.hostname, title: (typeof raw.title === "string" ? raw.title : url.hostname).replace(/[\u0000-\u001f]/g, " ").slice(0, 120) });
    } catch { /* skip a bad link */ }
  }
  return out;
}

/** "Add these to the guild list": turn a web-search answer into candidate counters for an officer to review. Members and officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!canSubmit(access)) return fail("Sign in with Discord to add counters.", 401);
  if (!blueEnabled()) return fail("B-Lue3's AI is switched off, so this can't be saved right now.", 503);
  const body = (await request.json().catch(() => null)) as { question?: unknown; answer?: unknown; sources?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.slice(0, 500) : "";
  const answer = typeof body?.answer === "string" ? body.answer.slice(0, 6000) : "";
  const sources = cleanSources(body?.sources);
  if (!answer.trim()) return fail("There is nothing to save.", 400);
  if (!sources.length) return fail("Only answers that came with web pages can be saved, because every counter needs its source.", 400);
  const whoId = access.playerId ?? null;
  if (whoId && (await countRecentSubmissions(whoId)) >= DAILY_SUBMISSIONS) return fail("That's plenty for one day. Try again tomorrow.", 429);
  const name = whoId ? (await getPrisma().player.findUnique({ where: { id: whoId }, select: { currentName: true } }))?.currentName ?? "a member" : access.playerName ?? "an officer";
  try {
    const report = await saveAnswerCounters({ question, answer, sources, defaultMode: "TW", who: name, whoId });
    return Response.json({ ok: true, report }, { headers: NO_STORE });
  } catch (error) {
    console.error("blue: save answer failed", safeErrorDetail(error));
    return fail("That didn't save. Try again in a minute.", 502);
  }
}
