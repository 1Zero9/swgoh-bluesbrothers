import { NextResponse } from "next/server";
import { buildDiscordAuthorizeUrl } from "@/lib/discord-oauth";
import { SIGNED_IN_BEFORE_COOKIE, OAUTH_NEXT_COOKIE_NAME, OAUTH_PROMPT_COOKIE_NAME, OAUTH_STATE_COOKIE_NAME, createOAuthState, isMemberAuthConfigured, safeNextPath } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isMemberAuthConfigured()) {
    return Response.json({ ok: false, error: "account linking is not configured" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  // Someone who has signed in here before can skip Discord's approval screen (prompt=none). A first-timer goes straight to it in one step:
  // the old "try silently, fail, then retry" round trip is what left some phones on a blank page.
  const returning = request.headers.get("cookie")?.includes(`${SIGNED_IN_BEFORE_COOKIE}=1`) ?? false;
  const prompt = requestUrl.searchParams.get("consent") === "1" || !returning ? "consent" : "none";
  const state = createOAuthState();
  const response = NextResponse.redirect(buildDiscordAuthorizeUrl(state, prompt));
  response.cookies.set(OAUTH_PROMPT_COOKIE_NAME, prompt, {
    httpOnly: true,
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const next = safeNextPath(requestUrl.searchParams.get("next"));
  if (next !== "/") {
    response.cookies.set(OAUTH_NEXT_COOKIE_NAME, next, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  }

  return response;
}
