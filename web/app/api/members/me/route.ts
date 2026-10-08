import { cookies } from "next/headers";
import { MEMBER_COOKIE_NAME, verifyMemberCookieValue } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Cheap "is this visitor a linked member?" check so statically cached pages can adapt on the client. */
export async function GET() {
  const store = await cookies();
  const linked = Boolean(verifyMemberCookieValue(store.get(MEMBER_COOKIE_NAME)?.value));
  return Response.json({ linked }, { headers: { "Cache-Control": "private, no-store" } });
}
