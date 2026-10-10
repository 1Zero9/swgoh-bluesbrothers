import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeDiscordCode, fetchDiscordIdentity } from "@/lib/discord-oauth";
import {
  LINK_COOKIE_NAME,
  MEMBER_COOKIE_NAME,
  OAUTH_NEXT_COOKIE_NAME,
  OAUTH_PROMPT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  createLinkCookieValue,
  createMemberCookieValue,
  isMemberAuthConfigured,
  safeNextPath,
} from "@/lib/member-auth";
import { findActiveMemberByDiscordId } from "@/lib/member-lookup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const home = new URL("/", url);

  if (!isMemberAuthConfigured()) {
    home.searchParams.set("link", "error");
    return NextResponse.redirect(home);
  }

  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const expectedState = store.get(OAUTH_STATE_COOKIE_NAME)?.value;

  // First sign-in: Discord won't skip its approval screen (prompt=none), so ask again with it showing.
  if (oauthError && state && expectedState && state === expectedState && store.get(OAUTH_PROMPT_COOKIE_NAME)?.value === "none") {
    return NextResponse.redirect(new URL("/api/auth/discord?consent=1", url));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    home.searchParams.set("link", "error");
    const response = NextResponse.redirect(home);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    response.cookies.delete(OAUTH_PROMPT_COOKIE_NAME);
    return response;
  }

  try {
    const accessToken = await exchangeDiscordCode(code);
    const identity = await fetchDiscordIdentity(accessToken);
    const next = safeNextPath(store.get(OAUTH_NEXT_COOKIE_NAME)?.value);

    // Already linked to an active member (primary or extra account): sign them straight in.
    const member = await findActiveMemberByDiscordId(identity.id).catch(() => null);
    if (member) {
      const session = createMemberCookieValue(member.id);
      const response = NextResponse.redirect(new URL(next, url));
      response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      response.cookies.delete(OAUTH_PROMPT_COOKIE_NAME);
      response.cookies.delete(OAUTH_NEXT_COOKIE_NAME);
      response.cookies.delete(LINK_COOKIE_NAME);
      response.cookies.set(MEMBER_COOKIE_NAME, session.value, {
        httpOnly: true,
        secure: url.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: session.maxAge,
      });
      return response;
    }

    const link = createLinkCookieValue(identity.id, identity.username);

    home.searchParams.set("link", "pending");
    const response = NextResponse.redirect(home);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    response.cookies.delete(OAUTH_PROMPT_COOKIE_NAME);
    response.cookies.delete(OAUTH_NEXT_COOKIE_NAME);
    response.cookies.set(LINK_COOKIE_NAME, link.value, {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: link.maxAge,
    });
    return response;
  } catch {
    home.searchParams.set("link", "error");
    const response = NextResponse.redirect(home);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    response.cookies.delete(OAUTH_PROMPT_COOKIE_NAME);
    return response;
  }
}
