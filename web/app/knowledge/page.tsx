import type { Metadata } from "next";
import Link from "next/link";
import IntelFooter from "@/app/intel-footer";
import MembersOnly from "@/app/members-only";
import PageHero from "@/app/page-hero";
import { getViewerAccess } from "@/lib/access-control";
import { canViewMembersArea } from "@/lib/member-gate";
import { allUnitNames } from "@/lib/wins";
import KnowledgeClient from "./knowledge-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Counter knowledge base · Blues Brothers",
  description: "What beats what, with sources, dates and who in the guild uses it.",
};

export default async function KnowledgePage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/knowledge" area="The counter knowledge base" />;
  const access = await getViewerAccess();
  const names = Object.fromEntries(allUnitNames().map((unit) => [unit.id, unit.name]));
  return (
    <main className="intel-shell destination-shell">
      <PageHero
        image="/tw-banner.webp"
        imageAlt="The Blues Brothers planning a Territory War"
        eyebrow="Counter knowledge base"
        title={<>What beats what.<br /><em>With the receipts.</em></>}
        description="Counters the guild has checked, with where they came from, when, and who uses them. Territory War, Grand Arena 5v5 and 3v3 are kept apart."
        priority
      />
      <section className="public-block">
        {access.isOfficer ? <p className="kb-officer-link"><Link href="/knowledge/review">Open the review queue →</Link></p> : null}
        <KnowledgeClient names={names} canAct={Boolean(access.playerId || access.isOfficer)} />
      </section>
      <IntelFooter message="Counters change with every season. B-Lue3 and the web can be wrong, so check in game before you commit a squad." />
    </main>
  );
}
