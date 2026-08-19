import { cookies } from "next/headers";
import {
  OFFICER_COOKIE_NAME,
  checkOfficerPassword,
  createOfficerSessionCookie,
  isOfficerConfigured,
} from "@/lib/officer-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isOfficerConfigured()) {
    return Response.json({ ok: false, error: "officer access is not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !checkOfficerPassword(body.password)) {
    return Response.json({ ok: false, error: "incorrect password" }, { status: 401 });
  }

  const session = createOfficerSessionCookie();
  const store = await cookies();
  store.set(OFFICER_COOKIE_NAME, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(OFFICER_COOKIE_NAME);
  return Response.json({ ok: true });
}
