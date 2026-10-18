import { after } from "next/server";
import { getViewerAccess } from "@/lib/access-control";
import { countRecentSubmissions, findMatchups, getMatchupDetail, knownUnitIds, submitMatchup, unitLabel, linkSuggestion } from "@/lib/knowledge/data";
import { readinessFor } from "@/lib/knowledge/readiness";
import { isMode, MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import { canSubmit } from "@/lib/knowledge/permissions";
import { validateSubmission } from "@/lib/knowledge/validate";
import { logSearch } from "@/lib/blue/log";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });
const DAILY_SUBMISSIONS = 15;

/** Search published counters. Members and officers only. `?q=` text, `?mode=`, `?unit=` a defending unit id. */
export async function GET(request: Request) {
  const access = await getViewerAccess();
  if (!canSubmit(access)) return fail("Members only.", 401);
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  if (id) {
    // One counter with its evidence. Members only see published ones; officers can open any.
    const detail = await getMatchupDetail(id);
    if (!detail || (detail.status !== "PUBLISHED" && !access.isOfficer)) return fail("Not found.", 404);
    return Response.json({ ok: true, detail: access.isOfficer ? detail : { ...detail, events: [], submittedByName: "" } }, { headers: NO_STORE });
  }
  const mode = params.get("mode");
  if (mode && !isMode(mode)) return fail("Unknown mode.", 400);
  const hits = await findMatchups({
    text: params.get("q")?.slice(0, 80) || undefined,
    mode: mode && isMode(mode) ? mode : undefined,
    defenderUnitId: params.get("unit") || undefined,
  }, access.playerId ?? null);
  const shown = hits.slice(0, 60);
  const unit = params.get("unit");
  if (unit && params.get("log") === "1" && access.playerId) {
    const who = access.playerId;
    const label = `${unitLabel(unit)}${mode ? ` · ${MODE_LABELS[mode as KbMode]}` : ""}`;
    after(async () => {
      const name = (await getPrisma().player.findUnique({ where: { id: who }, select: { currentName: true } }))?.currentName ?? "A member";
      await logSearch({ playerId: who, playerName: name, term: label, found: shown.length > 0 });
    });
  }
  const readiness = await readinessFor(shown, access.playerId ?? null).catch(() => ({}));
  return Response.json({ ok: true, hits: shown.map((hit) => ({ ...hit, readiness: (readiness as Record<string, unknown>)[hit.id] ?? null })) }, { headers: NO_STORE });
}

/** Submit a counter. It always lands as a candidate for officer review. Members and officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!canSubmit(access)) return fail("Sign in with Discord to add a counter.", 401);
  const whoId = access.playerId ?? null;

  const body = await request.json().catch(() => null);
  const checked = validateSubmission(body, access.isOfficer ? "OFFICER" : "MEMBER", knownUnitIds);
  if (!checked.ok) return fail(checked.error, 400);
  if (whoId && (await countRecentSubmissions(whoId)) >= DAILY_SUBMISSIONS) return fail("That's plenty for one day. Try again tomorrow.", 429);

  const name = whoId ? (await getPrisma().player.findUnique({ where: { id: whoId }, select: { currentName: true } }))?.currentName ?? "A member" : "An officer";
  const result = await submitMatchup(checked.value, { via: access.isOfficer ? "OFFICER" : "MEMBER", who: name, whoId });
  // "I have a better counter" / "swap X for Y": remember which counter it is about.
  const raw = (body ?? {}) as { improves?: unknown; suggestion?: unknown };
  if (result.created && typeof raw.improves === "string" && raw.improves.length < 60) await linkSuggestion(result.id, raw.improves, raw.suggestion === "SWAP" ? "SWAP" : "BETTER", name).catch(() => false);
  return Response.json({ ok: true, ...result }, { headers: NO_STORE });
}
