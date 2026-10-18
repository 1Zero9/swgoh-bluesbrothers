import { canViewMembersArea } from "@/lib/member-gate";
import { resolveUnit, searchUnits } from "@/lib/who-has";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Unit name suggestions as you type. Members only. */
export async function GET(request: Request) {
  if (!(await canViewMembersArea())) return Response.json({ ok: false, error: "Members only." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "";
  // ?resolve=1 means "this is a full unit name, find that one unit", including the game's official names.
  const units = params.get("resolve") === "1" ? [resolveUnit(query)].filter((unit): unit is NonNullable<ReturnType<typeof resolveUnit>> => unit !== null) : searchUnits(query, 8);
  return Response.json({ ok: true, units }, { headers: { "Cache-Control": "no-store" } });
}
