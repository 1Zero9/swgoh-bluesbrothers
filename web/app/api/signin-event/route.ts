import { after } from "next/server";
import { CLIENT_KINDS, type SignInKind } from "@/lib/signin-events";
import { recordSignIn } from "@/lib/signin-events-data";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The sign-in panel tells us it stalled or was cancelled. Anonymous, kind only, and quietly capped so it can't be flooded. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return new Response(null, { status: 403 });
  const body = (await request.json().catch(() => null)) as { kind?: unknown } | null;
  const kind = body?.kind as SignInKind;
  if (!CLIENT_KINDS.includes(kind)) return new Response(null, { status: 400 });
  const recent = await getPrisma().signInEvent.count({ where: { kind, at: { gte: new Date(Date.now() - 60_000) } } }).catch(() => 0);
  if (recent < 60) { const agent = request.headers.get("user-agent"); after(() => recordSignIn(kind, agent)); }
  return new Response(null, { status: 204 });
}
