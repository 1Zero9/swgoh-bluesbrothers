import { getViewerAccess } from "@/lib/access-control";
import { blueEnabled, webSearchOn } from "@/lib/blue/ask";
import { refundQuestion, researchLimit, safeErrorDetail, takeQuestion } from "@/lib/blue/limits";
import { researchCounters } from "@/lib/blue/research";
import { knownUnitIds } from "@/lib/knowledge/data";
import { isMode } from "@/lib/knowledge/modes";
import { canReview } from "@/lib/knowledge/permissions";
import { getOfficerIdentity } from "@/lib/officer-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 150;

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** Officers only: B-Lue3 researches counters for one enemy leader and mode on the web and files them as candidates. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  if (!blueEnabled() || !webSearchOn()) return fail("Web research needs B-Lue3's AI and web search switched on.", 503);

  const body = (await request.json().catch(() => null)) as { mode?: unknown; leaderUnitId?: unknown } | null;
  if (!isMode(body?.mode) || typeof body.leaderUnitId !== "string" || !knownUnitIds.has(body.leaderUnitId)) return fail("Pick a mode and the enemy squad's leader.", 400);
  const mode = body.mode;
  const leaderUnitId = body.leaderUnitId;

  const who = `research:${access.playerId ?? "officer"}`;
  if ((await takeQuestion(who, new Date(), researchLimit())) === null) return fail("That's the research allowance for this week. It resets on Monday.", 429);

  try {
    const officer = (await getOfficerIdentity()) || access.playerName || "an officer";
    const report = await researchCounters({ leaderUnitId, mode, officer, officerId: access.playerId ?? null });
    return Response.json({ ok: true, report }, { headers: NO_STORE });
  } catch (error) {
    const detail = safeErrorDetail(error);
    console.error("knowledge: research failed", detail);
    await refundQuestion(who).catch(() => undefined);
    return Response.json({ ok: false, error: "The research didn't finish.", detail }, { status: 502, headers: NO_STORE });
  }
}
