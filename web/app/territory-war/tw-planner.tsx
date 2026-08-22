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

type ZoneAllocation = {
  id: number;
  name: string;
  type: "ground" | "fleet";
  description: string;
  targetCapacity: number;
  allocations: Record<SquadKey, number>;
};

const INITIAL_ZONES: ZoneAllocation[] = [
  { id: 1, name: "Zone 1 (Top Front)", type: "ground", description: "First line of ground defense. Target elite GLs or Inquisitors.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 2, name: "Zone 2 (Bottom Front)", type: "ground", description: "Secondary front line. Best for tanky hold squads like Jabba or Rey.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 3, name: "Zone 3 (Top Mid-Front)", type: "ground", description: "Mid-top path. Best for solid non-GL walls like GAS or Malgus.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 4, name: "Zone 4 (Bottom Mid-Front)", type: "ground", description: "Mid-bottom path. Best for high-synergy off-meta holds like Zorii.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 5, name: "Zone 5 (Top Mid-Back)", type: "ground", description: "Pre-back zone. Place general solid teams to filter remaining counters.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 6, name: "Zone 6 (Bottom Mid-Back)", type: "ground", description: "Pre-back zone bottom. Ideal place for residual synergy squads.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 7, name: "Zone 7 (Top Back)", type: "ground", description: "Top background zone. Back wall defenses to prevent full clears.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 8, name: "Zone 8 (Bottom Back)", type: "ground", description: "Bottom background zone. Save low gear filler squads here.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 9, name: "Zone 9 (Top Fleet)", type: "fleet", description: "Top fleet sector. Guard with Leviathan or Profundity blockades.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 10, name: "Zone 10 (Bottom Fleet)", type: "fleet", description: "Bottom fleet sector. Guard with Executor or Chimaera fleets.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
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
    // 1. Reset all allocations to 0
    const nextZones = zones.map((z) => ({
      ...z,
      allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 },
    }));

    // 2. Track which player has placed which squad (limit: 1 squad per player per defensive sector)
    const playerPlacements = new Map<string, Set<string>>();
    activePool.forEach((p) => playerPlacements.set(p.playerId, new Set<string>()));

    const tryPlace = (zoneIndex: number, squadKey: SquadKey, player: PlayerDefensiveSquad): boolean => {
      const placed = playerPlacements.get(player.playerId)!;
      if (placed.has(squadKey)) return false; // Already deployed this squad type elsewhere
      if (placed.size >= 3) return false; // Cap defensive squads per player to save offense

      // Increment allocation
      nextZones[zoneIndex].allocations[squadKey]++;
      placed.add(squadKey);
      return true;
    };

    // 3. Auto-allocate fleets first (Zone 9 and Zone 10)
    // Zone 9: Leviathan + Profundity
    activePool.forEach((player) => {
      const currentCount = nextZones[8].allocations.leviathan + nextZones[8].allocations.profundity;
      if (currentCount >= nextZones[8].targetCapacity) return;

      if (player.leviathan) {
        tryPlace(8, "leviathan", player);
      } else if (player.profundity) {
        tryPlace(8, "profundity", player);
      }
    });

    // Zone 10: Executor
    activePool.forEach((player) => {
      const currentCount = nextZones[9].allocations.executor;
      if (currentCount >= nextZones[9].targetCapacity) return;

      if (player.executor) {
        tryPlace(9, "executor", player);
      }
    });

    // 4. Ground Zones
    // Zone 1: Reva + Lord Vader
    activePool.forEach((player) => {
      const currentCount = nextZones[0].allocations.reva + nextZones[0].allocations.lordVader;
      if (currentCount >= nextZones[0].targetCapacity) return;

      if (player.reva) {
        tryPlace(0, "reva", player);
      } else if (player.lordVader) {
        tryPlace(0, "lordVader", player);
      }
    });

    // Zone 2: Jabba + Rey
    activePool.forEach((player) => {
      const currentCount = nextZones[1].allocations.jabba + nextZones[1].allocations.rey;
      if (currentCount >= nextZones[1].targetCapacity) return;

      if (player.jabba) {
        tryPlace(1, "jabba", player);
      } else if (player.rey) {
        tryPlace(1, "rey", player);
      }
    });

    // Zone 3: Malgus + GAS
    activePool.forEach((player) => {
      const currentCount = nextZones[2].allocations.malgus + nextZones[2].allocations.gas;
      if (currentCount >= nextZones[2].targetCapacity) return;

      if (player.malgus) {
        tryPlace(2, "malgus", player);
      } else if (player.gas) {
        tryPlace(2, "gas", player);
      }
    });

    // Zone 4: Zorii + Cere
    activePool.forEach((player) => {
      const currentCount = nextZones[3].allocations.zorii + nextZones[3].allocations.cere;
      if (currentCount >= nextZones[3].targetCapacity) return;

      if (player.zorii) {
        tryPlace(3, "zorii", player);
      } else if (player.cere) {
        tryPlace(3, "cere", player);
      }
    });

    // Zone 5: JMK (placed as secondary fallback block)
    activePool.forEach((player) => {
      const currentCount = nextZones[4].allocations.jmk;
      if (currentCount >= nextZones[4].targetCapacity) return;

      if (player.jmk) {
        tryPlace(4, "jmk", player);
      }
    });

    setZones(nextZones);
  };

  // Adjust allocation count manually
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

  // Generated directives compiler
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

  return (
    <div className="tw-planner-grid">
      <div className="planner-controls-panel panel">
        <header className="panel-heading">
          <h2>TW Defense Configurator</h2>
          <p className="section-intro">Plan zone blockades based on current locker metrics ({activePool.length} registered players).</p>
        </header>

        <div className="planner-meta-controls">
          <label className="capacity-slider-label">
            <span>Target Capacity per Zone: <strong>{globalCapacity}</strong></span>
            <input
              type="range"
              min="10"
              max="50"
              value={globalCapacity}
              onChange={(e) => handleGlobalCapacityChange(Number(e.target.value))}
            />
          </label>

          <button className="auto-allocate-button account-link-button" onClick={handleAutoAllocate}>
            ⚡ Run Auto-Configuration
          </button>
        </div>

        <div className="zones-list-wrapper">
          <h3>Zone Selections</h3>
          <div className="zones-vertical-list">
            {zones.map((z) => {
              const allocatedSum = Object.values(z.allocations).reduce((a, b) => a + b, 0);
              const percentage = Math.min(100, Math.round((allocatedSum / z.targetCapacity) * 100));
              return (
                <button
                  key={z.id}
                  className={`zone-item-row ${selectedZoneId === z.id ? "active" : ""}`}
                  onClick={() => setSelectedZoneId(z.id)}
                >
                  <div className="zone-row-info">
                    <strong>{z.name}</strong>
                    <span>{allocatedSum} / {z.targetCapacity} Assigned</span>
                  </div>
                  <div className="zone-gauge">
                    <div className="zone-gauge-bar" style={{ width: `${percentage}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="planner-detail-panel panel">
        <header className="panel-heading">
          <h2>{selectedZone.name}</h2>
          <p className="section-intro">{selectedZone.description}</p>
        </header>

        <div className="allocation-editor-grid">
          {Object.keys(SQUAD_LABELS).map((key) => {
            const squadKey = key as SquadKey;
            const isFleetSquad = ["executor", "profundity", "leviathan"].includes(squadKey);

            // Hide fleet templates on ground zones, and ground templates on fleet zones
            if (selectedZone.type === "ground" && isFleetSquad) return null;
            if (selectedZone.type === "fleet" && !isFleetSquad) return null;

            const allocatedHere = selectedZone.allocations[squadKey];
            const allocatedGlobal = totalAllocated[squadKey];
            const poolTotal = poolTotals[squadKey];
            const exceedsPool = allocatedGlobal > poolTotal;

            return (
              <div key={squadKey} className={`squad-editor-card ${exceedsPool ? "exceeds-limit" : ""}`}>
                <div className="squad-info">
                  <strong>{SQUAD_LABELS[squadKey]}</strong>
                  <span>Guild Pool: {poolTotal} available ({allocatedGlobal} allocated globally)</span>
                </div>

                <div className="counter-controls">
                  <button onClick={() => updateAllocation(squadKey, false)} disabled={allocatedHere <= 0}>
                    -
                  </button>
                  <span className="counter-val">{allocatedHere}</span>
                  <button onClick={() => updateAllocation(squadKey, true)} disabled={allocatedGlobal >= poolTotal}>
                    +
                  </button>
                </div>

                {exceedsPool && (
                  <span className="squad-limit-warning">⚠️ Limit exceeded: Only {poolTotal} in guild.</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="directives-exporter-section">
          <h3>Copy Directives to Game / Discord</h3>
          <textarea className="directives-output" readOnly value={compiledDirectives} />
          <button className="copy-directives-btn account-link-button" onClick={handleCopy}>
            {copied ? "✓ Copied to Clipboard" : "Copy Directives"}
          </button>
        </div>
      </div>
    </div>
  );
}
