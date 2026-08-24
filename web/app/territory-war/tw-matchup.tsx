"use client";

import type { AssignmentRecord } from "@/lib/tw-planning-engine";
import type { EffectiveZone } from "@/lib/tw-view";
import type { WarMatchupSummary } from "./tw-workspace";

export default function TwMatchup({
  war,
  zones,
  assignments,
}: {
  war: WarMatchupSummary;
  zones: EffectiveZone[];
  assignments: AssignmentRecord[];
}) {
  return (
    <div className="twc-matchup">
      <section className="twc-panel">
        <header><h3>Live score</h3></header>
        {war.active ? (
          <div className="twc-score-row">
            <div><span>Blues Brothers</span><strong>{war.guildScore.toLocaleString("en-GB")}</strong></div>
            <span className="twc-vs">VS</span>
            <div><span>{war.opponentName || "Opponent"}</span><strong>{war.opponentScore.toLocaleString("en-GB")}</strong></div>
          </div>
        ) : (
          <p className="twc-muted">No active war in the latest capture. Comparative scoring will appear once a war starts.</p>
        )}
      </section>

      <section className="twc-panel">
        <header><h3>Plan fill status</h3></header>
        <p>How the current defence plan compares to each zone&rsquo;s target capacity, independent of the live in-game state above.</p>
        <div className="twc-fill-table">
          {zones.map((zone) => {
            const count = assignments.filter((a) => a.zoneId === zone.zoneId).length;
            const ratio = zone.targetCapacity ? count / zone.targetCapacity : 0;
            return (
              <div key={zone.zoneId} className="twc-fill-row">
                <span>{zone.name}</span>
                <div className="twc-fill-bar"><i style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
                <strong>{count}/{zone.targetCapacity}</strong>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
