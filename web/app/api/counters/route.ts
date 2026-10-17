import { getViewerAccess } from "@/lib/access-control";
import { validateCounter } from "@/lib/counters";
import { listCounters } from "@/lib/counters-data";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** Counters for an enemy leader (`?enemy=ID`) or the newest ones. Members only. */
export async function GET(request: Request) {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return fail("Members only.", 401);
  const enemyId = new URL(request.url).searchParams.get("enemy");
  const listed = await listCounters({ enemyId, youPlayerId: access.playerId ?? null });
  // A saved squad whose copy in the knowledge base has been published is shown there, not twice.
  const published = new Set((await getPrisma().kbEvidence.findMany({ where: { sourceRef: { startsWith: "saved:" }, matchup: { status: "PUBLISHED" } }, select: { sourceRef: true } }).catch(() => [])).map((row) => String(row.sourceRef).split(":")[1]));
  const counters = listed.filter((counter) => !published.has(counter.id));
  return Response.json({ ok: true, counters, canAdd: access.isMember && Boolean(access.playerId), isOfficer: access.isOfficer }, { headers: NO_STORE });
}

/** Add a counter. Signed-in members only; at most 20 a day each. */
export async function POST(request: Request) {
  const access = await getViewerAccess();
  if (!access.isMember || !access.playerId) return fail("Sign in with Discord to add a counter.", 401);

  const checked = validateCounter(await request.json().catch(() => null));
  if (!checked.ok) return fail(checked.error, 400);

  const prisma = getPrisma();
  const today = await prisma.counter.count({ where: { createdById: access.playerId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
  if (today >= 20) return fail("That's plenty for one day. Try again tomorrow.", 429);

  const player = await prisma.player.findUnique({ where: { id: access.playerId }, select: { currentName: true } });
  const created = await prisma.counter.create({
    data: { ...checked.counter, squad: checked.counter.squad, createdById: access.playerId, createdByName: player?.currentName ?? "A member" },
    select: { id: true },
  });
  return Response.json({ ok: true, id: created.id }, { headers: NO_STORE });
}

/** Remove a counter: its author, or an officer. */
export async function DELETE(request: Request) {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return fail("Members only.", 401);
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string") return fail("Missing id.", 400);

  const prisma = getPrisma();
  const counter = await prisma.counter.findUnique({ where: { id: body.id }, select: { createdById: true } });
  if (!counter) return fail("That counter is already gone.", 404);
  const allowed = access.isOfficer || (access.playerId && counter.createdById === access.playerId);
  if (!allowed) return fail("Only its author or an officer can remove it.", 403);

  await prisma.counter.delete({ where: { id: body.id } });
  return Response.json({ ok: true }, { headers: NO_STORE });
}
