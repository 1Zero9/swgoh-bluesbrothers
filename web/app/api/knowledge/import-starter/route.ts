import { getViewerAccess } from "@/lib/access-control";
import { STARTER_AUTHOR, starterNotes } from "@/lib/knowledge/starter-list";
import { canReview } from "@/lib/knowledge/permissions";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

async function missing() {
  const held = new Set((await getPrisma().kbNote.findMany({ where: { submittedByName: STARTER_AUTHOR }, select: { title: true } })).map((row) => row.title));
  return starterNotes().filter((note) => !held.has(note.title));
}

/** How many of the 50 starter tips are not in the knowledge base yet. Officers only. */
export async function GET() {
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  return Response.json({ ok: true, waiting: (await missing()).length }, { headers: NO_STORE });
}

/** Bring the starter tips in as candidates for review. Safe to repeat: ones already brought in are skipped. Officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!canReview(access)) return fail("Officers only.", 403);
  const todo = await missing();
  if (!todo.length) return Response.json({ ok: true, imported: 0 }, { headers: NO_STORE });
  await getPrisma().kbNote.createMany({
    data: todo.map((note) => ({ ...note, via: "OFFICER", submittedById: null, submittedByName: STARTER_AUTHOR, status: "CANDIDATE" })),
  });
  return Response.json({ ok: true, imported: todo.length }, { headers: NO_STORE });
}
