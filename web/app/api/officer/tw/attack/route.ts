import { cookies } from "next/headers";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getOfficerIdentity } from "@/lib/officer-identity";
import { deleteAttackAssignment, upsertAttackAssignment } from "@/lib/tw-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isOfficerSession() {
  const store = await cookies();
  return verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);
}

const ATTACK_STATUSES = ["UNASSIGNED", "ASSIGNED", "IN_PROGRESS", "FAILED", "NEEDS_SPECIALIST", "CLEARED", "HOLD"];

export async function POST(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | {
        id?: string;
        planId?: string;
        zoneLabel?: string;
        enemySquad?: string | null;
        assignedPlayerId?: string | null;
        status?: string;
        note?: string | null;
      }
    | null;
  if ((!body?.id && !body?.planId) || (!body?.id && !body?.zoneLabel?.trim())) {
    return Response.json({ ok: false, error: "planId and zoneLabel (or id) are required" }, { status: 400 });
  }
  if (body.status && !ATTACK_STATUSES.includes(body.status)) {
    return Response.json({ ok: false, error: "invalid status" }, { status: 400 });
  }
  try {
    const officer = await getOfficerIdentity();
    const attack = await upsertAttackAssignment({
      id: body.id,
      planId: body.planId as string,
      zoneLabel: (body.zoneLabel ?? "").trim(),
      enemySquad: body.enemySquad,
      assignedPlayerId: body.assignedPlayerId,
      status: body.status as
        | "UNASSIGNED"
        | "ASSIGNED"
        | "IN_PROGRESS"
        | "FAILED"
        | "NEEDS_SPECIALIST"
        | "CLEARED"
        | "HOLD"
        | undefined,
      note: body.note,
      updatedBy: officer,
    });
    return Response.json({ ok: true, attack });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) {
    return Response.json({ ok: false, error: "id is required" }, { status: 400 });
  }
  try {
    await deleteAttackAssignment(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
