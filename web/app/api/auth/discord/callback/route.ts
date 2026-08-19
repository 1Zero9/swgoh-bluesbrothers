import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeDiscordCode, fetchDiscordIdentity } from "@/lib/discord-oauth";
import {
  LINK_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  createLinkCookieValue,
  isMemberAuthConfigured,
} from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const home = new URL("/", url);

  if (!isMemberAuthConfigured()) {
    home.searchParams.set("link", "error");
    return NextResponse.redirect(home);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const expectedState = store.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    home.searchParams.set("link", "error");
    const response = NextResponse.redirect(home);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  try {
    const accessToken = await exchangeDiscordCode(code);
    const identity = await fetchDiscordIdentity(accessToken);
    const link = createLinkCookieValue(identity.id, identity.username);

    home.searchParams.set("link", "pending");
    const response = NextResponse.redirect(home);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
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
    return response;
  }
}
