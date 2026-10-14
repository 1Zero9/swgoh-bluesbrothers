import PublicHome from "./public-home";
import { getViewerAccess } from "@/lib/access-control";
import { getPublicHomeData } from "@/lib/public-stats";
import { getStarWarsNews } from "@/lib/news";
import LinkWelcome from "./link-welcome";
import SignInProblem from "./sign-in-problem";
import { getDiscordUrl } from "@/lib/discord";
import HubHome, { type HubHomeProps } from "./hub-home";
import { getGuildWire } from "@/lib/guild-wire";
import { getDashboardSummary } from "@/lib/dashboard";
import { buildStatusRow } from "@/lib/home-status";
import { getRaidRoom } from "@/lib/raids";
import { getWinsFeed } from "@/lib/wins-feed";
import { getPrisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member-context";
import { getRosterChanges } from "@/lib/members";
import { enabledChatChannels } from "@/lib/chat-config";
import { getDiscordUrl as discordLink } from "@/lib/discord";
import { openRequests, reviewQueue } from "@/lib/knowledge/data";
import { blueEnabled } from "@/lib/blue/ask";
import { getUsage } from "@/lib/blue/limits";
import { resetLabel } from "@/lib/blue/reset-label";
import { countNotesAwaitingReview } from "@/lib/knowledge/notes-data";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";

export const dynamic = "force-dynamic";

function formatPower(value: bigint) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString("en-GB");
}

function relativeTime(date: Date) {
  const hours = (Date.now() - date.getTime()) / 3_600_000;
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 7) return `${Math.round(days)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Run a loader that may fail (no database yet, a table not migrated) without taking the whole home page down. */
async function safely<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try { return await load(); } catch { return fallback; }
}

export default async function Home({ searchParams }: { searchParams: Promise<{ link?: string | string[] }> }) {
  // Visitors get the public front page; signed-in members and officers get the hub.
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) {
    const [data, context, news] = await Promise.all([getPublicHomeData(), getMemberContext(), getStarWarsNews(5)]);
    // Signed in with Discord but not yet matched to a game account: a short guided step, not a block lower down the page.
    if (context.status === "linking") return <LinkWelcome discordUsername={context.discordUsername} discordUrl={getDiscordUrl()} />;
    // The Discord sign-in sends people back here with ?link=error when it did not finish.
    const { link } = await searchParams;
    return <PublicHome data={data} news={news} notice={link === "error" ? <SignInProblem discordUrl={getDiscordUrl()} /> : null} />;
  }

  const [context, wire, requests, queue, noteCount, usage, publicData, summary, winsFeed, openCallouts, raidRoom, changes, calloutRows] = await Promise.all([
    getMemberContext(),
    safely(getGuildWire, []),
    safely(() => openRequests(access.playerId ?? null), []),
    access.isOfficer ? safely(reviewQueue, []) : Promise.resolve([]),
    access.isOfficer ? safely(countNotesAwaitingReview, 0) : Promise.resolve(0),
    blueEnabled() ? safely(() => getUsage(access.playerId ?? "officer"), null) : Promise.resolve(null),
    safely(() => getPublicHomeData(), null),
    safely(() => getDashboardSummary(), null),
    safely(() => getWinsFeed(), null),
    safely(() => getPrisma().tbCallout.count({ where: { status: "OPEN" } }), null as number | null),
    safely(() => getRaidRoom(), null),
    safely(() => getRosterChanges(), { newMembers: [], departedMembers: [] }),
    safely(() => getPrisma().tbCallout.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 4, select: { id: true, unitName: true, minStars: true, minRelic: true, needed: true, planetName: true, phase: true } }), []),
  ]);
  const chatChannel = enabledChatChannels()[0];
  const linked = context.status === "linked";

  const props: HubHomeProps = {
    name: linked ? context.player.name : (access.playerName ?? null),
    linked,
    standing: linked ? `${formatPower(context.player.galacticPower)} GP · ${context.player.raidTickets} raid tickets` : null,
    checkIn: linked && context.player.onWallOfShame ? `Check-in needed: ${context.player.reasons[0]?.toLowerCase() ?? "see my page"}` : null,
    requests: requests.slice(0, 3).map((request) => ({ id: request.id, leaderName: request.leaderName, modeLabel: MODE_LABELS[request.mode as KbMode] ?? request.mode })),
    wire: wire.slice(0, 3).map((item) => ({ id: item.id, title: item.title, summary: item.summary, when: relativeTime(item.occurredAt) })),
    isOfficer: access.isOfficer,
    reviewCount: queue.length + noteCount,
    stats: summary?.live ? { members: `${summary.memberCount}/${summary.capacity}`, power: formatPower(summary.guildPower), tickets: summary.dailyTickets ? summary.dailyTickets.toLocaleString("en-GB") : null, legends: publicData?.live ? String(publicData.galacticLegends) : null } : null,
    wins: (winsFeed?.days.flatMap((day) => day.wins) ?? []).filter((win) => win.tier === "headline").slice(0, 4).map((win) => ({ id: win.id, who: win.who, text: win.text, when: relativeTime(win.occurredAt) })),
    status: buildStatusRow({
      tw: publicData?.tw ?? { wins: 0, losses: 0, recent: [] },
      openCallouts,
      tickets: summary?.live ? { today: summary.dailyTickets, target: summary.ticketTarget } : null,
      lastRaid: raidRoom?.raids[0] ? { label: raidRoom.raids[0].label, outcomeLabel: raidRoom.raids[0].outcomeLabel } : null,
    }),
    newMembers: changes.newMembers.slice(0, 4).map((member) => ({ id: member.playerId, name: member.name, when: relativeTime(member.joinedAt), power: member.galacticPower ? formatPower(BigInt(member.galacticPower)) : null })),
    callouts: calloutRows.map((row) => ({ id: row.id, unit: row.unitName, need: `${row.minRelic > 0 ? `relic ${row.minRelic}+` : `${row.minStars} stars`}${row.needed ? `, ${row.needed} needed` : ""}`, where: row.planetName ?? (row.phase ? `phase ${row.phase}` : null) })),
    chat: chatChannel ? { channelKey: chatChannel.key, label: chatChannel.label, signedInAsMember: access.isMember && Boolean(access.playerId) } : null,
    discordUrl: discordLink(),
    questions: usage ? { left: usage.left, limit: usage.limit, resetsLabel: resetLabel(usage.resetsOn) } : null,
  };
  return <HubHome {...props} />;
}
