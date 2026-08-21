import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import SiteHeader from "@/app/site-header";
import { getDashboardSummary } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Raid Operations · Blues Brothers",
  description: "Raid tickets, readiness and score planning for the Blues Brothers guild.",
};

export default async function RaidsPage() {
  const summary = await getDashboardSummary();
  const progress = summary.live && summary.ticketTarget
    ? Math.min(100, Math.round((summary.dailyTickets / summary.ticketTarget) * 100))
    : 0;
  return (
    <main className="intel-shell destination-shell mission-shell">
      <SiteHeader />
      <PageHero
        image="/raid-banner.png"
        imageAlt="The Blues Brothers coordinating a guild raid against a giant creature"
        eyebrow="Raid operations"
        title={<>Bring the right teams.<br /><em>Hit the right notes.</em></>}
        description="The dedicated home for ticket pace, team readiness, attempts and personal score history as raid tracking comes online."
        priority
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
        <article><span>03</span><h2>Attempts &amp; scores</h2><p>Retain personal attempts and score history so officers can plan from evidence rather than screenshots.</p><strong>Event tracking next</strong></article>
      </section>
      <aside className="tw-data-note"><strong>Current data boundary</strong><p>Ticket totals are live from the latest guild capture. Raid-instance, attempt and score history will populate here after raid event normalization is added to the existing event-snapshot pipeline.</p></aside>
      <footer className="intel-footer"><span>Raid operations now have a dedicated destination.</span><Link href="/operations">Back to Operations →</Link></footer>
    </main>
  );
}
