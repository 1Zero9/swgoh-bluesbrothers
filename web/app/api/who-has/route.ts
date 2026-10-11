import { canViewMembersArea } from "@/lib/member-gate";
import { whoHas } from "@/lib/who-has";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Who in the guild has a unit? Members only. `?unit=<id or name>&minStars=7` */
export async function GET(request: Request) {
  if (!(await canViewMembersArea())) return Response.json({ ok: false, error: "Members only." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const minStars = Math.min(7, Math.max(0, Math.trunc(Number(params.get("minStars") ?? 0)) || 0));
  const result = await whoHas(params.get("unit") ?? "", minStars);
  return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}
