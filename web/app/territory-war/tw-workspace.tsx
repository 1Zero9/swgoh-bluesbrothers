"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OfficerRosterLogin from "@/app/officer-roster-login";
import {
  computeOffenceReserve,
  computeWorkload,
  detectWarnings,
  generateRecommendations,
  type EligiblePlayer,
  type Recommendation,
} from "@/lib/tw-planning-engine";
import {
  buildAssignmentRecords,
  buildEffectiveZones,
  type CommandSummary,
  type PersistedAssignment,
  type PersistedAttackAssignment,
  type PersistedZonePlan,
} from "@/lib/tw-view";
import type { SquadKey } from "@/lib/tw-squads";
import TwPrepare from "./tw-prepare";
import TwDefence from "./tw-defence";
import TwMatchup from "./tw-matchup";
import TwAttack from "./tw-attack";
import TwWorkload from "./tw-workload";
import TwDiscordExport from "./tw-discord-export";
import TwTemplates, { type StrategyTemplateSummary } from "./tw-templates";
import { isStrategyTemplateRules } from "@/lib/tw-planning-engine";

export type WorkspacePlan = {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: number;
  templateId: string | null;
  zonePlans: PersistedZonePlan[];
  assignments: PersistedAssignment[];
  attackAssignments: PersistedAttackAssignment[];
};

export type WarMatchupSummary = {
  active: boolean;
  opponentName: string | null;
  guildScore: number;
  opponentScore: number;
  round: number | null;
};

type Mode = "prepare" | "matchup" | "defence" | "attack" | "workload" | "discord" | "templates";

const MODES: { id: Mode; label: string }[] = [
  { id: "prepare", label: "Prepare" },
  { id: "matchup", label: "Match-up" },
  { id: "defence", label: "Defence" },
  { id: "attack", label: "Attack" },
  { id: "workload", label: "Workload" },
  { id: "discord", label: "Discord" },
  { id: "templates", label: "Templates" },
];

export default function TwWorkspace({
  isOfficer,
  plan: initialPlan,
  pool,
  war,
  templates,
  commands: initialCommands,
}: {
  isOfficer: boolean;
  plan: WorkspacePlan | null;
  pool: EligiblePlayer[];
  war: WarMatchupSummary;
  templates: StrategyTemplateSummary[];
  commands: CommandSummary[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("defence");
  const [plan, setPlan] = useState(initialPlan);
  const [syncedPlan, setSyncedPlan] = useState(initialPlan);
  const [commands, setCommands] = useState(initialCommands);
  const [syncedCommands, setSyncedCommands] = useState(initialCommands);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  if (initialPlan !== syncedPlan) {
    setSyncedPlan(initialPlan);
    setPlan(initialPlan);
  }
  if (initialCommands !== syncedCommands) {
    setSyncedCommands(initialCommands);
    setCommands(initialCommands);
  }

  const zones = useMemo(() => buildEffectiveZones(plan?.zonePlans ?? [], pool), [plan, pool]);
  const assignments = useMemo(
    () => buildAssignmentRecords(plan?.zonePlans ?? [], plan?.assignments ?? []),
    [plan]
  );
  const warnings = useMemo(() => detectWarnings(zones, assignments, pool), [zones, assignments, pool]);
  const offenceReserve = useMemo(() => computeOffenceReserve(pool, assignments), [pool, assignments]);
  const workload = useMemo(() => computeWorkload(pool, assignments), [pool, assignments]);
  const activeTemplate = templates.find((t) => t.id === plan?.templateId) ?? null;
  const templateRules = activeTemplate && isStrategyTemplateRules(activeTemplate.rules) ? activeTemplate.rules : undefined;
  const recommendationsPreview = useMemo<Recommendation[]>(
    () => generateRecommendations(pool, zones, assignments, templateRules),
    [pool, zones, assignments, templateRules]
  );

  async function callApi(url: string, method: string, body: unknown) {
    setBusy(true);
    setBanner(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `Request failed (${response.status})`);
      }
      router.refresh();
      return json;
    } catch (error) {
      setBanner({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong" });
      throw error;
    } finally {
      setBusy(false);
    }
  }

  if (!isOfficer) {
    return (
      <section className="twc-shell twc-gate">
        <header className="twc-gate-header">
          <p className="eyebrow">Territory War command tool</p>
          <h2>Officer sign-in required</h2>
          <p>
            Zone assignments, recommendations, the offence reserve, attack tracking and Discord hand-off live
            behind the officer gate. Everyone can still see the live registration and battle map above.
          </p>
        </header>
        <OfficerRosterLogin />
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="twc-shell">
        <div className="tw-empty">
          <strong>No guild on record yet.</strong>
          <p>The command tool activates once the first guild sync has run.</p>
        </div>
      </section>
    );
  }

  const planId = plan.id;

  return (
    <section className="twc-shell" aria-label="Territory War command tool">
      <header className="twc-header">
        <div>
          <p className="eyebrow">Territory War command tool</p>
          <h2>{plan.name}</h2>
          <p className="twc-plan-meta">
            <span className={`twc-status-pill twc-status-${plan.status.toLowerCase()}`}>{plan.status}</span>
            <span>Version {plan.version}</span>
            <span>{war.active ? `Live · Round ${war.round ?? "—"}` : "No active war"}</span>
          </p>
        </div>
        <div className="twc-header-actions">
          <select
            value={plan.status}
            disabled={busy}
            onChange={(event) => callApi("/api/officer/tw/plan", "PATCH", { planId, status: event.target.value }).catch(() => {})}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const name = window.prompt("Name for the cloned plan?", `${plan.name} copy`);
              if (!name?.trim()) return;
              callApi("/api/officer/tw/plan", "POST", { action: "clone", planId, name: name.trim() }).catch(() => {});
            }}
          >
            Clone as new version
          </button>
        </div>
      </header>

      {banner ? <p className={`twc-banner twc-banner-${banner.tone}`}>{banner.text}</p> : null}

      <nav className="twc-tabs" aria-label="Command tool modes">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={mode === item.id ? "is-active" : ""}
            onClick={() => setMode(item.id)}
          >
            {item.label}
            {item.id === "defence" && warnings.filter((w) => w.level === "error").length > 0 ? (
              <span className="twc-tab-badge">{warnings.filter((w) => w.level === "error").length}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {mode === "prepare" ? (
        <TwPrepare
          zones={zones}
          pool={pool}
          busy={busy}
          onUpsertZone={(zoneId, updates) => callApi("/api/officer/tw/zones", "PATCH", { planId, zoneId, ...updates }).catch(() => {})}
        />
      ) : null}

      {mode === "matchup" ? <TwMatchup war={war} zones={zones} assignments={assignments} /> : null}

      {mode === "defence" ? (
        <TwDefence
          zones={zones}
          assignments={assignments}
          pool={pool}
          warnings={warnings}
          offenceReserve={offenceReserve}
          recommendationsPreview={recommendationsPreview}
          commands={commands}
          busy={busy}
          onCreateAssignment={(zoneId, playerId, squadKey) =>
            callApi("/api/officer/tw/assignments", "POST", { planId, zoneId, playerId, squadKey }).catch(() => {})
          }
          onUpdateAssignment={(id, updates) => callApi("/api/officer/tw/assignments", "PATCH", { id, planId, ...updates }).catch(() => {})}
          onDeleteAssignment={(id) => callApi("/api/officer/tw/assignments", "DELETE", { id }).catch(() => {})}
          onApplyRecommendations={() =>
            callApi("/api/officer/tw/recommendations", "POST", { planId, recommendations: recommendationsPreview }).catch(() => {})
          }
          onAssignCommand={(zoneId, commandId) =>
            callApi("/api/officer/tw/zones", "PATCH", { planId, zoneId, commandId }).catch(() => {})
          }
          onCreateCommand={(input) => callApi("/api/officer/tw/commands", "POST", input).catch(() => {})}
          onDeleteCommand={(id) => callApi("/api/officer/tw/commands", "DELETE", { id }).catch(() => {})}
        />
      ) : null}

      {mode === "attack" ? (
        <TwAttack
          attackAssignments={plan.attackAssignments}
          pool={pool}
          busy={busy}
          onUpsertAttack={(input) => callApi("/api/officer/tw/attack", "POST", { planId, ...input }).catch(() => {})}
          onDeleteAttack={(id) => callApi("/api/officer/tw/attack", "DELETE", { id }).catch(() => {})}
        />
      ) : null}

      {mode === "workload" ? <TwWorkload workload={workload} pool={pool} assignedPlayerIds={assignments.map((a) => a.playerId)} /> : null}

      {mode === "discord" ? (
        <TwDiscordExport
          planName={plan.name}
          zones={zones}
          assignments={assignments}
          pool={pool}
          busy={busy}
          onPostToDiscord={(title, message) => callApi("/api/officer/tw/discord", "POST", { title, message })}
        />
      ) : null}

      {mode === "templates" ? (
        <TwTemplates
          templates={templates}
          activeTemplateId={plan.templateId}
          busy={busy}
          onCreate={(input) => callApi("/api/officer/tw/templates", "POST", input).catch(() => {})}
          onUpdate={(id, input) => callApi("/api/officer/tw/templates", "PATCH", { id, ...input }).catch(() => {})}
          onDelete={(id) => callApi("/api/officer/tw/templates", "DELETE", { id }).catch(() => {})}
          onApply={(templateId) => callApi("/api/officer/tw/templates", "PATCH", { planId, templateId }).catch(() => {})}
        />
      ) : null}
    </section>
  );
}

export type { EligiblePlayer, SquadKey };
