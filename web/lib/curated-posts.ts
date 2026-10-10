import { postDiscordAnnouncement } from "@/lib/discord";
import { promptPost, slotsOpenPost, twResultPost, weeklyPublicPost, type CuratedPost, type WeeklyPublicStats } from "@/lib/curated-messages";
import { getDashboardSummary } from "@/lib/dashboard";
import { isPromptWindow, pickPrompt, PROMPTS } from "@/lib/prompts";
import { JOIN_REQUIREMENTS } from "@/lib/requirements";
import { getPrisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";

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
  await postDiscordAnnouncement({ ...post, websiteUrl: siteUrl(), footer }, webhook);
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

/** Counts across current members' stored rosters. Numbers only, so nothing here can name a member. */
export async function getWeeklyPublicStats(): Promise<WeeklyPublicStats> {
  const prisma = getPrisma();
  const summary = await getDashboardSummary();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const active = { player: { membershipTerms: { some: { state: "ACTIVE" as const } } } };

  const [wins, players, wars] = await Promise.all([
    prisma.guildWin.findMany({ where: { occurredAt: { gte: weekAgo }, ...active }, select: { kind: true, value: true } }),
    prisma.player.findMany({
      where: { membershipTerms: { some: { state: "ACTIVE" } } },
      select: {
        profilePayload: true,
        profileSnapshots: { orderBy: { capturedAt: "desc" }, take: 1, select: { galacticLegends: true } },
      },
    }),
    prisma.guildEvent.findMany({
      where: { type: "TERRITORY_WAR", endsAt: { gte: weekAgo } },
      orderBy: { endsAt: "desc" },
      take: 1,
      select: { finalResult: true },
    }),
  ]);

  let relicNine = 0;
  let relicSevenPlus = 0;
  for (const player of players) {
    const payload = player.profilePayload as { rosterUnit?: { relic?: { currentTier?: unknown } }[] } | null;
    for (const unit of Array.isArray(payload?.rosterUnit) ? payload.rosterUnit : []) {
      const level = Number(unit.relic?.currentTier ?? 0) - 2;
      if (level >= 9) relicNine += 1;
      if (level >= 7) relicSevenPlus += 1;
    }
  }

  const war = wars[0]?.finalResult as { score?: unknown; opponentScore?: unknown } | undefined;
  const score = Number(war?.score ?? 0);
  const opponentScore = Number(war?.opponentScore ?? 0);

  return {
    members: summary.memberCount,
    capacity: summary.capacity,
    week: {
      galacticLegends: wins.filter((win) => win.kind === "GL_UNLOCK").length,
      ultimates: wins.filter((win) => win.kind === "ULTIMATE").length,
      relicLevels: wins.filter((win) => win.kind === "RELIC").length,
      newRelicNine: wins.filter((win) => win.kind === "RELIC" && win.value >= 9).length,
    },
    totals: {
      galacticLegends: players.reduce((sum, player) => sum + (player.profileSnapshots[0]?.galacticLegends ?? 0), 0),
      relicNine,
      relicSevenPlus,
    },
    lastWar: score || opponentScore ? { won: score > opponentScore, score, opponentScore } : null,
    requirements: { minGalacticPower: JOIN_REQUIREMENTS.minGalacticPower, minGalacticLegends: JOIN_REQUIREMENTS.minGalacticLegends },
    siteUrl: siteUrl(),
  };
}

/** The weekly numbers-only post for the public channel. At most once every five days. */
export async function runWeeklyPublicStats({ dryRun = false }: { dryRun?: boolean } = {}) {
  const post = weeklyPublicPost(await getWeeklyPublicStats());
  if (dryRun) return { posted: false, reason: "dry run", post };
  if (!channelWebhook("public")) return { posted: false, reason: "no public channel webhook is set", post };

  const prisma = getPrisma();
  const recent = await prisma.automationEvent.findFirst({
    where: { kind: "WEEKLY_PUBLIC_STATS", occurredAt: { gte: new Date(Date.now() - 5 * 86_400_000) } },
    select: { id: true },
  });
  if (recent) return { posted: false, reason: "already posted this week", post };

  const guild = await prisma.guild.findFirst({ select: { id: true } });
  if (!guild) return { posted: false, reason: "no guild", post };
  const record = await prisma.automationEvent.create({
    data: { guildId: guild.id, kind: "WEEKLY_PUBLIC_STATS", status: "PENDING", summary: "Weekly public stats post" },
  });
  try {
    const sent = await postToChannel("public", post, "Blues Brothers · This week");
    await prisma.automationEvent.update({ where: { id: record.id }, data: { status: sent ? "SENT" : "FAILED", sentAt: sent ? new Date() : null } });
    return { posted: sent, reason: sent ? "posted" : "not sent", post };
  } catch (error) {
    console.error("weekly public stats failed", error);
    await prisma.automationEvent.update({ where: { id: record.id }, data: { status: "FAILED" } });
    return { posted: false, reason: "post failed", post };
  }
}

/**
 * Announces a vacancy once, when the guild goes from full to having a seat. It only fires if the guild
 * has been seen full before and no vacancy post has been made since, so it never posts at first switch-on.
 */
export async function postSlotsOpenIfNeeded() {
  if (!channelWebhook("public")) return false;
  const prisma = getPrisma();
  const summary = await getDashboardSummary();
  const spaces = summary.capacity - summary.memberCount;
  if (spaces <= 0) return false;

  const [lastFull, lastPost] = await Promise.all([
    prisma.guildSnapshot.findFirst({ where: { memberCount: { gte: summary.capacity } }, orderBy: { capturedAt: "desc" }, select: { capturedAt: true, guildId: true } }),
    prisma.automationEvent.findFirst({ where: { kind: "SLOTS_OPEN" }, orderBy: { occurredAt: "desc" }, select: { occurredAt: true } }),
  ]);
  if (!lastFull) return false;
  if (lastPost && lastPost.occurredAt >= lastFull.capturedAt) return false;

  const record = await prisma.automationEvent.create({
    data: { guildId: lastFull.guildId, kind: "SLOTS_OPEN", status: "PENDING", summary: `${spaces} seat(s) open`, metadata: { spaces } },
  });
  try {
    const sent = await postToChannel(
      "public",
      slotsOpenPost({
        spaces,
        requirements: { minGalacticPower: JOIN_REQUIREMENTS.minGalacticPower, minGalacticLegends: JOIN_REQUIREMENTS.minGalacticLegends },
        siteUrl: siteUrl(),
      }),
      "Blues Brothers · Open seats",
    );
    await prisma.automationEvent.update({ where: { id: record.id }, data: { status: sent ? "SENT" : "FAILED", sentAt: sent ? new Date() : null } });
    return sent;
  } catch (error) {
    console.error("slots open post failed", error);
    await prisma.automationEvent.update({ where: { id: record.id }, data: { status: "FAILED" } });
    return false;
  }
}

/**
 * One conversation starter a week in #general, in the Wednesday-evening/Thursday window. It stands aside if
 * anything else was posted to #general in the last 20 hours, and is switched off with CURATED_PROMPTS=off.
 */
export async function postWeeklyPromptIfDue(now = new Date(), { force = false }: { force?: boolean } = {}) {
  if (process.env.CURATED_PROMPTS === "off") return false;
  if (!channelWebhook("general") || (!force && !isPromptWindow(now))) return false;

  const prisma = getPrisma();
  const [past, busy] = await Promise.all([
    prisma.automationEvent.findMany({ where: { kind: "WEEKLY_PROMPT" }, orderBy: { occurredAt: "desc" }, select: { occurredAt: true, metadata: true } }),
    prisma.automationEvent.findFirst({
      where: {
        kind: { in: ["TW_RESULT", "MEMBER_WELCOME", "MEMBER_DEPARTURE"] },
        status: "SENT",
        sentAt: { gte: new Date(now.getTime() - 20 * 3_600_000) },
      },
      select: { id: true },
    }),
  ]);
  if (past[0] && now.getTime() - past[0].occurredAt.getTime() < 6 * 86_400_000) return false;
  if (busy && !force) return false;

  const usedIds = past.flatMap((event) => {
    const id = (event.metadata as { promptId?: unknown } | null)?.promptId;
    return typeof id === "string" ? [id] : [];
  });
  const prompt = pickPrompt(usedIds, PROMPTS);

  const guild = await prisma.guild.findFirst({ select: { id: true } });
  if (!guild) return false;
  const record = await prisma.automationEvent.create({
    data: { guildId: guild.id, kind: "WEEKLY_PROMPT", status: "PENDING", summary: prompt.text, metadata: { promptId: prompt.id } },
  });
  try {
    const sent = await postToChannel("general", promptPost(prompt), "Blues Brothers · Question of the week");
    await prisma.automationEvent.update({ where: { id: record.id }, data: { status: sent ? "SENT" : "FAILED", sentAt: sent ? new Date() : null } });
    return sent;
  } catch (error) {
    console.error("weekly prompt failed", error);
    await prisma.automationEvent.update({ where: { id: record.id }, data: { status: "FAILED" } });
    return false;
  }
}
