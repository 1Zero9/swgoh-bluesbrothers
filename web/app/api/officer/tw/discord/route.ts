import { cookies } from "next/headers";
import { postDiscordAnnouncement } from "@/lib/discord";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

async function isOfficerSession() {
  const store = await cookies();
  return verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);
}

export async function POST(request: Request) {
  if (!(await isOfficerSession())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { title?: string; message?: string } | null;
  const title = body?.title?.trim();
  const message = body?.message?.trim();
  if (!title || !message) {
    return Response.json({ ok: false, error: "title and message are required" }, { status: 400 });
  }
  if (message.length > 3800) {
    return Response.json({ ok: false, error: "message is too long for a single Discord embed" }, { status: 400 });
  }

  try {
    const posted = await postDiscordAnnouncement({
      title,
      description: message,
      color: 0x4a9eff,
      websiteUrl: process.env.SITE_URL,
    });
    return Response.json({ ok: true, posted });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed to post" }, { status: 502 });
  }
}
