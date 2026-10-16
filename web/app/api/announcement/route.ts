import { getViewerAccess } from "@/lib/access-control";
import { checkAnnouncement } from "@/lib/announcement";
import { getAnnouncement, saveAnnouncement } from "@/lib/announcement-data";
import { getOfficerIdentity } from "@/lib/officer-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** The announcement as saved. Officers only (members get it with the Home page). */
export async function GET() {
  const access = await getViewerAccess();
  if (!access.isOfficer) return fail("Officers only.", 403);
  return Response.json({ ok: true, announcement: await getAnnouncement() }, { headers: NO_STORE });
}

/** Save the announcement. Officers only. Every save shows it again to everyone. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!access.isOfficer) return fail("Officers only.", 403);
  const checked = checkAnnouncement(await request.json().catch(() => null));
  if (!checked.ok) return fail(checked.error, 400);
  const officer = (await getOfficerIdentity()) ?? access.playerName ?? "An officer";
  return Response.json({ ok: true, announcement: await saveAnnouncement(checked.value, officer) }, { headers: NO_STORE });
}
