"use client";

import { useState, useMemo } from "react";
import { ROTE_PLANNER_DATA, type RotePhase } from "@/lib/territory-battles";

type MemberGp = {
  playerId: string;
  name: string;
  characterPower: bigint;
  shipPower: bigint;
  galacticPower: bigint;
};

type TbPlannerProps = {
  members: MemberGp[];
  initialCharacterGp: bigint;
  initialShipGp: bigint;
};

type AllocationState = {
  [zoneId: string]: {
    targetStars: 0 | 1 | 2 | 3;
    isPreload: boolean;
    manualGp: number; // in millions
  };
};

export default function TbPlanner({ members, initialCharacterGp, initialShipGp }: TbPlannerProps) {
  const [selectedPhaseNum, setSelectedPhaseNum] = useState<number>(1);
  const [allocations, setAllocations] = useState<AllocationState>({});

  // Convert guild GP to millions
  const guildCharacterGpMax = useMemo(() => Number(initialCharacterGp / BigInt(1_000_000)), [initialCharacterGp]);
  const guildShipGpMax = useMemo(() => Number(initialShipGp / BigInt(1_000_000)), [initialShipGp]);
  const guildTotalGpMax = guildCharacterGpMax + guildShipGpMax;

  const currentPhase: RotePhase = useMemo(() => {
    return ROTE_PLANNER_DATA.find((p) => p.phase === selectedPhaseNum) ?? ROTE_PLANNER_DATA[0];
  }, [selectedPhaseNum]);

  // Initialize phase allocations if not present
  const phaseAllocations = useMemo(() => {
    const nextState = { ...allocations };
    let changed = false;
    currentPhase.zones.forEach((zone) => {
      if (!nextState[zone.id]) {
        nextState[zone.id] = {
          targetStars: 0,
          isPreload: false,
          manualGp: 0,
        };
        changed = true;
      }
    });
    if (changed) {
      // Don't update state inside render directly to avoid React warning, return nextState
      return nextState;
    }
    return allocations;
  }, [currentPhase, allocations]);

  // Helper function to update specific zone allocations
  const updateAllocation = (zoneId: string, updates: Partial<AllocationState[string]>) => {
    setAllocations((prev) => {
      const zoneState = prev[zoneId] || { targetStars: 0, isPreload: false, manualGp: 0 };
      const nextZoneState = { ...zoneState, ...updates };

      // Sync manual GP with star target choices if stars or preload change
      const zone = currentPhase.zones.find((z) => z.id === zoneId);
      if (zone) {
        if ("isPreload" in updates && updates.isPreload) {
          nextZoneState.targetStars = 0;
          nextZoneState.manualGp = Math.max(0, zone.stars[0] - 1); // 1M under 1 star
        } else if ("targetStars" in updates) {
          const stars = updates.targetStars ?? 0;
          if (stars > 0) {
            nextZoneState.isPreload = false;
            nextZoneState.manualGp = zone.stars[stars - 1];
          } else if (stars === 0 && !nextZoneState.isPreload) {
            nextZoneState.manualGp = 0;
          }
        }
      }

      return {
        ...prev,
        [zoneId]: nextZoneState,
      };
    });
  };

  // Calculations for current configuration
  const calculations = useMemo(() => {
    let allocatedCharacterGp = 0;
    let allocatedShipGp = 0;

    currentPhase.zones.forEach((zone) => {
      const state = phaseAllocations[zone.id] || { targetStars: 0, isPreload: false, manualGp: 0 };
      if (zone.type === "character") {
        allocatedCharacterGp += state.manualGp;
      } else {
        allocatedShipGp += state.manualGp;
      }
    });

    const remainingCharacterGp = guildCharacterGpMax - allocatedCharacterGp;
    const remainingShipGp = guildShipGpMax - allocatedShipGp;

    return {
      allocatedCharacterGp,
      allocatedShipGp,
      remainingCharacterGp,
      remainingShipGp,
    };
  }, [currentPhase, phaseAllocations, guildCharacterGpMax, guildShipGpMax]);

  // Automated layout optimizer
  const autoOptimize = () => {
    const optimized: AllocationState = { ...allocations };
    
    // Reset current phase zones
    currentPhase.zones.forEach((zone) => {
      optimized[zone.id] = { targetStars: 0, isPreload: false, manualGp: 0 };
    });

    let characterReserves = guildCharacterGpMax;
    let shipReserves = guildShipGpMax;

    // Allocate Fleet (Ships) first
    const fleetZone = currentPhase.zones.find((z) => z.type === "ship");
    if (fleetZone) {
      if (shipReserves >= fleetZone.stars[2]) {
        optimized[fleetZone.id] = { targetStars: 3, isPreload: false, manualGp: fleetZone.stars[2] };
        shipReserves -= fleetZone.stars[2];
      } else if (shipReserves >= fleetZone.stars[1]) {
        optimized[fleetZone.id] = { targetStars: 2, isPreload: false, manualGp: fleetZone.stars[1] };
        shipReserves -= fleetZone.stars[1];
      } else if (shipReserves >= fleetZone.stars[0]) {
        optimized[fleetZone.id] = { targetStars: 1, isPreload: false, manualGp: fleetZone.stars[0] };
        shipReserves -= fleetZone.stars[0];
      } else if (shipReserves > 0) {
        optimized[fleetZone.id] = { targetStars: 0, isPreload: true, manualGp: Math.max(0, fleetZone.stars[0] - 1) };
      }
    }

    // Allocate character GP greedily to get at least 1 star everywhere possible, prioritising Mixed
    const charZones = currentPhase.zones.filter((z) => z.type === "character");
    // Sort mixed first, then light, then dark (Mixed allows ships but ROTE is ground-mixed, mostly character GP anyway)
    const sortedCharZones = [...charZones].sort((a, b) => {
      if (a.faction === "mixed" && b.faction !== "mixed") return -1;
      if (b.faction === "mixed" && a.faction !== "mixed") return 1;
      return a.stars[0] - b.stars[0];
    });

    // Step 1: Try to get 1 star in each ground zone
    sortedCharZones.forEach((zone) => {
      if (characterReserves >= zone.stars[0]) {
        optimized[zone.id] = { targetStars: 1, isPreload: false, manualGp: zone.stars[0] };
        characterReserves -= zone.stars[0];
      } else {
        // Pre-load what is left if we can't hit 1 star
        const preloadGp = Math.min(characterReserves, zone.stars[0] - 1);
        optimized[zone.id] = { targetStars: 0, isPreload: preloadGp > 0, manualGp: preloadGp };
        characterReserves -= preloadGp;
      }
    });

    // Step 2: Upgrade zones to 2 or 3 stars with remaining reserves
    if (characterReserves > 0) {
      sortedCharZones.forEach((zone) => {
        const state = optimized[zone.id];
        if (state.targetStars === 1) {
          const costToUpgrade2 = zone.stars[1] - zone.stars[0];
          if (characterReserves >= costToUpgrade2) {
            optimized[zone.id] = { targetStars: 2, isPreload: false, manualGp: zone.stars[1] };
            characterReserves -= costToUpgrade2;
          }
        }
      });
    }

    if (characterReserves > 0) {
      sortedCharZones.forEach((zone) => {
        const state = optimized[zone.id];
        if (state.targetStars === 2) {
          const costToUpgrade3 = zone.stars[2] - zone.stars[1];
          if (characterReserves >= costToUpgrade3) {
            optimized[zone.id] = { targetStars: 3, isPreload: false, manualGp: zone.stars[2] };
            characterReserves -= costToUpgrade3;
          }
        }
      });
    }

    setAllocations(optimized);
  };

  // Generate copyable text for Discord
  const discordTemplate = useMemo(() => {
    let text = `📢 **BLUES BROTHERS TB STRATEGY · PHASE ${selectedPhaseNum} PLAN** 📢\n`;
    text += `==============================================\n`;
    
    currentPhase.zones.forEach((zone) => {
      const state = phaseAllocations[zone.id] || { targetStars: 0, isPreload: false, manualGp: 0 };
      const icon = zone.faction === "dark" ? "🔴" : zone.faction === "light" ? "🔵" : zone.faction === "mixed" ? "🟢" : "🚀";
      const starLabel = state.targetStars === 3 ? "★★★ [3 Stars]" : state.targetStars === 2 ? "★★☆ [2 Stars]" : state.targetStars === 1 ? "★☆☆ [1 Star]" : state.isPreload ? "☆☆☆ [Pre-load ⏳]" : "☆☆☆ [No Target]";
      
      if (state.manualGp > 0) {
        text += `${icon} **${zone.name}:** Deploy **${state.manualGp}M** GP (${starLabel})\n`;
      }
    });

    const charRem = calculations.remainingCharacterGp.toFixed(1);
    const shipRem = calculations.remainingShipGp.toFixed(1);
    text += `==============================================\n`;
    text += `*Remaining reserves: ${charRem}M Character GP · ${shipRem}M Ship GP*\n`;
    text += `*Assigned members: Please deploy characters and ships according to active targets!*`;
    
    return text;
  }, [selectedPhaseNum, currentPhase, phaseAllocations, calculations]);

  return (
    <div className="tb-strategy-tool">
      <div className="roster-tools tb-phase-selector">
        <div className="phase-buttons">
          {[1, 2, 3, 4, 5, 6].map((pNum) => (
            <button
              key={pNum}
              type="button"
              className={selectedPhaseNum === pNum ? "selected-phase" : ""}
              onClick={() => setSelectedPhaseNum(pNum)}
            >
              Phase {pNum}
            </button>
          ))}
        </div>
        <button type="button" className="btn-optimize" onClick={autoOptimize}>
          ⚡ Auto-Allocate GP
        </button>
      </div>

      <div className="tb-planner-grid">
        <div className="tb-zones-list">
          {currentPhase.zones.map((zone) => {
            const state = phaseAllocations[zone.id] || { targetStars: 0, isPreload: false, manualGp: 0 };
            
            // Calculate progress percentages
            const maxVal = zone.stars[2];
            const pct = Math.min(100, (state.manualGp / maxVal) * 100);
            
            // Determine active star rating
            let starRating = 0;
            if (state.manualGp >= zone.stars[2]) starRating = 3;
            else if (state.manualGp >= zone.stars[1]) starRating = 2;
            else if (state.manualGp >= zone.stars[0]) starRating = 1;

            return (
              <div className={`tb-zone-card ${zone.faction}`} key={zone.id}>
                <div className="zone-header">
                  <div>
                    <span className="zone-badge">{zone.faction.toUpperCase()}</span>
                    <h3>{zone.name}</h3>
                  </div>
                  <div className="zone-stars-indicator">
                    <span className={starRating >= 1 ? "gold-star" : "empty-star"}>★</span>
                    <span className={starRating >= 2 ? "gold-star" : "empty-star"}>★</span>
                    <span className={starRating >= 3 ? "gold-star" : "empty-star"}>★</span>
                  </div>
                </div>

                <div className="zone-thresholds">
                  <span>1★: <b>{zone.stars[0]}M</b></span>
                  <span>2★: <b>{zone.stars[1]}M</b></span>
                  <span>3★: <b>{zone.stars[2]}M</b></span>
                </div>

                <div className="zone-controls">
                  <div className="star-toggles">
                    <button
                      type="button"
                      className={state.targetStars === 0 && !state.isPreload ? "active" : ""}
                      onClick={() => updateAllocation(zone.id, { targetStars: 0, isPreload: false })}
                    >
                      0★
                    </button>
                    <button
                      type="button"
                      className={state.isPreload ? "active pre-toggle" : ""}
                      onClick={() => updateAllocation(zone.id, { isPreload: true })}
                    >
                      Pre-load
                    </button>
                    <button
                      type="button"
                      className={state.targetStars === 1 ? "active" : ""}
                      onClick={() => updateAllocation(zone.id, { targetStars: 1 })}
                    >
                      1★
                    </button>
                    <button
                      type="button"
                      className={state.targetStars === 2 ? "active" : ""}
                      onClick={() => updateAllocation(zone.id, { targetStars: 2 })}
                    >
                      2★
                    </button>
                    <button
                      type="button"
                      className={state.targetStars === 3 ? "active" : ""}
                      onClick={() => updateAllocation(zone.id, { targetStars: 3 })}
                    >
                      3★
                    </button>
                  </div>

                  <div className="gp-input-adjuster">
                    <label>
                      <span>Allocated GP (M):</span>
                      <input
                        type="number"
                        min="0"
                        max={zone.stars[2] + 100}
                        value={state.manualGp}
                        onChange={(e) => updateAllocation(zone.id, { manualGp: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                </div>

                <div className="zone-progress">
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    {zone.stars.map((starVal, idx) => (
                      <span
                        key={idx}
                        className="threshold-pin"
                        style={{ left: `${(starVal / maxVal) * 100}%` }}
                        title={`${idx + 1} Star: ${starVal}M`}
                      />
                    ))}
                  </div>
                  <div className="progress-stats">
                    <span>{state.manualGp}M deployed</span>
                    <span>Target: {state.isPreload ? `${zone.stars[0] - 1}M (Preload)` : state.targetStars > 0 ? `${zone.stars[state.targetStars - 1]}M` : "0M"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="tb-sidebar-panels">
          <div className="tb-summary-card">
            <h3>Deployment Balance</h3>
            <div className="balance-row" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "8px", marginBottom: "12px" }}>
              <span>Total Guild Power</span>
              <strong>{guildTotalGpMax.toFixed(1)}M</strong>
            </div>
            
            <div className="balance-row">
              <span>Ground (Character GP)</span>
              <strong>{calculations.allocatedCharacterGp}M / {guildCharacterGpMax}M</strong>
            </div>
            <div className="balance-bar">
              <div
                className={`balance-fill ${calculations.remainingCharacterGp < 0 ? "overallocated" : ""}`}
                style={{ width: `${Math.min(100, (calculations.allocatedCharacterGp / guildCharacterGpMax) * 100)}%` }}
              />
            </div>
            {calculations.remainingCharacterGp < 0 && (
              <span className="balance-error">⚠️ Over-allocated by {Math.abs(calculations.remainingCharacterGp).toFixed(1)}M Character GP</span>
            )}

            <div className="balance-row margin-top-20">
              <span>Fleets (Ship GP)</span>
              <strong>{calculations.allocatedShipGp}M / {guildShipGpMax}M</strong>
            </div>
            <div className="balance-bar">
              <div
                className={`balance-fill ${calculations.remainingShipGp < 0 ? "overallocated" : ""}`}
                style={{ width: `${Math.min(100, (calculations.allocatedShipGp / guildShipGpMax) * 100)}%` }}
              />
            </div>
            {calculations.remainingShipGp < 0 && (
              <span className="balance-error">⚠️ Over-allocated by {Math.abs(calculations.remainingShipGp).toFixed(1)}M Ship GP</span>
            )}
          </div>

          <div className="tb-discord-exporter">
            <h3>Discord Copy-Paste Directive</h3>
            <p className="exporter-desc">Copy this allocation strategy to post directly to your guild&apos;s TB channels.</p>
            <textarea
              readOnly
              value={discordTemplate}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(discordTemplate);
                alert("Copied strategy directive to clipboard!");
              }}
            >
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      </div>

      <div className="tb-roster-breakdown margin-top-20" style={{ marginTop: "40px", borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
        <h3>Individual Guild GP Reference</h3>
        <p className="exporter-desc" style={{ marginBottom: "16px" }}>Use this list to identify members with the highest character or ship GP to assign to critical special zones.</p>
        <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.2)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.03)" }}>
                <th style={{ padding: "10px" }}>Member</th>
                <th style={{ padding: "10px" }}>Character GP</th>
                <th style={{ padding: "10px" }}>Ship GP</th>
                <th style={{ padding: "10px" }}>Total GP</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.playerId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "10px", fontWeight: "600" }}>{member.name}</td>
                  <td style={{ padding: "10px" }}>{(Number(member.characterPower) / 1_000_000).toFixed(2)}M</td>
                  <td style={{ padding: "10px" }}>{(Number(member.shipPower) / 1_000_000).toFixed(2)}M</td>
                  <td style={{ padding: "10px" }}>{(Number(member.galacticPower) / 1_000_000).toFixed(2)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
