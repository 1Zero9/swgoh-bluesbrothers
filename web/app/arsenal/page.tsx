import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import { getGuildArsenal } from "@/lib/guild-arsenal";
import { UNIT_CHECKLIST } from "@/lib/unit-checklist";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Guild Arsenal · Blues Brothers",
  description: "Live priority-unit coverage across the Blues Brothers SWGOH guild.",
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
        description="High-value roster coverage across Galactic Legends, core characters and capital ships. Counts refresh as player profiles rotate through the guild sync."
        priority
      >
        <div className="intel-summary" aria-label="Arsenal data coverage">
          <div><strong>{arsenal.syncedMembers}<span>/{arsenal.memberCount || "—"}</span></strong><small>profiles synced</small></div>
          <div><strong>{profileCoverage}<span>%</span></strong><small>roster coverage</small></div>
          <div><strong>{priorityUnitCount}</strong><small>priority units</small></div>
        </div>
      </PageHero>

      {arsenal.categories.length ? (
        <div className="arsenal-sections">
          {arsenal.categories.map((category) => (
            <section className="arsenal-category" key={category.name}>
              <header>
                <div><p className="eyebrow">Collection coverage</p><h2>{category.name}</h2></div>
                <strong>{category.coverage}<span>%</span><small>owned</small></strong>
              </header>
              <div className="arsenal-grid">
                {category.units.map((unit) => {
                  const ownedPct = percentage(unit.owned, arsenal.syncedMembers);
                  const isShip = category.name === "Capital Ships";
                  return (
                    <article className="arsenal-card" key={unit.definitionId}>
                      <div className="arsenal-card-head">
                        <span aria-hidden="true">{unit.name.charAt(0)}</span>
                        <div><h3>{unit.name}</h3><p>{unit.owned} of {arsenal.syncedMembers} synced members</p></div>
                        <strong>{ownedPct}%</strong>
                      </div>
                      <div className="arsenal-track"><i style={{ width: `${ownedPct}%` }} /></div>
                      <div className="arsenal-stats">
                        <span><small>Owned</small><strong>{unit.owned}</strong></span>
                        <span><small>7 star</small><strong>{unit.sevenStar}</strong></span>
                        {isShip ? (
                          <span><small>Coverage</small><strong>{ownedPct}%</strong></span>
                        ) : (
                          <span><small>R5+</small><strong>{unit.relicFive}</strong></span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
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
