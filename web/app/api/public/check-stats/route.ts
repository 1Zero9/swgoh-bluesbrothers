import { fetchPlayerProfileByAllyCode, profileGalacticPower, sanitizeAllyCode, summarizePlayerProfile } from "@/lib/comlink";
import { evaluateRequirements } from "@/lib/requirements";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

// Best-effort per-instance limiter: enough to stop one visitor hammering the game-data bridge.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) for (const [k, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ ok: false, error: "Easy there — try again in a minute." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { allyCode?: string } | null;
  const allyCode = sanitizeAllyCode(body?.allyCode ?? "");
  if (!allyCode) {
    return Response.json({ ok: false, error: "That doesn't look like a 9-digit ally code." }, { status: 400 });
  }

  try {
    const profile = await fetchPlayerProfileByAllyCode(allyCode);
    if (!profile) return Response.json({ ok: false, error: "We couldn't find that ally code." }, { status: 404 });

    const summary = summarizePlayerProfile(profile);
    const galacticPower = profileGalacticPower(profile);
    // Headline figures only: no roster, no ally code echoed back.
    return Response.json({
      ok: true,
      name: String(profile.name ?? "Player"),
      galacticPower,
      galacticLegends: summary.galacticLegends,
      ...evaluateRequirements({ galacticPower, galacticLegends: summary.galacticLegends }),
    });
  } catch {
    return Response.json({ ok: false, error: "Couldn't reach the game data just now. Try again shortly." }, { status: 502 });
  }
}
