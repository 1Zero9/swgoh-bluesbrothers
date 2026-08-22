"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { GuildArsenalCategory, GuildArsenalOwner } from "@/lib/guild-arsenal";

type ArsenalInteractiveProps = {
  categories: GuildArsenalCategory[];
  syncedMembers: number;
};

type FilterMode = "all" | "relic5" | "relic1" | "sevenStar";

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default function ArsenalInteractive({ categories, syncedMembers }: ArsenalInteractiveProps) {
  const [selectedUnit, setSelectedUnit] = useState<{
    name: string;
    definitionId: string;
    owners: GuildArsenalOwner[];
    isShip: boolean;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedUnit && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [selectedUnit]);

  // Filter owners based on query and gear/relic thresholds
  const filteredOwners = useMemo(() => {
    if (!selectedUnit) return [];
    
    return selectedUnit.owners.filter((owner) => {
      const matchesSearch = owner.playerName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;

      switch (filterMode) {
        case "relic5":
          return owner.relicTier >= 5;
        case "relic1":
          return owner.relicTier >= 1;
        case "sevenStar":
          return owner.rarity >= 7;
        default:
          return true;
      }
    });
  }, [selectedUnit, searchQuery, filterMode]);

  return (
    <>
      <div className="arsenal-sections">
        {categories.map((category) => (
          <section className="arsenal-category" key={category.name}>
            <header>
              <div>
                <p className="eyebrow">Collection coverage</p>
                <h2>{category.name}</h2>
              </div>
              <strong>{category.coverage}<span>%</span><small>owned</small></strong>
            </header>
            <div className="arsenal-grid">
              {category.units.map((unit) => {
                const ownedPct = percentage(unit.owned, syncedMembers);
                const isShip = category.name === "Capital Ships";
                return (
                  <button
                    className="arsenal-card interactive-card"
                    key={unit.definitionId}
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterMode("all");
                      setSelectedUnit({
                        name: unit.name,
                        definitionId: unit.definitionId,
                        owners: unit.owners,
                        isShip,
                      });
                    }}
                    style={{ textAlign: "left", width: "100%", cursor: "pointer", border: "1px solid var(--line)" }}
                  >
                    <div className="arsenal-card-head">
                      <span aria-hidden="true">{unit.name.charAt(0)}</span>
                      <div>
                        <h3>{unit.name}</h3>
                        <p>{unit.owned} of {syncedMembers} members</p>
                      </div>
                      <strong>{ownedPct}%</strong>
                    </div>
                    <div className="arsenal-track">
                      <i style={{ width: `${ownedPct}%` }} />
                    </div>
                    <div className="arsenal-stats">
                      <span><small>Owned</small><strong>{unit.owned}</strong></span>
                      <span><small>7 star</small><strong>{unit.sevenStar}</strong></span>
                      {isShip ? (
                        <span><small>Coverage</small><strong>{ownedPct}%</strong></span>
                      ) : (
                        <span><small>R5+</small><strong>{unit.relicFive}</strong></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <dialog
        className="member-dialog arsenal-detail-dialog"
        ref={dialogRef}
        aria-labelledby="arsenal-unit-title"
        onClose={() => setSelectedUnit(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        {selectedUnit && (
          <div className="member-profile">
            <button className="member-dialog-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close unit card">×</button>
            <div className="profile-hero">
              <span className="profile-avatar" aria-hidden="true">{selectedUnit.name.charAt(0)}</span>
              <div>
                <p>Guild Roster Coverage Planner</p>
                <h3 id="arsenal-unit-title">{selectedUnit.name}</h3>
                <span>{selectedUnit.owners.length} of {syncedMembers} synced members own this unit</span>
              </div>
            </div>

            {/* Filters panel */}
            <div className="roster-tools" style={{ gridTemplateColumns: "1fr auto", gap: "16px", marginTop: "24px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <label className="roster-search" style={{ margin: 0 }}>
                <span>Search owners</span>
                <input
                  type="text"
                  placeholder="Filter by player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
              <label className="roster-sort" style={{ margin: 0 }}>
                <span>Threshold</span>
                <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as FilterMode)}>
                  <option value="all">All Owners</option>
                  <option value="sevenStar">7-Star (7★) Only</option>
                  {!selectedUnit.isShip && <option value="relic1">Relic 1+ (R1+)</option>}
                  {!selectedUnit.isShip && <option value="relic5">Relic 5+ (R5+)</option>}
                </select>
              </label>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#c0b19d", letterSpacing: "0.08em", marginBottom: "12px" }}>
                Roster Detail ({filteredOwners.length} members match)
              </h4>
              
              {filteredOwners.length > 0 ? (
                <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.25)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.04)" }}>
                        <th style={{ padding: "10px 12px" }}>Member Name</th>
                        <th style={{ padding: "10px 12px", textAlign: "center" }}>Stars</th>
                        <th style={{ padding: "10px 12px", textAlign: "center" }}>Gear / Relic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOwners.map((owner) => (
                        <tr key={owner.playerName} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: "600" }}>{owner.playerName}</td>
                          <td style={{ padding: "10px 12px", textAlign: "center", color: owner.rarity >= 7 ? "#ffd873" : "#fff" }}>
                            {owner.rarity}★
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            {owner.relicTier > 0 ? (
                              <span style={{ color: "#67b8ff", fontWeight: "600" }}>Relic {owner.relicTier}</span>
                            ) : (
                              <span style={{ color: "#a99b8b" }}>Gear {owner.gearTier}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", padding: "20px" }}>
                  No guild members match the selected criteria.
                </p>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
