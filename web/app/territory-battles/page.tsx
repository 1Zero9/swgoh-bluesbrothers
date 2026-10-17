import MembersOnly from "@/app/members-only";
import { canViewMembersArea } from "@/lib/member-gate";
import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
import { getDashboardSummary } from "@/lib/dashboard";
import { getRosterMembers } from "@/lib/members";
import { isOfficerRequest } from "@/lib/officer-session";
import { getOfficerIdentity } from "@/lib/officer-identity";
import {
  ensureBuiltInCommands,
  getCurrentTbEventId,
  getActiveTbPlanDetail,
  getDefaultGuildId,
  getOrCreateActiveTbPlan,
  getTbPlanDetail,
  listCommands,
} from "@/lib/tw-plans";
import { calloutHeadline, getCalloutUnitOptions, listCallouts } from "@/lib/tb-callouts";
import LinkNudge from "@/app/link-nudge";
import TbCallouts from "./tb-callouts";
import TbPlanner from "./tb-planner";
import TbPlanView from "./tb-plan-view";
import TbWorkspace, { type PlanetStrategy, type TbWorkspacePlan } from "./tb-workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Territory Battles · Blues Brothers",
  description: "Rise of the Empire (ROTE) star optimizer and deployment allocation strategy planner.",
};

/** Discord ids stay on the server; the browser only needs names and levels. */
function publicMember(member: { name: string; stars: number; relic: number; gap: string }) {
  return { name: member.name, stars: member.stars, relic: member.relic, gap: member.gap };
}

function power(value: bigint) {
  const amount = Number(value);
  return amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(1)}M` : amount.toLocaleString("en-GB");
}

export default async function TerritoryBattlesPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/territory-battles" area="Territory Battles" />;
  const isOfficer = await isOfficerRequest();
  // Only officers use the planner, so members don't pay for loading every roster.
  const [summary, members] = await Promise.all([
    getDashboardSummary(),
    isOfficer ? getRosterMembers() : Promise.resolve([]),
  ]);

  const totalCharacterGp = members.reduce((sum, m) => sum + m.characterPower, BigInt(0));
  const totalShipGp = members.reduce((sum, m) => sum + m.shipPower, BigInt(0));

  const [callouts, calloutUnits] = await Promise.all([listCallouts(), isOfficer ? getCalloutUnitOptions() : Promise.resolve([])]);
  const calloutCards = callouts.map((callout) => ({
    id: callout.id,
    headline: calloutHeadline(callout),
    unitName: callout.unitName,
    needed: callout.needed,
    note: callout.note,
    status: callout.status,
    createdBy: callout.createdBy,
    createdLabel: callout.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }),
    progress: {
      ...callout.progress,
      ready: callout.progress.ready.map(publicMember),
      close: callout.progress.close.map(publicMember),
    },
  }));

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

  // What members see: the plan officers have marked Active, if any.
  const sharedGuildId = await getDefaultGuildId();
  const sharedPlan = sharedGuildId ? await getActiveTbPlanDetail(sharedGuildId, await getCurrentTbEventId()) : null;
  const sharedPlanets = (sharedPlan?.planetPlans ?? [])
    .filter((planet) => planet.strategy !== "SKIP")
    .map((planet) => ({
      id: planet.id,
      planetName: planet.planetName,
      phase: planet.phase,
      strategy: planet.strategy as PlanetStrategy,
      commandId: planet.commandId,
      command: planet.command
        ? { id: planet.command.id, name: planet.command.name, squadKey: planet.command.squadKey, kitNotes: planet.command.kitNotes, isBuiltIn: planet.command.isBuiltIn }
        : null,
      note: planet.note,
      priority: planet.priority,
      updatedBy: planet.updatedBy,
    }));

  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Territory Battles" title="See the whole field. Deploy with purpose." intro="What the guild needs from you in Rise of the Empire, and the plan for each phase." />
      <div className="hub-stats">
        <div className="intel-summary">
          <div><strong>{summary.live ? summary.memberCount : "—"}<span>/{summary.capacity}</span></strong><small>active members</small></div>
          <div><strong>{summary.live ? power(summary.guildPower) : "—"}</strong><small>guild power</small></div>
        </div>
      </div>

      <section className="tb-section" id="callouts">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Callouts</p>
            <h2>What the guild needs from you</h2>
          </div>
          <span>Matched against live member rosters</span>
        </div>
        <LinkNudge reason="Link your account and a callout can tag you when you are one of the closest to ready." />
        <TbCallouts callouts={calloutCards} units={calloutUnits} isOfficer={isOfficer} />
      </section>

      {sharedPlanets.length ? (
        <section className="tb-section margin-top-20" id="plan">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The plan</p>
              <h2>What we are doing, phase by phase</h2>
            </div>
          </div>
          <TbPlanView name={sharedPlan?.name ?? "Territory Battle plan"} planets={sharedPlanets} />
        </section>
      ) : null}

      {isOfficer ? (
        <details className="tb-section margin-top-20 tb-officer-tools">
          <summary>Officer planning tools</summary>
          <p className="tb-officer-note">The star calculator and the per-planet plan. Mark the plan Active and members see it above.</p>
      <section className="tb-section margin-top-20">
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

        </details>
      ) : null}

      <HubLinks message="Territory Battle allocations are calculated using synced guild snapshots.">
        <Link href="/operations">Back to Operations →</Link>
      </HubLinks>
    </HubPage>
  );
}
