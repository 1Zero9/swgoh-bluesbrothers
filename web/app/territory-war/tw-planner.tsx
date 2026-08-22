"use client";

import React, { useState, useMemo } from "react";
import type { PlayerDefensiveSquad } from "@/lib/territory-war";

type TwPlannerProps = {
  squadsPool: PlayerDefensiveSquad[];
  joinedCount: number;
};

const SQUAD_LABELS = {
  lordVader: "Lord Vader GL",
  jabba: "Jabba the Hutt GL",
  rey: "Rey GL",
  jmk: "Jedi Master Kenobi GL",
  reva: "Reva Inquisitorius",
  malgus: "Darth Malgus",
  gas: "GAS 501st",
  zorii: "Zorii Resistance",
  cere: "Cere & Malicos",
  executor: "Executor Fleet",
  profundity: "Profundity Fleet",
  leviathan: "Leviathan Fleet",
} as const;

type SquadKey = keyof typeof SQUAD_LABELS;

const SQUAD_METRICS: Record<SquadKey, { label: string; recommendation: string; defaultRole: "Defense" | "Offense" }> = {
  lordVader: { label: "Lord Vader GL", recommendation: "Excellent defense anchor. Pair with Maul/Royal Guard. Minimum Relic 7.", defaultRole: "Defense" },
  jabba: { label: "Jabba the Hutt GL", recommendation: "Extremely tough defense wall. Heavy hold potential. Target Relic 5+.", defaultRole: "Defense" },
  rey: { label: "Rey GL", recommendation: "Great defensive GL. Pair with Ben Solo to steal banners. Target Relic 5+.", defaultRole: "Defense" },
  jmk: { label: "Jedi Master Kenobi GL", recommendation: "Highly versatile. Best saved for offense sweeps (e.g. Jabba counter).", defaultRole: "Offense" },
  reva: { label: "Reva Inquisitorius", recommendation: "Elite defense block. Place in Zone 1 to block top path. Target Relic 7+.", defaultRole: "Defense" },
  malgus: { label: "Darth Malgus", recommendation: "Premium non-GL defense wall in Mid-Front sectors (Zone 3). Target Relic 5+.", defaultRole: "Defense" },
  gas: { label: "GAS 501st", recommendation: "Solid defense wall or high-tier offensive counter. Target Relic 5+.", defaultRole: "Defense" },
  zorii: { label: "Zorii Resistance", recommendation: "High-hold defense team in Mid-Bottom sectors (Zone 4). Target G12+.", defaultRole: "Defense" },
  cere: { label: "Cere & Malicos", recommendation: "Nasty defense hold. Place in Mid-Bottom sectors (Zone 4). Target G12+.", defaultRole: "Defense" },
  executor: { label: "Executor Fleet", recommendation: "Strong fleet blockade. Place in Fleet Back (Zone 10) to block path. Target 7★.", defaultRole: "Defense" },
  profundity: { label: "Profundity Fleet", recommendation: "Reliable fleet blockade or offensive counter ship. Target 7★.", defaultRole: "Defense" },
  leviathan: { label: "Leviathan Fleet", recommendation: "Elite fleet wall. Place in Fleet Front (Zone 9). Target 7★.", defaultRole: "Defense" },
};

type ZoneAllocation = {
  id: number;
  name: string;
  type: "ground" | "fleet";
  description: string;
  targetCapacity: number;
  allocations: Record<SquadKey, number>;
};

const INITIAL_ZONES: ZoneAllocation[] = [
  { id: 1, name: "Zone 1 (Top Front)", type: "ground", description: "Top front line. Target elite GLs or Inquisitors (Reva/LV).", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 2, name: "Zone 2 (Bottom Front)", type: "ground", description: "Bottom front line. Best for tanky hold squads (Jabba/Rey).", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 3, name: "Zone 3 (Top Mid-Front)", type: "ground", description: "Top mid-front. Best for solid non-GL walls (GAS/Malgus).", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 4, name: "Zone 4 (Bottom Mid-Front)", type: "ground", description: "Bottom mid-front. Best for off-meta holds (Zorii/Cere).", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 5, name: "Zone 5 (Top Mid-Back)", type: "ground", description: "Top mid-back fallback. Secondary hold structures.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 6, name: "Zone 6 (Bottom Mid-Back)", type: "ground", description: "Bottom mid-back fallback. Residual synergy cards.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 7, name: "Zone 7 (Top Back)", type: "ground", description: "Top back wall. Place fallback squads to prevent full clears.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 8, name: "Zone 8 (Bottom Back)", type: "ground", description: "Bottom back wall. Residual holds and general filler squads.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 9, name: "Zone 9 (Fleet Front)", type: "fleet", description: "Front fleet sector. Guard with Leviathan or Profundity blockades.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 10, name: "Zone 10 (Fleet Back)", type: "fleet", description: "Back fleet sector. Guard with Executor or Chimaera blockades.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
];

export default function TwPlanner({ squadsPool, joinedCount }: TwPlannerProps) {
  const activePool = useMemo(() => squadsPool.filter((s) => s.joined), [squadsPool]);
  
  // Calculate total available squads in the active pool
  const poolTotals = useMemo(() => {
    const totals: Record<SquadKey, number> = {
      lordVader: 0,
      jabba: 0,
      rey: 0,
      jmk: 0,
      reva: 0,
      malgus: 0,
      gas: 0,
      zorii: 0,
      cere: 0,
      executor: 0,
      profundity: 0,
      leviathan: 0,
    };
    activePool.forEach((p) => {
      Object.keys(totals).forEach((key) => {
        if (p[key as SquadKey]) {
          totals[key as SquadKey]++;
        }
      });
    });
    return totals;
  }, [activePool]);

  const [zones, setZones] = useState<ZoneAllocation[]>(() => {
    const initialCap = Math.ceil(joinedCount / 2) || 25;
    return INITIAL_ZONES.map((z) => ({ ...z, targetCapacity: initialCap }));
  });

  const [selectedZoneId, setSelectedZoneId] = useState<number>(1);
  const [globalCapacity, setGlobalCapacity] = useState<number>(() => Math.ceil(joinedCount / 2) || 25);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedZone = useMemo(() => zones.find((z) => z.id === selectedZoneId)!, [zones, selectedZoneId]);

  // Total allocated squads per archetype across all zones
  const totalAllocated = useMemo(() => {
    const totals: Record<SquadKey, number> = {
      lordVader: 0,
      jabba: 0,
      rey: 0,
      jmk: 0,
      reva: 0,
      malgus: 0,
      gas: 0,
      zorii: 0,
      cere: 0,
      executor: 0,
      profundity: 0,
      leviathan: 0,
    };
    zones.forEach((z) => {
      Object.keys(totals).forEach((key) => {
        totals[key as SquadKey] += z.allocations[key as SquadKey];
      });
    });
    return totals;
  }, [zones]);

  // Auto-allocate heuristic engine
  const handleAutoAllocate = () => {
    const nextZones = zones.map((z) => ({
      ...z,
      allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 },
    }));

    const playerPlacements = new Map<string, Set<string>>();
    activePool.forEach((p) => playerPlacements.set(p.playerId, new Set<string>()));

    const tryPlace = (zoneIndex: number, squadKey: SquadKey, player: PlayerDefensiveSquad): boolean => {
      const placed = playerPlacements.get(player.playerId)!;
      if (placed.has(squadKey)) return false;
      if (placed.size >= 3) return false; // Save remaining squads for offense sweeps

      nextZones[zoneIndex].allocations[squadKey]++;
      placed.add(squadKey);
      return true;
    };

    // Fleet Path
    // Zone 9: Leviathan + Profundity
    activePool.forEach((player) => {
      const currentCount = nextZones[8].allocations.leviathan + nextZones[8].allocations.profundity;
      if (currentCount >= nextZones[8].targetCapacity) return;
      if (player.leviathan) tryPlace(8, "leviathan", player);
      else if (player.profundity) tryPlace(8, "profundity", player);
    });

    // Zone 10: Executor
    activePool.forEach((player) => {
      const currentCount = nextZones[9].allocations.executor;
      if (currentCount >= nextZones[9].targetCapacity) return;
      if (player.executor) tryPlace(9, "executor", player);
    });

    // Ground Top Path
    // Zone 1: Reva + Lord Vader
    activePool.forEach((player) => {
      const currentCount = nextZones[0].allocations.reva + nextZones[0].allocations.lordVader;
      if (currentCount >= nextZones[0].targetCapacity) return;
      if (player.reva) tryPlace(0, "reva", player);
      else if (player.lordVader) tryPlace(0, "lordVader", player);
    });

    // Zone 2: Jabba + Rey
    activePool.forEach((player) => {
      const currentCount = nextZones[1].allocations.jabba + nextZones[1].allocations.rey;
      if (currentCount >= nextZones[1].targetCapacity) return;
      if (player.jabba) tryPlace(1, "jabba", player);
      else if (player.rey) tryPlace(1, "rey", player);
    });

    // Zone 3: Malgus + GAS
    activePool.forEach((player) => {
      const currentCount = nextZones[2].allocations.malgus + nextZones[2].allocations.gas;
      if (currentCount >= nextZones[2].targetCapacity) return;
      if (player.malgus) tryPlace(2, "malgus", player);
      else if (player.gas) tryPlace(2, "gas", player);
    });

    // Zone 4: Zorii + Cere
    activePool.forEach((player) => {
      const currentCount = nextZones[3].allocations.zorii + nextZones[3].allocations.cere;
      if (currentCount >= nextZones[3].targetCapacity) return;
      if (player.zorii) tryPlace(3, "zorii", player);
      else if (player.cere) tryPlace(3, "cere", player);
    });

    // Zone 5: JMK
    activePool.forEach((player) => {
      const currentCount = nextZones[4].allocations.jmk;
      if (currentCount >= nextZones[4].targetCapacity) return;
      if (player.jmk) tryPlace(4, "jmk", player);
    });

    setZones(nextZones);
  };

  const updateAllocation = (squadKey: SquadKey, increment: boolean) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZoneId) return z;
        const currentVal = z.allocations[squadKey];
        const nextVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
        return {
          ...z,
          allocations: {
            ...z.allocations,
            [squadKey]: nextVal,
          },
        };
      })
    );
  };

  const handleGlobalCapacityChange = (newVal: number) => {
    setGlobalCapacity(newVal);
    setZones((prev) => prev.map((z) => ({ ...z, targetCapacity: newVal })));
  };

  const compiledDirectives = useMemo(() => {
    let text = `=== BLUES BROTHERS TW STRATEGY DIRECTIVES ===\n`;
    text += `Target Zone Capacity: ${globalCapacity} squads per zone\n\n`;

    zones.forEach((z) => {
      const allocatedList = Object.entries(z.allocations)
        .filter(([, val]) => val > 0)
        .map(([key, val]) => `${val}x ${SQUAD_LABELS[key as SquadKey]}`)
        .join(", ");
      
      const totalAllocatedInZone = Object.values(z.allocations).reduce((a, b) => a + b, 0);
      const fillerCount = Math.max(0, z.targetCapacity - totalAllocatedInZone);

      text += `[${z.name}]\n`;
      text += `└ Squads: ${allocatedList || "None pre-assigned"}\n`;
      if (fillerCount > 0) {
        text += `└ Filler: Deploy ${fillerCount}x general synergy squads\n`;
      }
      text += `\n`;
    });

    text += `=== OFFENSE ORDER ===\n`;
    text += `• Save high-gear JMK, JML, and SLKR counter teams for offensive sweeps.\n`;
    text += `• Check zone target capacity locks before placing residual defenses.`;
    return text;
  }, [zones, globalCapacity]);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledDirectives);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to split zones for visual map rendering
  const topPathZones = useMemo(() => zones.filter((z) => [1, 3, 5, 7].includes(z.id)), [zones]);
  const bottomPathZones = useMemo(() => zones.filter((z) => [2, 4, 6, 8].includes(z.id)), [zones]);
  const fleetPathZones = useMemo(() => zones.filter((z) => [9, 10].includes(z.id)), [zones]);

  return (
    <div className="tw-planner-outer-container">
      {/* Visual Map Section */}
      <section className="tw-visual-map-section panel">
        <header className="panel-heading">
          <h2>Territory War Tactical Map</h2>
          <p className="section-intro">Visual battlefield representation. Click any zone node to allocate squads.</p>
        </header>

        <div className="tw-map-board">
          {/* Top Path */}
          <div className="tw-map-lane top-lane">
            <span className="lane-label">Top Path (Ground)</span>
            <div className="lane-nodes">
              {topPathZones.map((z) => {
                const assigned = Object.values(z.allocations).reduce((a, b) => a + b, 0);
                const percent = Math.min(100, Math.round((assigned / z.targetCapacity) * 100));
                const activeSquads = Object.entries(z.allocations)
                  .filter(([, val]) => val > 0)
                  .map(([k]) => k.slice(0, 3).toUpperCase());

                return (
                  <button
                    key={z.id}
                    className={`map-node-card ${selectedZoneId === z.id ? "active" : ""}`}
                    onClick={() => setSelectedZoneId(z.id)}
                  >
                    <div className="node-badge">Z{z.id}</div>
                    <div className="node-body">
                      <strong>{z.name.split(" ")[0]} {z.name.match(/\((.*?)\)/)?.[0]}</strong>
                      <span className="node-allocation-summary">
                        {activeSquads.join(", ") || "Filler only"}
                      </span>
                    </div>
                    <div className="node-footer">
                      <span>{assigned}/{z.targetCapacity}</span>
                      <div className="node-progress"><div style={{ width: `${percent}%` }} /></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fleet Path */}
          <div className="tw-map-lane fleet-lane">
            <span className="lane-label">Middle Path (Fleets)</span>
            <div className="lane-nodes centered-nodes">
              {fleetPathZones.map((z) => {
                const assigned = Object.values(z.allocations).reduce((a, b) => a + b, 0);
                const percent = Math.min(100, Math.round((assigned / z.targetCapacity) * 100));
                const activeSquads = Object.entries(z.allocations)
                  .filter(([, val]) => val > 0)
                  .map(([k]) => k.slice(0, 3).toUpperCase());

                return (
                  <button
                    key={z.id}
                    className={`map-node-card fleet-node ${selectedZoneId === z.id ? "active" : ""}`}
                    onClick={() => setSelectedZoneId(z.id)}
                  >
                    <div className="node-badge fleet-badge">Z{z.id}</div>
                    <div className="node-body">
                      <strong>{z.name.split(" ")[0]} {z.name.match(/\((.*?)\)/)?.[0]}</strong>
                      <span className="node-allocation-summary">
                        {activeSquads.join(", ") || "No fleets"}
                      </span>
                    </div>
                    <div className="node-footer">
                      <span>{assigned}/{z.targetCapacity}</span>
                      <div className="node-progress"><div style={{ width: `${percent}%` }} /></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Path */}
          <div className="tw-map-lane bottom-lane">
            <span className="lane-label">Bottom Path (Ground)</span>
            <div className="lane-nodes">
              {bottomPathZones.map((z) => {
                const assigned = Object.values(z.allocations).reduce((a, b) => a + b, 0);
                const percent = Math.min(100, Math.round((assigned / z.targetCapacity) * 100));
                const activeSquads = Object.entries(z.allocations)
                  .filter(([, val]) => val > 0)
                  .map(([k]) => k.slice(0, 3).toUpperCase());

                return (
                  <button
                    key={z.id}
                    className={`map-node-card ${selectedZoneId === z.id ? "active" : ""}`}
                    onClick={() => setSelectedZoneId(z.id)}
                  >
                    <div className="node-badge">Z{z.id}</div>
                    <div className="node-body">
                      <strong>{z.name.split(" ")[0]} {z.name.match(/\((.*?)\)/)?.[0]}</strong>
                      <span className="node-allocation-summary">
                        {activeSquads.join(", ") || "Filler only"}
                      </span>
                    </div>
                    <div className="node-footer">
                      <span>{assigned}/{z.targetCapacity}</span>
                      <div className="node-progress"><div style={{ width: `${percent}%` }} /></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Editor & Roster Dashboard Grid */}
      <div className="tw-planner-grid">
        {/* Editor Controls */}
        <div className="planner-controls-panel panel">
          <header className="panel-heading">
            <h2>Zone Editor</h2>
            <p className="section-intro">Configure details for Zone {selectedZone.id}.</p>
          </header>

          <div className="planner-meta-controls">
            <label className="capacity-slider-label">
              <span>Target Capacity: <strong>{globalCapacity}</strong> squads</span>
              <input
                type="range"
                min="10"
                max="50"
                value={globalCapacity}
                onChange={(e) => handleGlobalCapacityChange(Number(e.target.value))}
              />
            </label>

            <button className="auto-allocate-button account-link-button" onClick={handleAutoAllocate}>
              ⚡ Auto-Allocate defensive walls
            </button>
          </div>

          <div className="allocation-editor-grid-vertical">
            {Object.keys(SQUAD_LABELS).map((key) => {
              const squadKey = key as SquadKey;
              const isFleetSquad = ["executor", "profundity", "leviathan"].includes(squadKey);

              if (selectedZone.type === "ground" && isFleetSquad) return null;
              if (selectedZone.type === "fleet" && !isFleetSquad) return null;

              const allocatedHere = selectedZone.allocations[squadKey];
              const allocatedGlobal = totalAllocated[squadKey];
              const poolTotal = poolTotals[squadKey];
              const exceedsPool = allocatedGlobal > poolTotal;

              return (
                <div key={squadKey} className={`squad-editor-row ${exceedsPool ? "exceeds-limit" : ""}`}>
                  <div className="squad-editor-row-info">
                    <strong>{SQUAD_LABELS[squadKey]}</strong>
                    <span>Zone: {allocatedHere} | Total: {allocatedGlobal}/{poolTotal}</span>
                  </div>
                  <div className="counter-controls">
                    <button onClick={() => updateAllocation(squadKey, false)} disabled={allocatedHere <= 0}>-</button>
                    <span className="counter-val">{allocatedHere}</span>
                    <button onClick={() => updateAllocation(squadKey, true)} disabled={allocatedGlobal >= poolTotal}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exporter directives */}
        <div className="planner-detail-panel panel">
          <header className="panel-heading">
            <h2>Command Directives</h2>
            <p className="section-intro">Direct copy paste values for in-game mail or Discord commands.</p>
          </header>
          <textarea className="directives-output" readOnly value={compiledDirectives} />
          <button className="copy-directives-btn account-link-button" onClick={handleCopy}>
            {copied ? "✓ Copied to Clipboard" : "Copy Directives"}
          </button>
        </div>
      </div>

      {/* Roster & Balance Analysis Board */}
      <section className="tw-roster-analysis-section panel">
        <header className="panel-heading">
          <h2>Roster Optimization & Squads Balance</h2>
          <p className="section-intro">Analysis of joined roster, current defensive allocation, and remaining offensive headroom.</p>
        </header>

        <div className="rr-table-wrap">
          <table className="rr-table">
            <thead>
              <tr>
                <th>Squad Archetype</th>
                <th>Joined Total</th>
                <th>On Defense</th>
                <th>Offense Headroom</th>
                <th>Tactical Placement recommendation</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(SQUAD_LABELS).map((key) => {
                const squadKey = key as SquadKey;
                const poolTotal = poolTotals[squadKey];
                const onDefense = totalAllocated[squadKey];
                const onOffense = Math.max(0, poolTotal - onDefense);
                const metric = SQUAD_METRICS[squadKey];

                return (
                  <tr key={squadKey}>
                    <td><strong>{metric.label}</strong></td>
                    <td>{poolTotal}</td>
                    <td className={onDefense > 0 ? "rr-pill-good" : ""}>{onDefense}</td>
                    <td className="rr-member">
                      <i className="status-dot">{onOffense}</i>
                    </td>
                    <td><small>{metric.recommendation}</small></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
