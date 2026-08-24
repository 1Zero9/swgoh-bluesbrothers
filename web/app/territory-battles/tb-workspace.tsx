"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OfficerRosterLogin from "@/app/officer-roster-login";
import { ROTE_PLANNER_DATA } from "@/lib/territory-battles";
import type { CommandSummary } from "@/lib/tw-view";

export type PlanetStrategy = "PRELOAD" | "THREE_STAR" | "HOLD" | "SKIP";

export type PersistedPlanetPlan = {
  id: string;
  planetName: string;
  phase: number;
  strategy: PlanetStrategy;
  commandId: string | null;
  command: CommandSummary | null;
  note: string | null;
  priority: number;
  updatedBy: string | null;
};

export type TbWorkspacePlan = {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  planetPlans: PersistedPlanetPlan[];
};

const STRATEGY_OPTIONS: { value: PlanetStrategy; label: string; hint: string }[] = [
  { value: "PRELOAD", label: "Pre-load", hint: "Bank early deployments before the phase opens to guarantee stars." },
  { value: "THREE_STAR", label: "Push 3★", hint: "Commit GP to fully 3-star this zone this phase." },
  { value: "HOLD", label: "Hold", hint: "Wait — let stronger rosters or a later phase cover it." },
  { value: "SKIP", label: "Skip", hint: "Not worth deployment this event." },
];

function strategyClass(strategy: string) {
  switch (strategy) {
    case "PRELOAD":
      return "is-preload";
    case "THREE_STAR":
      return "is-three-star";
    case "HOLD":
      return "is-hold";
    default:
      return "is-skip";
  }
}

export default function TbWorkspace({
  isOfficer,
  plan: initialPlan,
  commands,
}: {
  isOfficer: boolean;
  plan: TbWorkspacePlan | null;
  commands: CommandSummary[];
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [syncedPlan, setSyncedPlan] = useState(initialPlan);
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [newPlanetName, setNewPlanetName] = useState("");
  const [newStrategy, setNewStrategy] = useState<PlanetStrategy>("PRELOAD");
  const [newCommandId, setNewCommandId] = useState("");

  if (initialPlan !== syncedPlan) {
    setSyncedPlan(initialPlan);
    setPlan(initialPlan);
  }

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
          <p className="eyebrow">Territory Battle command tool</p>
          <h2>Officer sign-in required</h2>
          <p>Per-planet, per-day strategy calls (pre-load, push for 3★, hold or skip) and Command assignments live behind the officer gate.</p>
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
  const phases = ROTE_PLANNER_DATA.map((p) => p.phase);
  const currentPhaseData = ROTE_PLANNER_DATA.find((p) => p.phase === selectedPhase);
  const planetsInPhase = plan.planetPlans.filter((p) => p.phase === selectedPhase).sort((a, b) => a.priority - b.priority);
  const usedNames = new Set(planetsInPhase.map((p) => p.planetName));
  const suggestions = currentPhaseData?.zones.filter((z) => !usedNames.has(z.name)) ?? [];

  return (
    <section className="twc-shell tbc-shell" aria-label="Territory Battle command tool">
      <header className="twc-header">
        <div>
          <p className="eyebrow">Territory Battle command tool</p>
          <h2>{plan.name}</h2>
          <p className="twc-plan-meta">
            <span className={`twc-status-pill twc-status-${plan.status.toLowerCase()}`}>{plan.status}</span>
          </p>
        </div>
        <div className="twc-header-actions">
          <select
            value={plan.status}
            disabled={busy}
            onChange={(event) => callApi("/api/officer/tb/plan", "PATCH", { planId, status: event.target.value }).catch(() => {})}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </header>

      {banner ? <p className={`twc-banner twc-banner-${banner.tone}`}>{banner.text}</p> : null}

      <nav className="twc-tabs" aria-label="Territory Battle phases">
        {phases.map((phase) => {
          const count = plan.planetPlans.filter((p) => p.phase === phase).length;
          return (
            <button
              key={phase}
              type="button"
              className={phase === selectedPhase ? "is-active" : ""}
              onClick={() => setSelectedPhase(phase)}
            >
              Day {phase}
              {count ? <span className="twc-tab-badge">{count}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="tbc-body">
        <div className="tbc-planet-list">
          {planetsInPhase.length ? (
            planetsInPhase.map((planetPlan) => (
              <article key={planetPlan.id} className="tbc-planet-row">
                <header>
                  <strong>{planetPlan.planetName}</strong>
                  <span className={`tbc-strategy-pill ${strategyClass(planetPlan.strategy)}`}>
                    {STRATEGY_OPTIONS.find((s) => s.value === planetPlan.strategy)?.label ?? planetPlan.strategy}
                  </span>
                </header>
                <div className="tbc-planet-row-controls">
                  <label>
                    <span>Strategy</span>
                    <select
                      value={planetPlan.strategy}
                      disabled={busy}
                      onChange={(event) =>
                        callApi("/api/officer/tb/planets", "PATCH", {
                          id: planetPlan.id,
                          planId,
                          planetName: planetPlan.planetName,
                          phase: planetPlan.phase,
                          strategy: event.target.value,
                          commandId: planetPlan.commandId,
                          note: planetPlan.note,
                          priority: planetPlan.priority,
                        }).catch(() => {})
                      }
                    >
                      {STRATEGY_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Command</span>
                    <select
                      value={planetPlan.commandId ?? ""}
                      disabled={busy}
                      onChange={(event) =>
                        callApi("/api/officer/tb/planets", "PATCH", {
                          id: planetPlan.id,
                          planId,
                          planetName: planetPlan.planetName,
                          phase: planetPlan.phase,
                          strategy: planetPlan.strategy,
                          commandId: event.target.value || null,
                          note: planetPlan.note,
                          priority: planetPlan.priority,
                        }).catch(() => {})
                      }
                    >
                      <option value="">No command set</option>
                      {commands.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="tbc-note-field">
                    <span>Note</span>
                    <input
                      type="text"
                      defaultValue={planetPlan.note ?? ""}
                      disabled={busy}
                      placeholder="e.g. hold GP until Day 3 confirms lane"
                      onBlur={(event) => {
                        if (event.target.value === (planetPlan.note ?? "")) return;
                        callApi("/api/officer/tb/planets", "PATCH", {
                          id: planetPlan.id,
                          planId,
                          planetName: planetPlan.planetName,
                          phase: planetPlan.phase,
                          strategy: planetPlan.strategy,
                          commandId: planetPlan.commandId,
                          note: event.target.value.trim() || null,
                          priority: planetPlan.priority,
                        }).catch(() => {});
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="twc-icon-btn twc-danger"
                    disabled={busy}
                    onClick={() => callApi("/api/officer/tb/planets", "DELETE", { id: planetPlan.id }).catch(() => {})}
                  >
                    Remove
                  </button>
                </div>
                {planetPlan.updatedBy ? <small className="twc-attribution">by {planetPlan.updatedBy}</small> : null}
              </article>
            ))
          ) : (
            <div className="tw-empty">
              <strong>No planets planned for Day {selectedPhase} yet.</strong>
              <p>Add one below — pick a zone, a strategy, and optionally a Command.</p>
            </div>
          )}
        </div>

        <form
          className="tbc-add-planet"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newPlanetName.trim()) return;
            callApi("/api/officer/tb/planets", "POST", {
              planId,
              planetName: newPlanetName.trim(),
              phase: selectedPhase,
              strategy: newStrategy,
              commandId: newCommandId || null,
              priority: planetsInPhase.length,
            })
              .then(() => {
                setNewPlanetName("");
                setNewStrategy("PRELOAD");
                setNewCommandId("");
              })
              .catch(() => {});
          }}
        >
          <label>
            <span>Planet / zone</span>
            <input
              type="text"
              list="tbc-planet-suggestions"
              value={newPlanetName}
              onChange={(event) => setNewPlanetName(event.target.value)}
              placeholder="e.g. Mustafar (Dark Side)"
              disabled={busy}
            />
            <datalist id="tbc-planet-suggestions">
              {suggestions.map((z) => (
                <option key={z.id} value={z.name} />
              ))}
            </datalist>
          </label>
          <label>
            <span>Strategy</span>
            <select value={newStrategy} disabled={busy} onChange={(event) => setNewStrategy(event.target.value as PlanetStrategy)}>
              {STRATEGY_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Command</span>
            <select value={newCommandId} disabled={busy} onChange={(event) => setNewCommandId(event.target.value)}>
              <option value="">No command set</option>
              {commands.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={busy || !newPlanetName.trim()}>
            Add to Day {selectedPhase}
          </button>
        </form>

        <p className="tbc-strategy-legend">
          {STRATEGY_OPTIONS.map((s) => (
            <span key={s.value}>
              <strong>{s.label}:</strong> {s.hint}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
