import type { Metadata } from "next";
import Link from "next/link";
import IntelFooter from "@/app/intel-footer";
import MembersOnly from "@/app/members-only";
import PageHero from "@/app/page-hero";
import { getViewerAccess } from "@/lib/access-control";
import { canReview } from "@/lib/knowledge/permissions";
import { allUnitNames } from "@/lib/wins";
import ReviewClient from "./review-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review counters · Blues Brothers", robots: { index: false } };

export default async function ReviewPage() {
  const access = await getViewerAccess();
  if (!canReview(access)) return <MembersOnly path="/knowledge/review" area="The counter review queue" />;
  const names = Object.fromEntries(allUnitNames().map((unit) => [unit.id, unit.name]));
  return (
    <main className="intel-shell destination-shell">
      <PageHero
        image="/tw-banner.webp"
        imageAlt="The Blues Brothers planning a Territory War"
        eyebrow="Officers"
        title={<>Check it.<br /><em>Then publish it.</em></>}
        description="Counters from members and B-Lue3 wait here. Read the sources, then publish, reject or flag. Nothing goes live without you."
      />
      <section className="public-block">
        <p className="kb-officer-link"><Link href="/knowledge">← Back to the counter knowledge base</Link></p>
        <ReviewClient names={names} />
      </section>
      <IntelFooter message="Look at where each counter came from, and when." />
    </main>
  );
}
