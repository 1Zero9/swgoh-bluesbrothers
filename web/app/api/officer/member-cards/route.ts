import { getViewerAccess } from "@/lib/access-control";
import { getStoredCard, refreshAllCards } from "@/lib/player-card";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** Rebuild one member's card ({ id }) or every card ({}) from live data and store it. Officers only. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const access = await getViewerAccess();
  if (!access.isOfficer) return fail("Officers only.", 403);
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  try {
    if (typeof body?.id === "string") {
      const stored = await getStoredCard(body.id, true);
      return stored ? Response.json({ ok: true, count: 1 }, { headers: NO_STORE }) : fail("That member is not on the roster.", 404);
    }
    return Response.json({ ok: true, count: await refreshAllCards() }, { headers: NO_STORE });
  } catch {
    return fail("Could not refresh just now. Try again in a minute.", 500);
  }
}
