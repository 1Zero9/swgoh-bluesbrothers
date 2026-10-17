import { getViewerAccess } from "@/lib/access-control";
import { createSignInLink } from "@/lib/signin-link-data";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/** An officer makes a one-time sign-in link for a member. The link is shown once; only its hash is stored. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return Response.json({ ok: false, error: "Not allowed." }, { status: 403, headers: NO_STORE });
  const access = await getViewerAccess();
  if (!access.isOfficer) return Response.json({ ok: false, error: "Officers only." }, { status: 403, headers: NO_STORE });
  const body = (await request.json().catch(() => null)) as { playerId?: unknown } | null;
  if (typeof body?.playerId !== "string" || !body.playerId) return Response.json({ ok: false, error: "Pick a member." }, { status: 400, headers: NO_STORE });
  const made = await createSignInLink(body.playerId, access.playerName ?? "An officer");
  if (!made) return Response.json({ ok: false, error: "That member isn't active in the guild." }, { status: 404, headers: NO_STORE });
  return Response.json({ ok: true, name: made.name, url: `${siteUrl()}/signin/${made.token}` }, { headers: NO_STORE });
}
