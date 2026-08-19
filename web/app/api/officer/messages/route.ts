import { cookies } from "next/headers";
import { postDiscordAnnouncement } from "@/lib/discord";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getPrisma } from "@/lib/prisma";

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

  const body = (await request.json().catch(() => null)) as
    | { title?: string; body?: string; author?: string }
    | null;
  const title = body?.title?.trim();
  const message = body?.body?.trim();
  const author = body?.author?.trim();

  if (!title || !message) {
    return Response.json({ ok: false, error: "title and body are required" }, { status: 400 });
  }
  if (title.length > 120 || message.length > 2000) {
    return Response.json({ ok: false, error: "title or body is too long" }, { status: 400 });
  }

  const prisma = getPrisma();
  const guild = await prisma.guild.findFirst({ orderBy: { createdAt: "asc" } });
  if (!guild) {
    return Response.json({ ok: false, error: "no guild on record yet" }, { status: 409 });
  }

  const event = await prisma.automationEvent.create({
    data: {
      guildId: guild.id,
      kind: "OFFICER_NOTICE",
      title,
      summary: message,
      metadata: author ? { author } : undefined,
    },
  });

  let posted = false;
  try {
    posted = await postDiscordAnnouncement({
      title: `Cantina notice: ${title}`,
      description: author ? `${message}\n\n— ${author}` : message,
      color: 0xdfc49a,
      websiteUrl: process.env.SITE_URL,
    });
  } catch {
    posted = false;
  }

  await prisma.automationEvent.update({
    where: { id: event.id },
    data: { status: posted ? "SENT" : "PENDING", sentAt: posted ? new Date() : null },
  });

  return Response.json({ ok: true, id: event.id, discordPosted: posted });
}
