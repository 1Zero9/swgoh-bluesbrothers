import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import { getDashboardSummary } from "@/lib/dashboard";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Territory Battles · Blues Brothers",
  description: "Territory Battle readiness and planning for the Blues Brothers guild.",
};

function power(value: bigint) {
  const amount = Number(value);
  return amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(1)}M` : amount.toLocaleString("en-GB");
}

export default async function TerritoryBattlesPage() {
  const summary = await getDashboardSummary();
  return (
    <main className="intel-shell destination-shell mission-shell">
      <PageHero
        image="/tw-banner.webp"
        imageAlt="The Blues Brothers and guild officers studying a holographic Territory Battle map"
        eyebrow="Territory Battles"
        title={<>See the whole field.<br /><em>Deploy with purpose.</em></>}
        description="The dedicated home for deployments, operations, combat missions and platoon planning as Territory Battle tracking comes online."
        priority
      >
        <div className="intel-summary">
          <div><strong>{summary.live ? summary.memberCount : "—"}<span>/{summary.capacity}</span></strong><small>active members</small></div>
          <div><strong>{summary.live ? power(summary.guildPower) : "—"}</strong><small>guild power</small></div>
          <div><strong>ROTE</strong><small>planning focus</small></div>
        </div>
      </PageHero>
      <section className="mission-prep-grid" aria-label="Territory Battle planning areas">
        <article><span>01</span><h2>Deployments</h2><p>Track the remaining guild power and make the final deployment call without burying it in chat.</p><strong>Planner groundwork</strong></article>
        <article><span>02</span><h2>Operations</h2><p>Turn platoon requirements into member assignments with missing-unit visibility and clear ownership.</p><strong>Assignments next</strong></article>
        <article><span>03</span><h2>Combat missions</h2><p>Keep phase instructions, recommended teams and completion reporting beside the live plan.</p><strong>Mission board next</strong></article>
      </section>
      <aside className="tw-data-note"><strong>Current data boundary</strong><p>Unlike Territory War, SWGOH&apos;s public Comlink guild data does not expose live Territory Battle status, phases or platoons (<code>territoryBattleStatus</code>/<code>territoryBattleResult</code>) outside the guild&apos;s own account — only completed-run star counts show up, and only for the single best attempt in the last 60 days. This destination stays a live guild baseline until that changes or a member-side data source is added.</p></aside>
      <footer className="intel-footer"><span>Territory Battle planning now has room to grow.</span><Link href="/operations">Back to Operations →</Link></footer>
    </main>
  );
}
