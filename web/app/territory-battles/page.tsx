import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import { getDashboardSummary } from "@/lib/dashboard";
import { getRosterMembers } from "@/lib/members";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getOfficerIdentity } from "@/lib/officer-identity";
import {
  ensureBuiltInCommands,
  getCurrentTbEventId,
  getDefaultGuildId,
  getOrCreateActiveTbPlan,
  getTbPlanDetail,
  listCommands,
} from "@/lib/tw-plans";
import TbPlanner from "./tb-planner";
import TbWorkspace, { type TbWorkspacePlan } from "./tb-workspace";

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

  const store = await cookies();
  const isOfficer = verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);

  let tbPlan: TbWorkspacePlan | null = null;
  let commands: import("@/lib/tw-view").CommandSummary[] = [];
  if (isOfficer) {
    const guildId = await getDefaultGuildId();
    if (guildId) {
      const eventId = await getCurrentTbEventId();
      const officer = await getOfficerIdentity();
      await ensureBuiltInCommands(guildId);
      const record = await getOrCreateActiveTbPlan(guildId, eventId, "Territory Battle plan", officer);
      const [detail, commandRecords] = await Promise.all([
        getTbPlanDetail(record.id),
        listCommands(guildId),
      ]);
      commands = commandRecords.map((c) => ({
        id: c.id,
        name: c.name,
        squadKey: c.squadKey,
        kitNotes: c.kitNotes,
        isBuiltIn: c.isBuiltIn,
      }));
      if (detail) {
        tbPlan = {
          id: detail.id,
          name: detail.name,
          status: detail.status,
          planetPlans: detail.planetPlans.map((p) => ({
            id: p.id,
            planetName: p.planetName,
            phase: p.phase,
            strategy: p.strategy,
            commandId: p.commandId,
            command: p.command
              ? {
                  id: p.command.id,
                  name: p.command.name,
                  squadKey: p.command.squadKey,
                  kitNotes: p.command.kitNotes,
                  isBuiltIn: p.command.isBuiltIn,
                }
              : null,
            note: p.note,
            priority: p.priority,
            updatedBy: p.updatedBy,
          })),
        };
      }
    }
  }

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

      <section className="tb-section margin-top-20">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Officer planning</p>
            <h2>Territory Battle command tool</h2>
          </div>
          <span>Per-planet, per-day strategy and squad calls</span>
        </div>
        <TbWorkspace isOfficer={isOfficer} plan={tbPlan} commands={commands} />
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

      <IntelFooter message="Territory Battle allocations are calculated using synced guild snapshots.">
        <Link href="/operations">Back to Operations →</Link>
      </IntelFooter>
    </main>
  );
}
