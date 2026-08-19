import { NextResponse } from "next/server";
import { buildDiscordAuthorizeUrl } from "@/lib/discord-oauth";
import { OAUTH_STATE_COOKIE_NAME, createOAuthState, isMemberAuthConfigured } from "@/lib/member-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isMemberAuthConfigured()) {
    return Response.json({ ok: false, error: "account linking is not configured" }, { status: 503 });
  }

  const state = createOAuthState();
  const response = NextResponse.redirect(buildDiscordAuthorizeUrl(state));
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
