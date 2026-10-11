import { canViewMembersArea } from "@/lib/member-gate";
import { searchUnits } from "@/lib/who-has";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Unit name suggestions as you type. Members only. */
export async function GET(request: Request) {
  if (!(await canViewMembersArea())) return Response.json({ ok: false, error: "Members only." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json({ ok: true, units: searchUnits(query, 8) }, { headers: { "Cache-Control": "no-store" } });
}
