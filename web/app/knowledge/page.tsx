import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeading } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { canViewMembersArea } from "@/lib/member-gate";
import { allUnitNames } from "@/lib/wins";
import KnowledgeHub from "./knowledge-hub";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Knowledge · Blues Brothers",
  description: "What the guild has learned: counters, tips and ideas, checked by officers.",
};

export default async function KnowledgePage({ initialTab = "counters" }: { initialTab?: "counters" | "TIP" | "IDEA" }) {
  if (!(await canViewMembersArea())) return <MembersOnly path="/knowledge" area="The guild knowledge base" />;
  const access = await getViewerAccess();
  const names = Object.fromEntries(allUnitNames().map((unit) => [unit.id, unit.name]));
  return (
    <HubPage>
      <HubHeading
        eyebrow="Knowledge"
        title="What the guild has learned"
        intro="Counters, tips and ideas from the band, with where each one came from. Add what you know and everyone, B-Lue3 included, can use it."
      />
      {access.isOfficer ? <p className="hub-officer-link"><Link href="/knowledge/review">Open the review queue →</Link></p> : null}
      <KnowledgeHub initialTab={initialTab} names={names} canAct={Boolean(access.playerId || access.isOfficer)} />
    </HubPage>
  );
}
