import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardSummary } from "@/lib/dashboard";
import { getTerritoryWarRoom } from "@/lib/territory-war";

export const dynamic = "force-dynamic";
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
      <header className="intel-header">
        <Link href="/" className="intel-back">← Guild command</Link>
        <nav aria-label="Related destinations"><Link href="/members">Members</Link><Link href="/cantina">Cantina</Link></nav>
      </header>
      <section className="intel-hero destination-hero operations-hero">
        <p className="eyebrow">Guild operations</p>
        <h1>Every mission.<br /><em>One launch deck.</em></h1>
        <p>Territory War, Territory Battle, raids and roster intelligence now live together here instead of competing for space on the homepage.</p>
        <div className="operation-quicklinks" aria-label="Operation shortcuts">
          <Link href="/territory-war"><span>TW</span><strong>Territory War</strong></Link>
          <a href="#territory-battles"><span>TB</span><strong>Territory Battles</strong></a>
          <a href="#raids"><span>RD</span><strong>Raids</strong></a>
          <Link href="/arsenal"><span>AR</span><strong>Guild Arsenal</strong></Link>
        </div>
      </section>

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
          <header><span>Territory Battle</span><i>Next build</i></header>
          <div className="operation-mark">TB</div>
          <h2>Rise of the Empire</h2>
          <p>Deployments, operations, combat missions and platoon assignments will land here as the next dedicated operations tool.</p>
          <dl><div><dt>Roster</dt><dd>{summary.live ? summary.memberCount : "—"}</dd></div><div><dt>Guild GP</dt><dd>{summary.live ? power(summary.guildPower) : "—"}</dd></div></dl>
          <span className="operation-pending">Planner route reserved</span>
        </article>

        <article className="operation-card" id="raids">
          <header><span>Raid operations</span><i>Next build</i></header>
          <div className="operation-mark">RD</div>
          <h2>Raid readiness</h2>
          <p>Attempts, personal score history and team readiness will move onto their own page as raid tracking comes online.</p>
          <dl><div><dt>Tickets</dt><dd>{summary.live ? summary.dailyTickets.toLocaleString("en-GB") : "—"}</dd></div><div><dt>Target</dt><dd>{summary.ticketTarget.toLocaleString("en-GB")}</dd></div></dl>
          <span className="operation-pending">Raid route reserved</span>
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
