"use client";

import { useMemo, useState } from "react";
import { SQUAD_DEFINITIONS, SQUAD_KEYS, TW_COUNTER_STRATEGIES, type SquadKey } from "@/lib/tw-squads";
import type { EligiblePlayer } from "@/lib/tw-planning-engine";
import type { PersistedAttackAssignment } from "@/lib/tw-view";

const ATTACK_STATUSES = ["UNASSIGNED", "ASSIGNED", "IN_PROGRESS", "FAILED", "NEEDS_SPECIALIST", "CLEARED", "HOLD"];

export default function TwAttack({
  attackAssignments,
  pool,
  busy,
  onUpsertAttack,
  onDeleteAttack,
}: {
  attackAssignments: PersistedAttackAssignment[];
  pool: EligiblePlayer[];
  busy: boolean;
  onUpsertAttack: (input: {
    id?: string;
    zoneLabel: string;
    enemySquad?: string | null;
    assignedPlayerId?: string | null;
    status?: string;
    note?: string | null;
  }) => void;
  onDeleteAttack: (id: string) => void;
}) {
  const [zoneLabel, setZoneLabel] = useState("");
  const [enemySquad, setEnemySquad] = useState<SquadKey | "">("");
  const [assignedPlayerId, setAssignedPlayerId] = useState("");

  const playerById = useMemo(() => new Map(pool.map((p) => [p.playerId, p])), [pool]);
  const strategy = enemySquad ? TW_COUNTER_STRATEGIES[enemySquad] : null;

  return (
    <div className="twc-attack">
      <section className="twc-panel">
        <header><h3>Add attack target</h3></header>
        <p>Manually tracked — Comlink does not expose the opponent&rsquo;s live roster or zone assignments.</p>
        <form
          className="twc-attack-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!zoneLabel.trim()) return;
            onUpsertAttack({ zoneLabel: zoneLabel.trim(), enemySquad: enemySquad || null, assignedPlayerId: assignedPlayerId || null });
            setZoneLabel("");
            setAssignedPlayerId("");
          }}
        >
          <label>
            <span>Enemy zone / target</span>
            <input value={zoneLabel} onChange={(event) => setZoneLabel(event.target.value)} placeholder="e.g. Enemy Zone 3" disabled={busy} required />
          </label>
          <label>
            <span>Enemy squad (optional)</span>
            <select value={enemySquad} onChange={(event) => setEnemySquad(event.target.value as SquadKey | "")} disabled={busy}>
              <option value="">Unknown / not listed</option>
              {SQUAD_KEYS.map((key) => (
                <option key={key} value={key}>{SQUAD_DEFINITIONS[key].label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Assign attacker</span>
            <select value={assignedPlayerId} onChange={(event) => setAssignedPlayerId(event.target.value)} disabled={busy}>
              <option value="">Unassigned</option>
              {pool.filter((p) => p.joined).sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                <option key={p.playerId} value={p.playerId}>{p.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={busy}>Add target</button>
        </form>

        {strategy ? (
          <div className="twc-counter-card">
            <strong>{strategy.defendingSquad}</strong> <span className={`twc-vuln twc-vuln-${strategy.vulnerability.toLowerCase()}`}>{strategy.vulnerability} vulnerability</span>
            <dl>
              <div><dt>Primary counter</dt><dd>{strategy.primaryCounter.name} — {strategy.primaryCounter.successRate}</dd></div>
              <div><dt>Secondary counter</dt><dd>{strategy.secondaryCounter.name} — {strategy.secondaryCounter.successRate}</dd></div>
              <div><dt>Cheaper counter</dt><dd>{strategy.cheaperCounter.name} — {strategy.cheaperCounter.successRate}</dd></div>
              <div><dt>Kill order</dt><dd>{strategy.killOrder}</dd></div>
            </dl>
          </div>
        ) : null}
      </section>

      <section className="twc-panel">
        <header><h3>Attack board</h3><span className="twc-tab-badge">{attackAssignments.length}</span></header>
        {attackAssignments.length ? (
          <ul className="twc-attack-list">
            {attackAssignments.map((attack) => (
              <li key={attack.id} className="twc-attack-row">
                <div>
                  <strong>{attack.zoneLabel}</strong>
                  <small>{attack.enemySquad ? SQUAD_DEFINITIONS[attack.enemySquad as SquadKey]?.label ?? attack.enemySquad : "Unknown enemy squad"}</small>
                  {attack.updatedBy ? <small className="twc-attribution">by {attack.updatedBy}</small> : null}
                </div>
                <span>{attack.assignedPlayerId ? playerById.get(attack.assignedPlayerId)?.name ?? attack.assignedPlayerId : "Unassigned"}</span>
                <select
                  value={attack.status}
                  disabled={busy}
                  onChange={(event) => onUpsertAttack({ id: attack.id, zoneLabel: attack.zoneLabel, status: event.target.value })}
                >
                  {ATTACK_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
                <button type="button" className="twc-icon-btn twc-danger" disabled={busy} onClick={() => onDeleteAttack(attack.id)}>Remove</button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="tw-empty"><strong>No attack targets tracked yet.</strong><p>Add enemy zones above as scouting reports come in.</p></div>
        )}
      </section>
    </div>
  );
}
