"use client";

import { useMemo, useState } from "react";
import { SQUAD_DEFINITIONS, SQUAD_KEYS, type SquadKey } from "@/lib/tw-squads";
import type {
  AssignmentRecord,
  EligiblePlayer,
  OffenceReserve,
  PlanWarning,
  Recommendation,
} from "@/lib/tw-planning-engine";
import type { EffectiveZone } from "@/lib/tw-view";

export default function TwDefence({
  zones,
  assignments,
  pool,
  warnings,
  offenceReserve,
  recommendationsPreview,
  busy,
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onApplyRecommendations,
}: {
  zones: EffectiveZone[];
  assignments: AssignmentRecord[];
  pool: EligiblePlayer[];
  warnings: PlanWarning[];
  offenceReserve: OffenceReserve;
  recommendationsPreview: Recommendation[];
  busy: boolean;
  onCreateAssignment: (zoneId: number, playerId: string, squadKey: SquadKey) => void;
  onUpdateAssignment: (id: string, updates: Record<string, unknown>) => void;
  onDeleteAssignment: (id: string) => void;
  onApplyRecommendations: () => void;
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.zoneId ?? 1);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newSquadKey, setNewSquadKey] = useState<SquadKey>(SQUAD_KEYS[0]);

  const playerById = useMemo(() => new Map(pool.map((p) => [p.playerId, p])), [pool]);
  const warningsByZone = useMemo(() => {
    const map = new Map<number, PlanWarning[]>();
    for (const w of warnings) {
      if (w.zoneId === undefined) continue;
      const list = map.get(w.zoneId) ?? [];
      list.push(w);
      map.set(w.zoneId, list);
    }
    return map;
  }, [warnings]);

  const selectedZone = zones.find((z) => z.zoneId === selectedZoneId) ?? zones[0];
  const zoneAssignments = assignments
    .filter((a) => a.zoneId === selectedZoneId)
    .sort((a, b) => a.priority - b.priority);

  const availablePlayers = pool.filter((p) => p.joined).sort((a, b) => a.name.localeCompare(b.name));
  const generalWarnings = warnings.filter((w) => w.zoneId === undefined);

  return (
    <div className="twc-defence">
      <div className="twc-zone-list" role="tablist" aria-label="Zones">
        {zones.map((zone) => {
          const count = assignments.filter((a) => a.zoneId === zone.zoneId).length;
          const zoneWarnings = warningsByZone.get(zone.zoneId) ?? [];
          const hasError = zoneWarnings.some((w) => w.level === "error");
          return (
            <button
              key={zone.zoneId}
              type="button"
              className={`twc-zone-list-item${zone.zoneId === selectedZoneId ? " is-active" : ""}${hasError ? " has-error" : ""}`}
              onClick={() => setSelectedZoneId(zone.zoneId)}
            >
              <span className="twc-zone-list-name">{zone.name}</span>
              <span className="twc-zone-list-purpose">{zone.purpose}</span>
              <span className={`twc-zone-list-count${count > zone.targetCapacity ? " is-over" : count === 0 ? " is-empty" : ""}`}>
                {count}/{zone.targetCapacity}
              </span>
            </button>
          );
        })}
      </div>

      <div className="twc-zone-detail">
        {selectedZone ? (
          <>
            <header>
              <h3>{selectedZone.name}</h3>
              <p>{selectedZone.description}</p>
            </header>

            {zoneAssignments.length ? (
              <ul className="twc-assignment-list">
                {zoneAssignments.map((assignment) => {
                  const player = playerById.get(assignment.playerId);
                  const def = SQUAD_DEFINITIONS[assignment.squadKey];
                  return (
                    <li key={assignment.id} className="twc-assignment-row">
                      <div>
                        <strong>{player?.name ?? assignment.playerId}</strong>
                        <small>{def.label}</small>
                        {assignment.updatedBy || assignment.createdBy ? (
                          <small className="twc-attribution">by {assignment.updatedBy ?? assignment.createdBy}</small>
                        ) : null}
                      </div>
                      <select
                        value={assignment.status}
                        disabled={busy}
                        onChange={(event) => onUpdateAssignment(assignment.id, { status: event.target.value })}
                      >
                        {["SUGGESTED", "ASSIGNED", "ACKNOWLEDGED", "PLACED", "CHANGED", "MISSING", "EXEMPT"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <span className={`twc-source-pill twc-source-${assignment.source.toLowerCase()}`}>{assignment.source}</span>
                      <button
                        type="button"
                        className="twc-icon-btn"
                        disabled={busy}
                        title={assignment.locked ? "Unlock" : "Lock"}
                        onClick={() => onUpdateAssignment(assignment.id, { locked: !assignment.locked })}
                      >
                        {assignment.locked ? "🔒" : "🔓"}
                      </button>
                      <button type="button" className="twc-icon-btn twc-danger" disabled={busy} onClick={() => onDeleteAssignment(assignment.id)}>
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="tw-empty"><strong>No defenders assigned yet.</strong><p>Add one below, or generate recommendations.</p></div>
            )}

            <form
              className="twc-add-assignment"
              onSubmit={(event) => {
                event.preventDefault();
                if (!newPlayerId) return;
                onCreateAssignment(selectedZoneId, newPlayerId, newSquadKey);
                setNewPlayerId("");
              }}
            >
              <label>
                <span>Player</span>
                <select value={newPlayerId} onChange={(event) => setNewPlayerId(event.target.value)} disabled={busy}>
                  <option value="">Select a joined member…</option>
                  {availablePlayers.map((p) => (
                    <option key={p.playerId} value={p.playerId}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Squad</span>
                <select value={newSquadKey} onChange={(event) => setNewSquadKey(event.target.value as SquadKey)} disabled={busy}>
                  {SQUAD_KEYS.map((key) => {
                    const eligible = newPlayerId ? playerById.get(newPlayerId)?.squads[key] : undefined;
                    return (
                      <option key={key} value={key}>
                        {SQUAD_DEFINITIONS[key].label}{newPlayerId ? (eligible ? " ✓" : " (not verified)") : ""}
                      </option>
                    );
                  })}
                </select>
              </label>
              <button type="submit" disabled={busy || !newPlayerId}>Assign & lock</button>
            </form>
          </>
        ) : null}
      </div>

      <div className="twc-side-panel">
        <section className="twc-panel">
          <header><h3>Offence reserve</h3><span className={`twc-health-pill twc-health-${offenceReserve.health.toLowerCase().replace(" ", "-")}`}>{offenceReserve.health}</span></header>
          <p>{offenceReserve.reservedCount} joined members not yet on defence, across {offenceReserve.entries.length} ready squad types.</p>
          <ul className="twc-reserve-list">
            {offenceReserve.entries.slice(0, 6).map((entry) => (
              <li key={entry.squadKey}><span>{entry.label}</span><strong>{entry.availableCount}</strong></li>
            ))}
          </ul>
        </section>

        <section className="twc-panel">
          <header><h3>Warnings</h3><span className="twc-tab-badge">{warnings.length}</span></header>
          {generalWarnings.length || zones.some((z) => (warningsByZone.get(z.zoneId) ?? []).length) ? (
            <ul className="twc-warning-list">
              {warnings.slice(0, 12).map((w, index) => (
                <li key={index} className={`twc-warning-${w.level}`}>{w.message}</li>
              ))}
            </ul>
          ) : (
            <p className="twc-muted">No conflicts detected.</p>
          )}
        </section>

        <section className="twc-panel">
          <header><h3>Recommendations</h3></header>
          <p>Rule-based suggestions for empty capacity, respecting locked and manually placed defenders.</p>
          <button type="button" onClick={() => setShowRecommendations((v) => !v)}>
            {showRecommendations ? "Hide" : "Preview"} {recommendationsPreview.length} suggestion{recommendationsPreview.length === 1 ? "" : "s"}
          </button>
          {showRecommendations ? (
            <ul className="twc-recommendation-list">
              {recommendationsPreview.slice(0, 20).map((r, index) => (
                <li key={index}>
                  <strong>{playerById.get(r.playerId)?.name ?? r.playerId}</strong> → {SQUAD_DEFINITIONS[r.squadKey].label} (Zone {r.zoneId})
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="twc-primary-btn"
            disabled={busy || recommendationsPreview.length === 0}
            onClick={onApplyRecommendations}
          >
            Apply {recommendationsPreview.length} recommendation{recommendationsPreview.length === 1 ? "" : "s"}
          </button>
        </section>
      </div>
    </div>
  );
}
