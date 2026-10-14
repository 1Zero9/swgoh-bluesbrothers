import PublicHome from "./public-home";
import { getViewerAccess } from "@/lib/access-control";
import { getPublicHomeData } from "@/lib/public-stats";
import { getStarWarsNews } from "@/lib/news";
import AccountLink from "./account-link";
import HubHome, { type HubHomeProps } from "./hub-home";
import { getGuildWire } from "@/lib/guild-wire";
import { getMemberContext } from "@/lib/member-context";
import { openRequests, reviewQueue } from "@/lib/knowledge/data";
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

export default async function Home() {
  // Visitors get the public front page; signed-in members and officers get the hub.
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) {
    const [data, context, news] = await Promise.all([getPublicHomeData(), getMemberContext(), getStarWarsNews(5)]);
    return <PublicHome data={data} news={news} linking={context.status === "linking" ? <AccountLink context={context} /> : null} />;
  }

  const [context, wire, requests, queue, noteCount] = await Promise.all([
    getMemberContext(),
    safely(getGuildWire, []),
    safely(() => openRequests(access.playerId ?? null), []),
    access.isOfficer ? safely(reviewQueue, []) : Promise.resolve([]),
    access.isOfficer ? safely(countNotesAwaitingReview, 0) : Promise.resolve(0),
  ]);
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
  };
  return <HubHome {...props} />;
}
