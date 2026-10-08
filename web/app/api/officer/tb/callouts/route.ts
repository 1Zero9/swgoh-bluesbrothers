import { cookies } from "next/headers";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getOfficerIdentity } from "@/lib/officer-identity";
import { getPrisma } from "@/lib/prisma";
import { getDefaultGuildId } from "@/lib/tw-plans";
import { getCalloutUnitOptions, listCallouts, postCalloutToDiscord } from "@/lib/tb-callouts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isOfficerSession() {
  const store = await cookies();
  return verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);
}

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function boundedInt(value: unknown, min: number, max: number, fallback: number | null) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

type CreateBody = {
  unitId?: string;
  minStars?: number;
  minRelic?: number;
  needed?: number | null;
  phase?: number | null;
  planetName?: string | null;
  note?: string | null;
  postToDiscord?: boolean;
};

export async function POST(request: Request) {
  if (!(await isOfficerSession())) return fail("unauthorized", 401);
  const body = (await request.json().catch(() => null)) as CreateBody | null;
  const unitId = body?.unitId?.trim();
  if (!unitId) return fail("pick a unit", 400);

  const options = await getCalloutUnitOptions();
  const unit = options.find((option) => option.id === unitId);
  if (!unit) return fail("unknown unit", 400);

  try {
    const guildId = await getDefaultGuildId();
    if (!guildId) return fail("no guild on record", 400);
    const created = await getPrisma().tbCallout.create({
      data: {
        guildId,
        unitId: unit.id,
        unitName: unit.name,
        minStars: boundedInt(body?.minStars, 1, 7, 7) ?? 7,
        minRelic: boundedInt(body?.minRelic, 0, 9, 0) ?? 0,
        needed: boundedInt(body?.needed, 1, 50, null),
        phase: boundedInt(body?.phase, 1, 6, null),
        planetName: body?.planetName?.trim().slice(0, 80) || null,
        note: body?.note?.trim().slice(0, 400) || null,
        createdBy: await getOfficerIdentity(),
      },
    });

    let posted = false;
    if (body?.postToDiscord) {
      const callout = (await listCallouts()).find((item) => item.id === created.id);
      if (callout) posted = await postCalloutToDiscord(callout).catch(() => false);
    }
    return Response.json({ ok: true, id: created.id, posted });
  } catch (error) {
    console.error("create callout failed", error);
    return fail("could not create callout", 500);
  }
}

export async function PATCH(request: Request) {
  if (!(await isOfficerSession())) return fail("unauthorized", 401);
  const body = (await request.json().catch(() => null)) as { id?: string; status?: string } | null;
  if (!body?.id || (body.status !== "OPEN" && body.status !== "CLOSED")) return fail("id and status required", 400);
  try {
    await getPrisma().tbCallout.update({
      where: { id: body.id },
      data: { status: body.status, closedAt: body.status === "CLOSED" ? new Date() : null },
    });
    return Response.json({ ok: true });
  } catch {
    return fail("could not update callout", 500);
  }
}

export async function DELETE(request: Request) {
  if (!(await isOfficerSession())) return fail("unauthorized", 401);
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return fail("id required", 400);
  try {
    await getPrisma().tbCallout.delete({ where: { id: body.id } });
    return Response.json({ ok: true });
  } catch {
    return fail("could not delete callout", 500);
  }
}
