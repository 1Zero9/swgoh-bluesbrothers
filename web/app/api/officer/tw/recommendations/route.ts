import { cookies } from "next/headers";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { applyRecommendations } from "@/lib/tw-plans";
import { SQUAD_KEYS, type SquadKey } from "@/lib/tw-squads";
import type { Recommendation } from "@/lib/tw-planning-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isOfficerSession() {
  const store = await cookies();
  return verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);
}

function isSquadKey(value: unknown): value is SquadKey {
  return typeof value === "string" && (SQUAD_KEYS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | { planId?: string; recommendations?: Recommendation[] }
    | null;
  if (!body?.planId || !Array.isArray(body.recommendations)) {
    return Response.json({ ok: false, error: "planId and recommendations are required" }, { status: 400 });
  }
  const valid = body.recommendations.every(
    (r) =>
      typeof r?.zoneId === "number" &&
      typeof r?.playerId === "string" &&
      isSquadKey(r?.squadKey) &&
      typeof r?.priority === "number"
  );
  if (!valid) {
    return Response.json({ ok: false, error: "malformed recommendations" }, { status: 400 });
  }
  try {
    const result = await applyRecommendations(body.planId, body.recommendations);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
