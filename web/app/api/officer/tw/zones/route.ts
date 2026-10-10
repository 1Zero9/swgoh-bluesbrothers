import { isOfficerRequest } from "@/lib/officer-session";
import { getOfficerIdentity } from "@/lib/officer-identity";
import { upsertZonePlan } from "@/lib/tw-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isOfficerSession() {
  return isOfficerRequest();
}

export async function PATCH(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | {
        planId?: string;
        zoneId?: number;
        purpose?: string | null;
        targetCapacity?: number;
        note?: string | null;
        commandId?: string | null;
      }
    | null;
  if (!body?.planId || typeof body.zoneId !== "number") {
    return Response.json({ ok: false, error: "planId and zoneId are required" }, { status: 400 });
  }
  try {
    const officer = await getOfficerIdentity();
    const zone = await upsertZonePlan(
      body.planId,
      body.zoneId,
      {
        purpose: body.purpose,
        targetCapacity: body.targetCapacity,
        note: body.note,
        commandId: body.commandId,
      },
      officer
    );
    return Response.json({ ok: true, zone });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
