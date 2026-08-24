"use client";

import { useState } from "react";
import { SQUAD_DEFINITIONS, SQUAD_KEYS } from "@/lib/tw-squads";
import type { EligiblePlayer } from "@/lib/tw-planning-engine";
import type { EffectiveZone } from "@/lib/tw-view";

const ZONE_PURPOSES = ["Hard Wall", "Specialist Wall", "Attrition", "Trap", "Fleet Hold", "Flexible"];

export default function TwPrepare({
  zones,
  pool,
  busy,
  onUpsertZone,
}: {
  zones: EffectiveZone[];
  pool: EligiblePlayer[];
  busy: boolean;
  onUpsertZone: (zoneId: number, updates: { purpose?: string; targetCapacity?: number }) => void;
}) {
  const [capacityDrafts, setCapacityDrafts] = useState<Record<number, number>>({});

  return (
    <div className="twc-prepare">
      <section className="twc-panel">
        <header>
          <h3>Squad readiness</h3>
          <p>Leader-unit eligibility check across the joined roster. Members who haven&rsquo;t joined this war are excluded from the &ldquo;joined&rdquo; count.</p>
        </header>
        <div className="twc-readiness-grid">
          {SQUAD_KEYS.map((key) => {
            const def = SQUAD_DEFINITIONS[key];
            const joinedReady = pool.filter((p) => p.joined && p.squads[key]).length;
            const totalReady = pool.filter((p) => p.squads[key]).length;
            return (
              <article key={key} className="twc-readiness-card">
                <span className={`twc-squad-code twc-group-${def.group}`}>{def.code}</span>
                <h4>{def.label}</h4>
                <strong>{joinedReady}<small>/{totalReady} total ready</small></strong>
                <p>{def.recommendation}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="twc-panel">
        <header>
          <h3>Zone setup</h3>
          <p>Set each zone&rsquo;s purpose and target defender capacity. Generate Recommendations (in Defence mode) uses this to prioritise placements.</p>
        </header>
        <div className="twc-zone-setup-table">
          {zones.map((zone) => (
            <div key={zone.zoneId} className="twc-zone-setup-row">
              <div>
                <strong>{zone.name}</strong>
                <small>{zone.description}</small>
                {zone.updatedBy ? <small className="twc-attribution">by {zone.updatedBy}</small> : null}
              </div>
              <label>
                <span>Purpose</span>
                <select
                  defaultValue={zone.purpose}
                  disabled={busy}
                  onChange={(event) => onUpsertZone(zone.zoneId, { purpose: event.target.value })}
                >
                  {ZONE_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Target capacity</span>
                <input
                  type="number"
                  min={1}
                  max={25}
                  disabled={busy}
                  value={capacityDrafts[zone.zoneId] ?? zone.targetCapacity}
                  onChange={(event) =>
                    setCapacityDrafts((prev) => ({ ...prev, [zone.zoneId]: Number(event.target.value) }))
                  }
                  onBlur={(event) => onUpsertZone(zone.zoneId, { targetCapacity: Number(event.target.value) })}
                />
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
