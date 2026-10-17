import { getViewerAccess } from "@/lib/access-control";
import { savedImportKey, savedToSubmissions, type SavedCounterRow } from "@/lib/knowledge/import-saved";
import { submitMatchup } from "@/lib/knowledge/data";
import { canReview } from "@/lib/knowledge/permissions";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

async function pending() {
  const db = getPrisma();
  const [saved, imported] = await Promise.all([
    db.counter.findMany({ orderBy: { createdAt: "asc" } }),
    db.kbEvidence.findMany({ where: { sourceRef: { startsWith: "saved:" } }, select: { sourceRef: true } }),
  ]);
  const done = new Set(imported.map((row) => row.sourceRef));
  return saved.filter((row) => !done.has(savedImportKey(row.id)));
}

/** How many Saved squads are still waiting to be brought into the counter knowledge base. Officers only. */
export async function GET() {
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  return Response.json({ ok: true, waiting: (await pending()).length }, { headers: NO_STORE });
}

/** Bring the Saved squads in as candidates for review (each keeps its author). Safe to run again: nothing is duplicated. Officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  let imported = 0;
  let skipped = 0;
  for (const row of await pending()) {
    const squad = (Array.isArray(row.squad) ? row.squad : []) as SavedCounterRow["squad"];
    if (!squad.length) { skipped += 1; continue; }
    for (const item of savedToSubmissions({ ...row, squad })) {
      try {
        await submitMatchup(item.input, { via: "IMPORT", who: row.createdByName, whoId: row.createdById, importKey: item.importKey });
        imported += 1;
      } catch (error) {
        skipped += 1;
        console.error("import-saved: skipped", row.id, error instanceof Error ? error.message : "unknown");
      }
    }
  }
  return Response.json({ ok: true, imported, skipped }, { headers: NO_STORE });
}
