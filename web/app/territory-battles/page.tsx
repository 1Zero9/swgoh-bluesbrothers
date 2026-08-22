import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import { getDashboardSummary } from "@/lib/dashboard";
import { getRosterMembers } from "@/lib/members";
import TbPlanner from "./tb-planner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Territory Battles · Blues Brothers",
  description: "Rise of the Empire (ROTE) star optimizer and deployment allocation strategy planner.",
};

function power(value: bigint) {
  const amount = Number(value);
  return amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(1)}M` : amount.toLocaleString("en-GB");
}

export default async function TerritoryBattlesPage() {
  const [summary, members] = await Promise.all([
    getDashboardSummary(),
    getRosterMembers(),
  ]);

  const totalCharacterGp = members.reduce((sum, m) => sum + m.characterPower, BigInt(0));
  const totalShipGp = members.reduce((sum, m) => sum + m.shipPower, BigInt(0));

  return (
    <main className="intel-shell destination-shell mission-shell">
      <PageHero
        image="/tw-banner.webp"
        imageAlt="The Blues Brothers and guild officers studying a holographic Territory Battle map"
        eyebrow="Territory Battles"
        title={<>See the whole field.<br /><em>Deploy with purpose.</em></>}
        description="Optimize stars in Rise of the Empire. Auto-allocate GP targets, adjust zone star thresholds, calculate pre-loads, and compile direct copy-paste instructions for Discord."
        priority
      >
        <div className="intel-summary">
          <div><strong>{summary.live ? summary.memberCount : "—"}<span>/{summary.capacity}</span></strong><small>active members</small></div>
          <div><strong>{summary.live ? power(summary.guildPower) : "—"}</strong><small>guild power</small></div>
          <div><strong>ROTE</strong><small>planning focus</small></div>
        </div>
      </PageHero>

      <section className="tb-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Rise of the Empire</p>
            <h2>Interactive ROTE Planner &amp; Star Optimizer</h2>
          </div>
          <span>Syncing from {members.length} player profiles</span>
        </div>
        
        {members.length > 0 ? (
          <TbPlanner
            members={members}
            initialCharacterGp={totalCharacterGp}
            initialShipGp={totalShipGp}
          />
        ) : (
          <div className="tw-empty">
            <strong>No active roster sync found.</strong>
            <p>Roster profiles must be synced at least once to populate the GP optimizer baseline.</p>
          </div>
        )}
      </section>

      <aside className="tw-data-note margin-top-20">
        <strong>Comlink TB Data Boundaries</strong>
        <p>
          SWGOH&apos;s public Comlink guild data only returns completed-run star results from past events.
          To bypass this constraint, this tool utilizes the latest database snapshot of your members&apos;
          ground and fleet powers to calculate active deployment strategies. Target stars are calculated in
          millions (M) based on standard Rise of the Empire zone thresholds.
        </p>
      </aside>

      <footer className="intel-footer">
        <span>Territory Battle allocations are calculated using synced guild snapshots.</span>
        <Link href="/operations">Back to Operations →</Link>
      </footer>
    </main>
  );
}
