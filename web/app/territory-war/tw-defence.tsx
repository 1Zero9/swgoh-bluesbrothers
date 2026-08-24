"use client";

import { useMemo, useState, type DragEvent } from "react";
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
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const [draggingAssignmentId, setDraggingAssignmentId] = useState<string | null>(null);
  const [dragOverZoneId, setDragOverZoneId] = useState<number | null>(null);

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

  function bestSquadForPlayer(playerId: string): SquadKey {
    const player = playerById.get(playerId);
    const eligible = player ? SQUAD_KEYS.find((key) => player.squads[key]) : undefined;
    return eligible ?? SQUAD_KEYS[0];
  }

  function handlePlayerDragStart(event: DragEvent, playerId: string) {
    event.dataTransfer.setData("text/plain", `player:${playerId}`);
    event.dataTransfer.effectAllowed = "copy";
    setDraggingPlayerId(playerId);
  }

  function handleAssignmentDragStart(event: DragEvent, assignmentId: string) {
    event.dataTransfer.setData("text/plain", `assignment:${assignmentId}`);
    event.dataTransfer.effectAllowed = "move";
    setDraggingAssignmentId(assignmentId);
  }

  function handleDragEnd() {
    setDraggingPlayerId(null);
    setDraggingAssignmentId(null);
    setDragOverZoneId(null);
  }

  function handleZoneDragOver(event: DragEvent, zoneId: number) {
    if (!draggingPlayerId && !draggingAssignmentId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = draggingAssignmentId ? "move" : "copy";
    setDragOverZoneId(zoneId);
  }

  function handleZoneDragLeave(zoneId: number) {
    setDragOverZoneId((current) => (current === zoneId ? null : current));
  }

  function handleZoneDrop(event: DragEvent, targetZoneId: number) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text/plain");
    handleDragEnd();
    if (!data) return;
    if (data.startsWith("player:")) {
      const playerId = data.slice("player:".length);
      onCreateAssignment(targetZoneId, playerId, bestSquadForPlayer(playerId));
    } else if (data.startsWith("assignment:")) {
      const assignmentId = data.slice("assignment:".length);
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (assignment && assignment.zoneId !== targetZoneId) {
        onUpdateAssignment(assignmentId, { zoneId: targetZoneId });
      }
    }
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
              className={`twc-zone-list-item${zone.zoneId === selectedZoneId ? " is-active" : ""}${hasError ? " has-error" : ""}${zone.zoneId === dragOverZoneId ? " is-drag-over" : ""}`}
              onClick={() => setSelectedZoneId(zone.zoneId)}
              onDragOver={(event) => handleZoneDragOver(event, zone.zoneId)}
              onDragLeave={() => handleZoneDragLeave(zone.zoneId)}
              onDrop={(event) => handleZoneDrop(event, zone.zoneId)}
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
              <ul
                className={`twc-assignment-list${selectedZoneId === dragOverZoneId ? " is-drag-over" : ""}`}
                onDragOver={(event) => handleZoneDragOver(event, selectedZoneId)}
                onDragLeave={() => handleZoneDragLeave(selectedZoneId)}
                onDrop={(event) => handleZoneDrop(event, selectedZoneId)}
              >
                {zoneAssignments.map((assignment) => {
                  const player = playerById.get(assignment.playerId);
                  return (
                    <li
                      key={assignment.id}
                      className={`twc-assignment-row${assignment.id === draggingAssignmentId ? " is-dragging" : ""}`}
                      draggable
                      onDragStart={(event) => handleAssignmentDragStart(event, assignment.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div>
                        <strong title="Drag onto another zone to move this defender">⠿ {player?.name ?? assignment.playerId}</strong>
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
              <div
                className={`tw-empty${selectedZoneId === dragOverZoneId ? " is-drag-over" : ""}`}
                onDragOver={(event) => handleZoneDragOver(event, selectedZoneId)}
                onDragLeave={() => handleZoneDragLeave(selectedZoneId)}
                onDrop={(event) => handleZoneDrop(event, selectedZoneId)}
              >
                <strong>No defenders assigned yet.</strong>
                <p>Drag a name from the available defenders list, or add one below.</p>
              </div>
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
          <header><h3>Available defenders</h3><span className="twc-tab-badge">{availablePlayers.length}</span></header>
          <p>Joined members not yet on defence. Drag a name onto a zone on the left, or onto the defender list, to assign them.</p>
          <ul className="twc-defender-chips">
            {availablePlayers.map((player) => (
              <li
                key={player.playerId}
                draggable
                className={`twc-defender-chip${player.playerId === draggingPlayerId ? " is-dragging" : ""}`}
                onDragStart={(event) => handlePlayerDragStart(event, player.playerId)}
                onDragEnd={handleDragEnd}
                title={`${player.name} — drag onto a zone to assign`}
              >
                <span>{player.name}</span>
                <small>{SQUAD_DEFINITIONS[bestSquadForPlayer(player.playerId)].code}</small>
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
