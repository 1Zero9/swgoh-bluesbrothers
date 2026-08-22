import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import { getGuildArsenal } from "@/lib/guild-arsenal";
import { UNIT_CHECKLIST } from "@/lib/unit-checklist";
import ArsenalInteractive from "./arsenal-interactive";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Guild Arsenal · Blues Brothers",
  description: "Live priority-unit coverage and interactive squad eligibility search across the Blues Brothers SWGOH guild.",
};

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function ArsenalPage() {
  const arsenal = await getGuildArsenal();
  const profileCoverage = percentage(arsenal.syncedMembers, arsenal.memberCount);
  const priorityUnitCount = Object.values(UNIT_CHECKLIST).reduce((total, units) => total + units.length, 0);

  return (
    <main className="intel-shell">
      <PageHero
        image="/arsnel-banner.webp"
        imageAlt="The Blues Brothers reviewing ships and units inside a busy guild arsenal"
        eyebrow="Guild arsenal"
        title={<>Know what the band<br /><em>can put on the field.</em></>}
        description="Click any card to plan squad coverage and check player eligibility. High-value roster coverage across Galactic Legends, core characters and capital ships."
        priority
      >
        <div className="intel-summary" aria-label="Arsenal data coverage">
          <div><strong>{arsenal.syncedMembers}<span>/{arsenal.memberCount || "—"}</span></strong><small>profiles synced</small></div>
          <div><strong>{profileCoverage}<span>%</span></strong><small>roster coverage</small></div>
          <div><strong>{priorityUnitCount}</strong><small>priority units</small></div>
        </div>
      </PageHero>

      {arsenal.categories.length ? (
        <ArsenalInteractive
          categories={arsenal.categories}
          syncedMembers={arsenal.syncedMembers}
        />
      ) : (
        <section className="intel-empty">
          <strong>The arsenal is waiting for roster data.</strong>
          <p>It will populate automatically after the database migration and player-profile sync complete.</p>
        </section>
      )}

      <footer className="intel-footer">
        <span>Checklist adapted from SWGoHBot under the MIT licence.</span>
        <Link href="/credits">Sources &amp; credits →</Link>
      </footer>
    </main>
  );
}
