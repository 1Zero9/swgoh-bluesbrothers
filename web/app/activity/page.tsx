import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getActivityFeed, type ActivityItem } from "@/lib/activity-feed";
import { canViewMembersArea } from "@/lib/member-gate";
import ActivityFeed from "./activity-feed";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guild activity · Blues Brothers", description: "What the guild has done lately: star promotions, gear, relics, unlocks.", robots: { index: false } };

export default async function ActivityPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/activity" area="The guild activity feed" />;
  let items: ActivityItem[] = [];
  try { items = await getActivityFeed(); } catch { /* database not reachable: show an empty feed */ }
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Guild" title="Guild activity" intro="Star promotions, gear, relics and unlocks across the guild, newest first, like the feed in the game's guild chat. It is built from roster checks, so expect it to run a day or two behind the game.">
        <Link className="hub-pagehead-link" href="/wins">The Wins →</Link>
      </HubHeader>
      <ActivityFeed items={items} />
    </HubPage>
  );
}
