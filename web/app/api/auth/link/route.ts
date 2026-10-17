import { NextResponse } from "next/server";
import { MEMBER_COOKIE_NAME, createMemberCookieValue, isMemberAuthConfigured } from "@/lib/member-auth";
import { looksLikeToken } from "@/lib/signin-link";
import { consumeSignInLink } from "@/lib/signin-link-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The member taps "Sign me in" on /signin/<token>. Only this POST uses the link up. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return new Response(null, { status: 403 });
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  if (!isMemberAuthConfigured() || !looksLikeToken(token)) return NextResponse.redirect(new URL("/", url), 303);
  const playerId = await consumeSignInLink(token).catch(() => null);
  if (!playerId) return NextResponse.redirect(new URL(`/signin/${token}`, url), 303);
  const session = createMemberCookieValue(playerId);
  const response = NextResponse.redirect(new URL("/", url), 303);
  response.cookies.set(MEMBER_COOKIE_NAME, session.value, { httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/", maxAge: session.maxAge });
  return response;
}
