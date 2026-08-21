import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import { getDashboardSummary } from "@/lib/dashboard";
import { getRaidRoom } from "@/lib/raids";
import RaidBoard from "./raid-board";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Raid Operations · Blues Brothers",
  description: "Raid tickets, readiness and recent raid results for the Blues Brothers guild.",
};

export default async function RaidsPage() {
  const [summary, raidRoom] = await Promise.all([getDashboardSummary(), getRaidRoom()]);
  const progress = summary.live && summary.ticketTarget
    ? Math.min(100, Math.round((summary.dailyTickets / summary.ticketTarget) * 100))
    : 0;
  const capturedLabel = raidRoom.capturedAt
    ? new Date(raidRoom.capturedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Awaiting first sync";

  return (
    <main className="intel-shell destination-shell mission-shell">
      <PageHero
        image="/raid-banner.webp"
        imageAlt="The Blues Brothers coordinating a guild raid against a giant creature"
        eyebrow="Raid operations"
        title={<>Bring the right teams.<br /><em>Hit the right notes.</em></>}
        description="Ticket pace is live from the guild roster. Below that, the last completed attempt for each raid the guild runs — pulled straight from Comlink, no simmed or invented data."
        priority
        syncLabel={`Raid operations · Captured ${capturedLabel}`}
      >
        <div className="intel-summary">
          <div><strong>{summary.live ? summary.dailyTickets.toLocaleString("en-GB") : "—"}</strong><small>daily tickets</small></div>
          <div><strong>{summary.ticketTarget.toLocaleString("en-GB")}</strong><small>ticket target</small></div>
          <div><strong>{summary.live ? progress : "—"}<span>{summary.live ? "%" : ""}</span></strong><small>target reached</small></div>
        </div>
      </PageHero>

      <section className="mission-prep-grid" aria-label="Raid planning areas">
        <article><span>01</span><h2>Ticket pace</h2><p>Keep the daily guild target visible and identify a shortfall early enough for a useful reminder.</p><strong>Live baseline</strong></article>
        <article><span>02</span><h2>Team readiness</h2><p>Compare recommended raid teams against the full profiles already rotating through guild sync.</p><strong>Roster pass next</strong></article>
        <article><span>03</span><h2>Attempts &amp; scores</h2><p>The last completed attempt for each raid, ranked by member damage contribution.</p><strong>{raidRoom.raids.length ? "Live" : "Awaiting a completed raid"}</strong></article>
      </section>

      <section className="tw-roster-section">
        <header>
          <div><p className="eyebrow">Recent results</p><h2>Who carried the raid</h2></div>
          <p>Damage figures come from Comlink&apos;s per-raid member contribution field. Only the most recent completed attempt per raid is available — live in-progress standings are not exposed outside the guild&apos;s own account.</p>
        </header>
        {raidRoom.raids.length ? (
          <RaidBoard raids={raidRoom.raids} />
        ) : (
          <div className="tw-empty"><strong>No completed raid captured yet.</strong><p>This board fills in as soon as a raid finishes and the next hourly sync runs.</p></div>
        )}
      </section>

      <aside className="tw-data-note">
        <strong>What this board knows</strong>
        <p>SWGOH&apos;s public Comlink guild data does not expose live raid progress (<code>raidStatus</code>) to tools outside the guild&apos;s own account — only <code>recentRaidResult</code>, the last completed attempt per raid, is available. That&apos;s what powers this board. Live in-progress leaderboards and multi-attempt history aren&apos;t possible without deeper account access.</p>
      </aside>

      <footer className="intel-footer"><span>Raid operations now surface real results, not just ticket pace.</span><Link href="/operations">Back to Operations →</Link></footer>
    </main>
  );
}
