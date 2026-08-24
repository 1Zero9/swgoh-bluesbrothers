import { cookies } from "next/headers";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getOfficerIdentity } from "@/lib/officer-identity";
import { createAssignment, deleteAssignment, updateAssignment } from "@/lib/tw-plans";
import { SQUAD_KEYS, type SquadKey } from "@/lib/tw-squads";

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
    | { planId?: string; zoneId?: number; playerId?: string; squadKey?: string; officerNote?: string }
    | null;
  if (!body?.planId || typeof body.zoneId !== "number" || !body.playerId || !isSquadKey(body.squadKey)) {
    return Response.json({ ok: false, error: "planId, zoneId, playerId and a valid squadKey are required" }, { status: 400 });
  }
  try {
    const officer = await getOfficerIdentity();
    const assignment = await createAssignment({
      planId: body.planId,
      zoneId: body.zoneId,
      playerId: body.playerId,
      squadKey: body.squadKey,
      officerNote: body.officerNote,
      status: "PLACED",
      source: "MANUAL",
      locked: true,
      createdBy: officer,
    });
    return Response.json({ ok: true, assignment });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as
    | {
        id?: string;
        status?: "SUGGESTED" | "ASSIGNED" | "ACKNOWLEDGED" | "PLACED" | "CHANGED" | "MISSING" | "EXEMPT";
        officerNote?: string | null;
        locked?: boolean;
        squadKey?: string;
        zoneId?: number;
        planId?: string;
      }
    | null;
  if (!body?.id) {
    return Response.json({ ok: false, error: "id is required" }, { status: 400 });
  }
  if (body.squadKey !== undefined && !isSquadKey(body.squadKey)) {
    return Response.json({ ok: false, error: "invalid squadKey" }, { status: 400 });
  }
  try {
    const officer = await getOfficerIdentity();
    const assignment = await updateAssignment(body.id, {
      status: body.status,
      officerNote: body.officerNote,
      locked: body.locked,
      squadKey: body.squadKey as SquadKey | undefined,
      zoneId: body.zoneId,
      planId: body.planId,
      updatedBy: officer,
    });
    return Response.json({ ok: true, assignment });
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
    await deleteAssignment(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
