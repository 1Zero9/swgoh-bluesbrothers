import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import { getDashboardSummary } from "@/lib/dashboard";
import { getTerritoryWarRoom } from "@/lib/territory-war";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Guild Operations · Blues Brothers",
  description: "Territory War, Territory Battle, raid and roster-planning destinations.",
};

function power(value: bigint) {
  const amount = Number(value);
  return amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(1)}M` : amount.toLocaleString("en-GB");
}

export default async function OperationsPage() {
  const [war, summary] = await Promise.all([getTerritoryWarRoom(), getDashboardSummary()]);
  return (
    <main className="intel-shell destination-shell operations-shell">
      <PageHero
        image="/ops-banner.webp"
        imageAlt="The Blues Brothers and guild officers planning missions around a holographic operations table"
        eyebrow="Guild operations"
        title={<>Every mission.<br /><em>One launch deck.</em></>}
        description="Territory War, Territory Battle, raids and roster intelligence now live together here instead of competing for space on the homepage."
        priority
      >
        <div className="operation-quicklinks" aria-label="Operation shortcuts">
          <Link href="/territory-war"><span>TW</span><strong>Territory War</strong></Link>
          <Link href="/territory-battles"><span>TB</span><strong>Territory Battles</strong></Link>
          <Link href="/raids"><span>RD</span><strong>Raids</strong></Link>
          <Link href="/arsenal"><span>AR</span><strong>Guild Arsenal</strong></Link>
        </div>
      </PageHero>

      <section className="operation-grid" aria-label="Operation destinations">
        <article className="operation-card operation-live" id="territory-war">
          <header><span>Territory War</span><i>{war.active ? "Live now" : "Ready"}</i></header>
          <div className="operation-mark">TW</div>
          <h2>{war.active ? `Vs ${war.opponentName || "the opposition"}` : "The war room"}</h2>
          <p>Registration, locked power, opponent scores, zone state and member readiness in one live board.</p>
          <dl><div><dt>Joined</dt><dd>{war.active ? `${war.joinedCount}/${war.members.length}` : "—"}</dd></div><div><dt>Guild GP</dt><dd>{summary.live ? power(summary.guildPower) : "—"}</dd></div></dl>
          <Link href="/territory-war">Open Territory War <span>→</span></Link>
        </article>

        <article className="operation-card" id="territory-battles">
          <header><span>Territory Battle</span><i>Readiness</i></header>
          <div className="operation-mark">TB</div>
          <h2>Rise of the Empire</h2>
          <p>Deployments, operations, combat missions and platoon assignments will land here as the next dedicated operations tool.</p>
          <dl><div><dt>Roster</dt><dd>{summary.live ? summary.memberCount : "—"}</dd></div><div><dt>Guild GP</dt><dd>{summary.live ? power(summary.guildPower) : "—"}</dd></div></dl>
          <Link href="/territory-battles">Open Territory Battles <span>→</span></Link>
        </article>

        <article className="operation-card" id="raids">
          <header><span>Raid operations</span><i>Readiness</i></header>
          <div className="operation-mark">RD</div>
          <h2>Raid readiness</h2>
          <p>Attempts, personal score history and team readiness will move onto their own page as raid tracking comes online.</p>
          <dl><div><dt>Tickets</dt><dd>{summary.live ? summary.dailyTickets.toLocaleString("en-GB") : "—"}</dd></div><div><dt>Target</dt><dd>{summary.ticketTarget.toLocaleString("en-GB")}</dd></div></dl>
          <Link href="/raids">Open Raid operations <span>→</span></Link>
        </article>

        <article className="operation-card operation-arsenal">
          <header><span>Roster intelligence</span><i>Live</i></header>
          <div className="operation-mark">AR</div>
          <h2>Guild Arsenal</h2>
          <p>Galactic Legends, core characters and capital-ship coverage across the profiles already captured.</p>
          <dl><div><dt>Members</dt><dd>{summary.live ? summary.memberCount : "—"}</dd></div><div><dt>Source</dt><dd>Profiles</dd></div></dl>
          <Link href="/arsenal">Open Guild Arsenal <span>→</span></Link>
        </article>
      </section>

      <footer className="intel-footer"><span>More operational tools can now grow without extending the homepage.</span><Link href="/members">Open member directory →</Link></footer>
    </main>
  );
}
