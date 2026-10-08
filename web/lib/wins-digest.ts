import { getPrisma } from "@/lib/prisma";
import { postDiscordAnnouncement } from "@/lib/discord";
import { describeWin, type WinKind } from "@/lib/wins";

export type DigestWin = { who: string; kind: WinKind; subject: string; value: number };

const MAX_LINES = 12;

function siteUrl() {
  return process.env.SITE_URL || "https://swgoh-bluesbrothers.vercel.app";
}

/** Pure formatter: turns a week of wins into the Discord post, or null when there is nothing worth posting. */
export function buildWeeklyDigest(wins: DigestWin[]) {
  if (!wins.length) return null;

  const described = wins.map((win) => ({ win, ...describeWin(win) }));
  const headlines = described.filter((item) => item.tier === "headline");
  const smaller = described.length - headlines.length;
  const members = new Set(wins.map((win) => win.who)).size;

  const order: Record<string, number> = { "Galactic Legend": 0, Ultimate: 1, Relic: 2 };
  const lines = headlines
    .sort((a, b) => (order[a.tag] ?? 9) - (order[b.tag] ?? 9))
    .slice(0, MAX_LINES)
    .map((item) => `${item.icon} **${item.win.who}** ${item.text}`);
  const hidden = headlines.length - lines.length;

  const parts = [
    lines.join("\n"),
    hidden > 0 ? `…and ${hidden} more headline wins on the site.` : "",
    smaller > 0 ? `Plus ${smaller} smaller upgrades — relic levels, new units, datacrons.` : "",
    `**${members} member${members === 1 ? "" : "s"}** moved the guild forward this week. Every win, in full: ${siteUrl()}/wins`,
  ].filter(Boolean);

  return {
    title: "This week for the Blues Brothers",
    description: parts.join("\n\n"),
    color: 0xfbbf24,
    websiteUrl: `${siteUrl()}/wins`,
    footer: "Blues Brothers · The Wins",
  };
}

export async function runWeeklyDigest({ dryRun = false }: { dryRun?: boolean } = {}) {
  const prisma = getPrisma();
  const since = new Date(Date.now() - 7 * 86_400_000);

  const rows = await prisma.guildWin.findMany({
    where: { occurredAt: { gte: since } },
    include: { player: { select: { currentName: true } } },
  });
  const digest = buildWeeklyDigest(rows.map((row) => ({
    who: row.player.currentName,
    kind: row.kind as WinKind,
    subject: row.subject,
    value: row.value,
  })));

  if (dryRun || !digest) return { posted: false, reason: dryRun ? "dry run" : "no wins this week", digest };

  const webhookUrl = process.env.DISCORD_WINS_WEBHOOK_URL;
  if (!webhookUrl) return { posted: false, reason: "DISCORD_WINS_WEBHOOK_URL is not set", digest };

  // One post per week even if the cron fires twice.
  const recent = await prisma.automationEvent.findFirst({
    where: { kind: "WEEKLY_DIGEST", status: "SENT", occurredAt: { gte: new Date(Date.now() - 5 * 86_400_000) } },
  });
  if (recent) return { posted: false, reason: "already posted this week", digest };

  const guild = await prisma.guild.findFirst({ select: { id: true } });
  if (!guild) return { posted: false, reason: "no guild", digest };

  await postDiscordAnnouncement(digest, webhookUrl);
  await prisma.automationEvent.create({
    data: {
      guildId: guild.id,
      kind: "WEEKLY_DIGEST",
      status: "SENT",
      title: digest.title,
      summary: `Weekly digest posted covering ${rows.length} wins.`,
      sentAt: new Date(),
    },
  });
  return { posted: true, reason: "posted", digest };
}
