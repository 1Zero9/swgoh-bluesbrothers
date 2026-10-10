import { cookies } from "next/headers";
import { MEMBER_COOKIE_NAME, LINK_COOKIE_NAME } from "@/lib/member-auth";
import { OFFICER_COOKIE_NAME } from "@/lib/officer-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Signs out of everything: member session, pending Discord link and the shared officer password session. */
export async function POST() {
  const store = await cookies();
  store.delete(MEMBER_COOKIE_NAME);
  store.delete(LINK_COOKIE_NAME);
  store.delete(OFFICER_COOKIE_NAME);
  return Response.json({ ok: true });
}
