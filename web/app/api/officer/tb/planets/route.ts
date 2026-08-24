import { cookies } from "next/headers";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getOfficerIdentity } from "@/lib/officer-identity";
import { deletePlanetPlan, upsertPlanetPlan } from "@/lib/tw-plans";
import type { TbStrategy } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isOfficerSession() {
  const store = await cookies();
  return verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);
}

type PlanetPlanBody = {
  id?: string;
  planId?: string;
  planetName?: string;
  phase?: number;
  strategy?: TbStrategy;
  commandId?: string | null;
  note?: string | null;
  priority?: number;
};

async function upsert(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as PlanetPlanBody | null;
  if (!body?.planId || !body.planetName?.trim()) {
    return Response.json({ ok: false, error: "planId and planetName are required" }, { status: 400 });
  }
  try {
    const officer = await getOfficerIdentity();
    const planetPlan = await upsertPlanetPlan({
      id: body.id,
      planId: body.planId,
      planetName: body.planetName.trim(),
      phase: body.phase,
      strategy: body.strategy,
      commandId: body.commandId,
      note: body.note,
      priority: body.priority,
      updatedBy: officer,
    });
    return Response.json({ ok: true, planetPlan });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return upsert(request);
}

export async function PATCH(request: Request) {
  return upsert(request);
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
    await deletePlanetPlan(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
