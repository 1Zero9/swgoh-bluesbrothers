import { postDiscordAnnouncement } from "@/lib/discord";
import { twResultPost, type CuratedPost } from "@/lib/curated-messages";
import { getPrisma } from "@/lib/prisma";

export type CuratedChannel = "general" | "public";

/** The first variable that is set wins, so the public channel can be wired as either name. */
const CHANNEL_ENV: Record<CuratedChannel, string[]> = {
  general: ["DISCORD_GENERAL_WEBHOOK_URL"],
  public: ["DISCORD_PUBLIC_WEBHOOK_URL", "DISCORD_WELCOME_WEBHOOK_URL"],
};

export function channelWebhook(channel: CuratedChannel) {
  for (const name of CHANNEL_ENV[channel]) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

/** Posts to one of the curated channels; does nothing (returns false) when that channel has no webhook. */
export async function postToChannel(channel: CuratedChannel, post: CuratedPost, footer = "Blues Brothers") {
  const webhook = channelWebhook(channel);
  if (!webhook) return false;
  await postDiscordAnnouncement({ ...post, websiteUrl: process.env.SITE_URL, footer }, webhook);
  return true;
}

/** Only fresh results are announced, so switching this on never replays old wars. */
const FRESH_MS = 48 * 60 * 60 * 1000;

export async function postNewTwResults() {
  if (!channelWebhook("general")) return 0;
  const prisma = getPrisma();
  const events = await prisma.guildEvent.findMany({
    where: { type: "TERRITORY_WAR", finalResult: { not: undefined }, endsAt: { gte: new Date(Date.now() - FRESH_MS) } },
    select: { id: true, guildId: true, externalId: true, finalResult: true },
  });

  let posted = 0;
  for (const event of events) {
    const result = event.finalResult as { score?: unknown; opponentScore?: unknown; opponentGuildProfile?: { name?: unknown } } | null;
    const score = Number(result?.score ?? 0);
    const opponentScore = Number(result?.opponentScore ?? 0);
    if (!result || (!score && !opponentScore)) continue;

    const already = await prisma.automationEvent.findFirst({
      where: { kind: "TW_RESULT", metadata: { path: ["eventId"], equals: event.id } },
      select: { id: true },
    });
    if (already) continue;

    // Record first so an overlapping sync can't post it twice.
    const record = await prisma.automationEvent.create({
      data: {
        guildId: event.guildId,
        kind: "TW_RESULT",
        status: "PENDING",
        summary: `Territory War result ${score}–${opponentScore}`,
        metadata: { eventId: event.id },
      },
    });
    try {
      const post = twResultPost(
        { opponent: String(result.opponentGuildProfile?.name ?? "another guild"), score, opponentScore },
        event.externalId ?? event.id,
      );
      const sent = await postToChannel("general", post, "Blues Brothers · Territory War");
      await prisma.automationEvent.update({ where: { id: record.id }, data: { status: sent ? "SENT" : "FAILED", sentAt: sent ? new Date() : null } });
      if (sent) posted += 1;
    } catch (error) {
      console.error("TW result post failed", error);
      await prisma.automationEvent.update({ where: { id: record.id }, data: { status: "FAILED" } });
    }
  }
  return posted;
}
