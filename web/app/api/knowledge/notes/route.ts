import { getViewerAccess } from "@/lib/access-control";
import { isNoteKind, validateNote } from "@/lib/knowledge/notes";
import { countRecentNotes, listNotes, submitNote } from "@/lib/knowledge/notes-data";
import { canSubmit } from "@/lib/knowledge/permissions";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });
const DAILY_NOTES = 10;

/** Published tips and ideas (plus your own waiting ones). `?kind=TIP|IDEA`, `?q=` text. Members and officers only. */
export async function GET(request: Request) {
  const access = await getViewerAccess();
  if (!canSubmit(access)) return fail("Members only.", 401);
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  if (kind && !isNoteKind(kind)) return fail("Unknown kind.", 400);
  const notes = await listNotes({ kind: kind ?? undefined, text: params.get("q")?.slice(0, 80) || undefined }, access.playerId ?? null);
  return Response.json({ ok: true, notes }, { headers: NO_STORE });
}

/** Add a tip or an idea. It always lands as a candidate for an officer to check. Members and officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!canSubmit(access)) return fail("Sign in with Discord to add something.", 401);
  const whoId = access.playerId ?? null;

  const checked = validateNote(await request.json().catch(() => null));
  if (!checked.ok) return fail(checked.error, 400);
  if (whoId && (await countRecentNotes(whoId)) >= DAILY_NOTES) return fail("That's plenty for one day. Try again tomorrow.", 429);

  const name = whoId ? (await getPrisma().player.findUnique({ where: { id: whoId }, select: { currentName: true } }))?.currentName ?? "A member" : "An officer";
  const result = await submitNote(checked.value, { via: access.isOfficer ? "OFFICER" : "MEMBER", who: name, whoId });
  return Response.json({ ok: true, ...result }, { headers: NO_STORE });
}
