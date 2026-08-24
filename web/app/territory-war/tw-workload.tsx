"use client";

import { SQUAD_DEFINITIONS } from "@/lib/tw-squads";
import type { EligiblePlayer, WorkloadEntry } from "@/lib/tw-planning-engine";

export default function TwWorkload({
  workload,
  pool,
  assignedPlayerIds,
}: {
  workload: WorkloadEntry[];
  pool: EligiblePlayer[];
  assignedPlayerIds: string[];
}) {
  const assignedSet = new Set(assignedPlayerIds);
  const idle = pool.filter((p) => p.joined && !assignedSet.has(p.playerId)).sort((a, b) => b.galacticPower - a.galacticPower);
  const sorted = [...workload].sort((a, b) => b.assignmentCount - a.assignmentCount);

  return (
    <div className="twc-workload">
      <section className="twc-panel">
        <header><h3>Assigned members</h3><span className="twc-tab-badge">{sorted.length}</span></header>
        {sorted.length ? (
          <div className="rr-table-wrap">
            <table className="rr-table">
              <thead>
                <tr><th>Member</th><th>Assignments</th><th>Zones</th><th>Squads</th></tr>
              </thead>
              <tbody>
                {sorted.map((entry) => (
                  <tr key={entry.playerId} className={entry.overloaded ? "rr-row-attention" : undefined}>
                    <td>{entry.name}</td>
                    <td>{entry.overloaded ? <span className="rr-pill rr-pill-bad">{entry.assignmentCount}</span> : entry.assignmentCount}</td>
                    <td>{entry.zones.map((z) => `Zone ${z}`).join(", ")}</td>
                    <td>{entry.squads.map((s) => SQUAD_DEFINITIONS[s].label).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tw-empty"><strong>No assignments yet.</strong><p>Use Defence mode to place defenders.</p></div>
        )}
      </section>

      <section className="twc-panel">
        <header><h3>Idle joined members</h3><span className="twc-tab-badge">{idle.length}</span></header>
        <p>Joined, but not on a defensive assignment — available for offence or still to be placed.</p>
        {idle.length ? (
          <ul className="twc-idle-list">
            {idle.map((p) => (
              <li key={p.playerId}>{p.name}</li>
            ))}
          </ul>
        ) : (
          <p className="twc-muted">Everyone who joined has an assignment.</p>
        )}
      </section>
    </div>
  );
}
