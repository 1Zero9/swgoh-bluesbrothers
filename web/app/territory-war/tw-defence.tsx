"use client";

import { useMemo, useState } from "react";
import { SQUAD_DEFINITIONS, SQUAD_KEYS, isFleetSquad, type SquadKey } from "@/lib/tw-squads";
import type {
  AssignmentRecord,
  EligiblePlayer,
  OffenceReserve,
  PlanWarning,
  Recommendation,
} from "@/lib/tw-planning-engine";
import type { CommandSummary, EffectiveZone } from "@/lib/tw-view";

function confidenceClass(score: number) {
  if (score >= 75) return "is-strong";
  if (score >= 55) return "is-likely";
  if (score >= 35) return "is-contested";
  return "is-vulnerable";
}

export default function TwDefence({
  zones,
  assignments,
  pool,
  warnings,
  offenceReserve,
  recommendationsPreview,
  commands,
  busy,
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onApplyRecommendations,
  onAssignCommand,
  onCreateCommand,
  onDeleteCommand,
}: {
  zones: EffectiveZone[];
  assignments: AssignmentRecord[];
  pool: EligiblePlayer[];
  warnings: PlanWarning[];
  offenceReserve: OffenceReserve;
  recommendationsPreview: Recommendation[];
  commands: CommandSummary[];
  busy: boolean;
  onCreateAssignment: (zoneId: number, playerId: string, squadKey: SquadKey) => void;
  onUpdateAssignment: (id: string, updates: Record<string, unknown>) => void;
  onDeleteAssignment: (id: string) => void;
  onApplyRecommendations: () => void;
  onAssignCommand: (zoneId: number, commandId: string | null) => void;
  onCreateCommand: (input: { name: string; squadKey: string | null; kitNotes: string | null }) => void;
  onDeleteCommand: (id: string) => void;
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.zoneId ?? 1);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showNewCommand, setShowNewCommand] = useState(false);
  const [newCommandName, setNewCommandName] = useState("");
  const [newCommandSquadKey, setNewCommandSquadKey] = useState<SquadKey | "">("");
  const [newPlayerId, setNewPlayerId] = useState("");

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

  const availablePlayers = pool
    .filter((p) => p.joined && !assignments.some((a) => a.playerId === p.playerId))
    .sort((a, b) => a.name.localeCompare(b.name));
  const generalWarnings = warnings.filter((w) => w.zoneId === undefined);

  const zoneTypeCommands = commands.filter((c) => {
    if (!c.squadKey) return true;
    const key = c.squadKey as SquadKey;
    return selectedZone ? isFleetSquad(key) === (selectedZone.type === "fleet") : true;
  });

  function defaultSquadForZone(): SquadKey {
    const commandKey = selectedZone?.command?.squadKey as SquadKey | undefined;
    if (commandKey) return commandKey;
    return SQUAD_KEYS.find((key) => isFleetSquad(key) === (selectedZone?.type === "fleet")) ?? SQUAD_KEYS[0];
  }

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
              <span className="twc-zone-list-purpose">{zone.command ? zone.command.name : "No command set"}</span>
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
            <header className="twc-zone-detail-header">
              <div>
                <h3>{selectedZone.name}</h3>
                <p>{selectedZone.description}</p>
              </div>
              {selectedZone.holdConfidence ? (
                <div className={`twc-confidence-badge ${confidenceClass(selectedZone.holdConfidence.score)}`}>
                  <strong>{selectedZone.holdConfidence.score}%</strong>
                  <span>{selectedZone.holdConfidence.label}</span>
                </div>
              ) : null}
            </header>

            {selectedZone.holdConfidence ? (
              <ul className="twc-confidence-factors">
                {selectedZone.holdConfidence.factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            ) : null}

            <section className="twc-command-picker">
              <header>
                <h4>Command for this zone</h4>
                <button type="button" className="twc-icon-btn" disabled={busy} onClick={() => setShowNewCommand((v) => !v)}>
                  {showNewCommand ? "Cancel" : "+ New command"}
                </button>
              </header>

              {showNewCommand ? (
                <form
                  className="twc-new-command-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!newCommandName.trim()) return;
                    onCreateCommand({
                      name: newCommandName.trim(),
                      squadKey: newCommandSquadKey || null,
                      kitNotes: null,
                    });
                    setNewCommandName("");
                    setNewCommandSquadKey("");
                    setShowNewCommand(false);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Command name, e.g. GL Vader + Datacron"
                    value={newCommandName}
                    onChange={(event) => setNewCommandName(event.target.value)}
                    disabled={busy}
                  />
                  <select value={newCommandSquadKey} onChange={(event) => setNewCommandSquadKey(event.target.value as SquadKey)} disabled={busy}>
                    <option value="">No base squad (custom note only)</option>
                    {SQUAD_KEYS.map((key) => (
                      <option key={key} value={key}>{SQUAD_DEFINITIONS[key].label}</option>
                    ))}
                  </select>
                  <button type="submit" disabled={busy || !newCommandName.trim()}>Save command</button>
                </form>
              ) : null}

              <div className="twc-command-grid">
                <button
                  type="button"
                  className={`twc-command-card${!selectedZone.commandId ? " is-selected" : ""}`}
                  disabled={busy}
                  onClick={() => onAssignCommand(selectedZone.zoneId, null)}
                >
                  <strong>No command</strong>
                  <span>Clear this zone&apos;s assigned command</span>
                </button>
                {zoneTypeCommands.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    className={`twc-command-card${command.id === selectedZone.commandId ? " is-selected" : ""}`}
                    disabled={busy}
                    onClick={() => onAssignCommand(selectedZone.zoneId, command.id)}
                  >
                    <strong>{command.name}</strong>
                    {command.squadKey ? <span>{SQUAD_DEFINITIONS[command.squadKey as SquadKey]?.label ?? command.squadKey}</span> : null}
                    {command.kitNotes ? <small>{command.kitNotes}</small> : null}
                    {command.isBuiltIn ? <em className="twc-command-tag">Preset</em> : (
                      <em
                        className="twc-command-tag twc-command-delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteCommand(command.id);
                        }}
                      >
                        Delete
                      </em>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className="twc-defenders-section">
              <header><h4>Defenders in this zone</h4><span className="twc-tab-badge">{zoneAssignments.length}</span></header>

              {zoneAssignments.length ? (
                <ul className="twc-assignment-list">
                  {zoneAssignments.map((assignment) => {
                    const player = playerById.get(assignment.playerId);
                    return (
                      <li key={assignment.id} className="twc-assignment-row">
                        <div>
                          <strong>{player?.name ?? assignment.playerId}</strong>
                          {assignment.updatedBy || assignment.createdBy ? (
                            <small className="twc-attribution">by {assignment.updatedBy ?? assignment.createdBy}</small>
                          ) : null}
                        </div>
                        <select
                          className="twc-squad-select"
                          value={assignment.squadKey}
                          disabled={busy}
                          onChange={(event) => onUpdateAssignment(assignment.id, { squadKey: event.target.value })}
                        >
                          {SQUAD_KEYS.map((key) => (
                            <option key={key} value={key}>{SQUAD_DEFINITIONS[key].label}</option>
                          ))}
                        </select>
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
                <div className="tw-empty">
                  <strong>No defenders assigned yet.</strong>
                  <p>Pick a command above, then add the specific members placing it below.</p>
                </div>
              )}

              <form
                className="twc-add-assignment"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!newPlayerId) return;
                  onCreateAssignment(selectedZoneId, newPlayerId, defaultSquadForZone());
                  setNewPlayerId("");
                }}
              >
                <label>
                  <span>Add defender</span>
                  <select value={newPlayerId} onChange={(event) => setNewPlayerId(event.target.value)} disabled={busy}>
                    <option value="">Select a joined member…</option>
                    {availablePlayers.map((p) => (
                      <option key={p.playerId} value={p.playerId}>{p.name}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" disabled={busy || !newPlayerId}>Assign</button>
              </form>
            </section>
          </>
        ) : null}
      </div>

      <div className="twc-side-panel">
        <section className="twc-panel">
          <header><h3>Available defenders</h3><span className="twc-tab-badge">{availablePlayers.length}</span></header>
          <p>Joined members not yet on defence anywhere.</p>
          <ul className="twc-defender-chips">
            {availablePlayers.map((player) => (
              <li key={player.playerId} className="twc-defender-chip">
                <span>{player.name}</span>
              </li>
            ))}
            {availablePlayers.length === 0 ? <li className="twc-defender-chip-empty">Everyone joined is already assigned.</li> : null}
          </ul>
        </section>

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
