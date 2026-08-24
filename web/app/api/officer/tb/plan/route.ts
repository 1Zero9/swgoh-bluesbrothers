import { cookies } from "next/headers";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getOfficerIdentity } from "@/lib/officer-identity";
import { getCurrentTbEventId, getDefaultGuildId, getOrCreateActiveTbPlan, setTbPlanStatus } from "@/lib/tw-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isOfficerSession() {
  const store = await cookies();
  return verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);
}

export async function POST(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  try {
    const guildId = await getDefaultGuildId();
    if (!guildId) return Response.json({ ok: false, error: "no guild on record yet" }, { status: 409 });
    const eventId = await getCurrentTbEventId();
    const officer = await getOfficerIdentity();
    const plan = await getOrCreateActiveTbPlan(guildId, eventId, body?.name?.trim() || "Territory Battle plan", officer);
    return Response.json({ ok: true, planId: plan.id });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | { planId?: string; status?: "DRAFT" | "ACTIVE" | "ARCHIVED" }
    | null;
  if (!body?.planId || !body.status) {
    return Response.json({ ok: false, error: "planId and status are required" }, { status: 400 });
  }
  try {
    await setTbPlanStatus(body.planId, body.status);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
