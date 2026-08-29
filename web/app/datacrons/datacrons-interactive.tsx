"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  type GuildDatacron,
  type DatacronGuildSummary,
  type DatacronSetDefinition,
  type DatacronTier,
} from "@/lib/datacrons";

type TabId = "vault" | "codex" | "tw-synergy" | "reroll-guide";

type Props = {
  initialData: {
    datacrons: GuildDatacron[];
    summary: DatacronGuildSummary;
    activeSets: DatacronSetDefinition[];
    syncedMemberCount: number;
  };
};

export default function DatacronsInteractive({ initialData }: Props) {
  const { datacrons, summary, activeSets, syncedMemberCount } = initialData;
  const [activeTab, setActiveTab] = useState<TabId>("vault");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSet, setSelectedSet] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [expandedSetId, setExpandedSetId] = useState<string>(activeSets[0]?.id || "set-20");

  // Filtered guild datacrons
  const filteredDatacrons = useMemo(() => {
    return datacrons.filter((dc) => {
      if (selectedSet !== "all" && dc.setId !== selectedSet) return false;
      if (selectedTier === "l9" && dc.level < 9) return false;
      if (selectedTier === "l6" && (dc.level < 6 || dc.level >= 9)) return false;
      if (selectedTier === "l3" && (dc.level < 3 || dc.level >= 6)) return false;
      if (selectedOwner !== "all" && dc.ownerName !== selectedOwner) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        dc.ownerName.toLowerCase().includes(q) ||
        dc.setName.toLowerCase().includes(q) ||
        (dc.characterTarget && dc.characterTarget.toLowerCase().includes(q)) ||
        (dc.factionTarget && dc.factionTarget.toLowerCase().includes(q)) ||
        (dc.abilitySummary && dc.abilitySummary.toLowerCase().includes(q)) ||
        dc.stats.some((s) => s.stat.toLowerCase().includes(q))
      );
    });
  }, [datacrons, selectedSet, selectedTier, selectedOwner, searchQuery]);

  return (
    <div className="datacrons-page-wrap" aria-label="Guild Datacrons Console">
      {/* TACTICAL KPI OVERVIEW CARDS */}
      <section className="datacron-kpi-grid" aria-label="Datacron Vault Metrics">
        <article className="dc-kpi-card card-glow-gold">
          <div className="kpi-icon-wrap">
            <span className="dc-gem gem-gold">💎</span>
          </div>
          <div className="kpi-info">
            <span className="kpi-tag">Level 9 Super-Weapons</span>
            <strong className="kpi-value">{summary.level9Count}</strong>
            <small>Character-Specific Meta Modifiers</small>
          </div>
        </article>

        <article className="dc-kpi-card card-glow-purple">
          <div className="kpi-icon-wrap">
            <span className="dc-gem gem-purple">🔮</span>
          </div>
          <div className="kpi-info">
            <span className="kpi-tag">Level 6 Faction Boosts</span>
            <strong className="kpi-value">{summary.level6Count}</strong>
            <small>Faction Synergy Amplifiers</small>
          </div>
        </article>

        <article className="dc-kpi-card card-glow-cyan">
          <div className="kpi-icon-wrap">
            <span className="dc-gem gem-cyan">🛡️</span>
          </div>
          <div className="kpi-info">
            <span className="kpi-tag">Total Guild Vault</span>
            <strong className="kpi-value">{summary.totalDatacrons}</strong>
            <small>Across {syncedMemberCount} active members</small>
          </div>
        </article>

        <article className="dc-kpi-card card-glow-emerald">
          <div className="kpi-icon-wrap">
            <span className="dc-gem gem-emerald">⚡</span>
          </div>
          <div className="kpi-info">
            <span className="kpi-tag">Active Meta Seasons</span>
            <strong className="kpi-value">{activeSets.length} Sets</strong>
            <small>Set 20 (52d) · Set 19 (24d) · Set 18 (8d)</small>
          </div>
        </article>
      </section>

      {/* MAIN NAVIGATION TABS */}
      <nav className="dc-main-nav" aria-label="Datacrons Views">
        <button
          type="button"
          className={`dc-tab-btn${activeTab === "vault" ? " is-active" : ""}`}
          onClick={() => setActiveTab("vault")}
        >
          <span>🛡️</span>
          <strong>Guild Datacron Vault</strong>
          <span className="dc-tab-count">{datacrons.length}</span>
        </button>

        <button
          type="button"
          className={`dc-tab-btn${activeTab === "codex" ? " is-active" : ""}`}
          onClick={() => setActiveTab("codex")}
        >
          <span>💎</span>
          <strong>Active Sets &amp; Meta Codex</strong>
          <span className="dc-tab-badge">SWGOH Meta</span>
        </button>

        <button
          type="button"
          className={`dc-tab-btn${activeTab === "tw-synergy" ? " is-active" : ""}`}
          onClick={() => setActiveTab("tw-synergy")}
        >
          <span>⚔️</span>
          <strong>TW Command Synergies</strong>
          <span className="dc-tab-badge">War Room</span>
        </button>

        <button
          type="button"
          className={`dc-tab-btn${activeTab === "reroll-guide" ? " is-active" : ""}`}
          onClick={() => setActiveTab("reroll-guide")}
        >
          <span>🧪</span>
          <strong>Reroll &amp; Farming Advisor</strong>
          <span className="dc-tab-badge">Guide</span>
        </button>
      </nav>

      {/* TAB 1: GUILD DATACRON VAULT (INVENTORY) */}
      {activeTab === "vault" && (
        <section className="vault-section" aria-labelledby="vault-heading">
          {/* Controls & Filter Bar */}
          <div className="vault-controls-bar">
            {/* Search Input */}
            <div className="vault-search-wrap">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="search"
                placeholder="Search character, faction, member name, or stat (e.g. Vader, Defense, Elwood)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="vault-search-input"
                aria-label="Search guild datacrons"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Pills */}
            <div className="vault-filters-group">
              {/* Tier Filter */}
              <div className="filter-pill-group" role="radiogroup" aria-label="Tier filter">
                <button
                  type="button"
                  className={`filter-pill${selectedTier === "all" ? " is-active" : ""}`}
                  onClick={() => setSelectedTier("all")}
                >
                  All Tiers ({datacrons.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill pill-gold${selectedTier === "l9" ? " is-active" : ""}`}
                  onClick={() => setSelectedTier("l9")}
                >
                  Level 9 ({summary.level9Count})
                </button>
                <button
                  type="button"
                  className={`filter-pill pill-purple${selectedTier === "l6" ? " is-active" : ""}`}
                  onClick={() => setSelectedTier("l6")}
                >
                  Level 6 ({summary.level6Count})
                </button>
                <button
                  type="button"
                  className={`filter-pill pill-cyan${selectedTier === "l3" ? " is-active" : ""}`}
                  onClick={() => setSelectedTier("l3")}
                >
                  Level 3-5 ({summary.level3Count})
                </button>
              </div>

              {/* Set Filter */}
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
                className="vault-select"
                aria-label="Filter by Datacron Set"
              >
                <option value="all">All Active Sets</option>
                {activeSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Owner Filter */}
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="vault-select"
                aria-label="Filter by Member"
              >
                <option value="all">All Guild Members</option>
                {summary.topOwners.map((o) => (
                  <option key={o.playerName} value={o.playerName}>
                    {o.playerName} ({o.totalCount} datacrons, {o.l9Count} L9)
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="view-mode-toggle" role="radiogroup" aria-label="View mode">
                <button
                  type="button"
                  className={viewMode === "cards" ? "active" : ""}
                  onClick={() => setViewMode("cards")}
                  title="Card View"
                >
                  ▦ Cards
                </button>
                <button
                  type="button"
                  className={viewMode === "table" ? "active" : ""}
                  onClick={() => setViewMode("table")}
                  title="Table View"
                >
                  ☰ Table
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT SPLIT: VAULT GRID / TABLE + LEADERBOARD SIDEBAR */}
          <div className="vault-layout-grid">
            {/* LEFT / CENTER: DATACRON CARDS OR TABLE */}
            <div className="vault-main-col">
              <div className="vault-result-summary">
                <span>Showing <strong>{filteredDatacrons.length}</strong> of <strong>{datacrons.length}</strong> guild datacrons</span>
                {(selectedTier !== "all" || selectedSet !== "all" || selectedOwner !== "all" || searchQuery) && (
                  <button
                    type="button"
                    className="reset-filters-btn"
                    onClick={() => {
                      setSelectedTier("all");
                      setSelectedSet("all");
                      setSelectedOwner("all");
                      setSearchQuery("");
                    }}
                  >
                    Reset all filters
                  </button>
                )}
              </div>

              {filteredDatacrons.length === 0 ? (
                <div className="no-datacrons-card">
                  <span className="empty-icon">💎</span>
                  <h4>No Datacrons Matched Your Filter</h4>
                  <p>Try adjusting your search query, tier filter, or member selection.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTier("all");
                      setSelectedSet("all");
                      setSelectedOwner("all");
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : viewMode === "cards" ? (
                <div className="datacron-cards-grid">
                  {filteredDatacrons.map((dc) => (
                    <article
                      key={dc.id}
                      className={`datacron-card dc-tier-${dc.level === 9 ? "gold" : dc.level >= 6 ? "purple" : "cyan"}`}
                    >
                      {/* Card Top Banner */}
                      <div className="dc-card-head">
                        <div className="dc-level-badge">
                          <span className="dc-level-num">L{dc.level}</span>
                          <span className="dc-level-tag">
                            {dc.level === 9 ? "Character" : dc.level >= 6 ? "Faction" : "Alignment"}
                          </span>
                        </div>

                        <div className="dc-set-info">
                          <span className="dc-set-code">{dc.setName.split(":")[0]}</span>
                          <span className={`dc-align-badge align-${dc.alignmentTarget?.toLowerCase() || "dark"}`}>
                            {dc.alignmentTarget === "LIGHT" ? "Light Side" : "Dark Side"}
                          </span>
                        </div>
                      </div>

                      {/* Card Target Title */}
                      <div className="dc-target-block">
                        <h4 className="dc-target-name">
                          {dc.characterTarget ? (
                            <span className="highlight-target">⭐ {dc.characterTarget}</span>
                          ) : dc.factionTarget ? (
                            <span>🛡️ {dc.factionTarget}</span>
                          ) : (
                            <span>⚖️ {dc.alignmentTarget} Alignment</span>
                          )}
                        </h4>
                        {dc.factionTarget && dc.characterTarget && (
                          <span className="dc-faction-sub">{dc.factionTarget} Faction</span>
                        )}
                      </div>

                      {/* Ability Description */}
                      {dc.abilitySummary && (
                        <p className="dc-ability-desc">&ldquo;{dc.abilitySummary}&rdquo;</p>
                      )}

                      {/* Rolled Stat Affixes */}
                      <div className="dc-stats-tray">
                        <span className="stats-label">Rolled Affix Stats:</span>
                        <div className="stats-pills">
                          {dc.stats.map((st, sIdx) => (
                            <span key={sIdx} className="stat-pill">
                              <strong className="stat-name">{st.stat}</strong>
                              <span className="stat-val">{st.value}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer: Owner & TW Command Suitability */}
                      <div className="dc-card-foot">
                        <div className="dc-owner-info">
                          <span className="owner-avatar">👤</span>
                          <div>
                            <strong className="owner-name">{dc.ownerName}</strong>
                            <small className="reroll-tag">{dc.rerollCount} reroll(s)</small>
                          </div>
                        </div>

                        {dc.recommendedCommand && (
                          <Link
                            href="/territory-war"
                            className="dc-tw-action-link"
                            title="View Territory War squad plans"
                          >
                            <span>⚔️</span> TW Ready
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                /* TABLE VIEW MODE */
                <div className="datacron-table-card">
                  <div className="dc-tbl-head">
                    <span>Lvl</span>
                    <span>Target &amp; Ability</span>
                    <span>Set</span>
                    <span>Rolled Stats</span>
                    <span>Owner</span>
                    <span className="th-action">TW Role</span>
                  </div>
                  <div className="dc-tbl-body">
                    {filteredDatacrons.map((dc) => (
                      <div
                        key={dc.id}
                        className={`dc-tbl-row dc-tier-${dc.level === 9 ? "gold" : dc.level >= 6 ? "purple" : "cyan"}`}
                      >
                        <span className="tbl-lvl-badge">L{dc.level}</span>
                        <div className="tbl-target-col">
                          <strong>
                            {dc.characterTarget ? `⭐ ${dc.characterTarget}` : dc.factionTarget ? `🛡️ ${dc.factionTarget}` : `⚖️ ${dc.alignmentTarget}`}
                          </strong>
                          <small>{dc.abilitySummary ? dc.abilitySummary.slice(0, 100) + "…" : "Stat enhancement datacron"}</small>
                        </div>
                        <span className="tbl-set-code">{dc.setName.split(":")[0]}</span>
                        <div className="tbl-stats-col">
                          {dc.stats.map((st, sIdx) => (
                            <span key={sIdx} className="tbl-stat-chip">
                              {st.stat}: <b>{st.value}</b>
                            </span>
                          ))}
                        </div>
                        <div className="tbl-owner-col">
                          <strong>{dc.ownerName}</strong>
                          <small>{dc.rerollCount} rerolls</small>
                        </div>
                        <div className="tbl-action-col">
                          <span className={`tw-suit-badge suit-${dc.twSuitability.toLowerCase()}`}>
                            {dc.twSuitability === "OPTIMAL_DEFENCE" ? "🛡️ Defence" : "⚡ Offence"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: MEMBER LEADERBOARD & SIGNATURE WEAPONS */}
            <aside className="vault-sidebar">
              {/* Member Datacron Leaderboard */}
              <div className="sidebar-card">
                <div className="sb-card-head">
                  <h4>🏆 Guild Datacron Leaders</h4>
                  <small>Ranked by Level 9s &amp; Total</small>
                </div>
                <div className="sb-leaderboard-list">
                  {summary.topOwners.slice(0, 10).map((owner, rank) => (
                    <div
                      key={owner.playerName}
                      className={`sb-leader-row${selectedOwner === owner.playerName ? " is-selected" : ""}`}
                      onClick={() => setSelectedOwner(selectedOwner === owner.playerName ? "all" : owner.playerName)}
                      title={`Filter by ${owner.playerName}`}
                    >
                      <span className="rank-num">#{rank + 1}</span>
                      <strong className="rank-name">{owner.playerName}</strong>
                      <div className="rank-badges">
                        {owner.l9Count > 0 && (
                          <span className="badge-l9" title="Level 9 Datacrons">
                            ⭐ {owner.l9Count}
                          </span>
                        )}
                        <span className="badge-total" title="Total Datacrons">
                          {owner.totalCount} total
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Level 9 Weapon Roster */}
              <div className="sidebar-card">
                <div className="sb-card-head">
                  <h4>⭐ Signature L9 Roster</h4>
                  <small>Guild availability for TW</small>
                </div>
                <div className="sb-char-list">
                  {summary.characterDatacrons.map((c) => (
                    <div
                      key={c.character}
                      className="sb-char-row"
                      onClick={() => setSearchQuery(c.character)}
                      title={`Filter by ${c.character}`}
                    >
                      <div>
                        <strong>{c.character}</strong>
                        <small>{c.owners.join(", ")}</small>
                      </div>
                      <span className="char-count-pill">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* TAB 2: ACTIVE SETS & META CODEX */}
      {activeTab === "codex" && (
        <section className="codex-section" aria-labelledby="codex-heading">
          <div className="signature-heading">
            <div>
              <span>01</span>
              <h3 id="codex-heading">Active SWGOH Datacron Sets &amp; Ability Codex</h3>
            </div>
            <p>Comprehensive tactical breakdown of currently active seasons, tier mechanics, and squad synergies.</p>
          </div>

          <div className="codex-set-accordion">
            {activeSets.map((set) => {
              const isExpanded = expandedSetId === set.id;

              return (
                <article key={set.id} className={`codex-set-card${isExpanded ? " is-expanded" : ""}`}>
                  <header
                    className="set-header"
                    onClick={() => setExpandedSetId(isExpanded ? "" : set.id)}
                  >
                    <div className="set-title-row">
                      <span className="set-season-badge">Season {set.seasonNumber}</span>
                      <h4>{set.name}</h4>
                      <span className="set-expiry-chip">⏳ Expires in {set.expiresInDays} days</span>
                    </div>

                    <div className="set-factions-row">
                      <span className="factions-label">Supported Factions:</span>
                      {set.factions.map((f) => (
                        <span key={f} className="faction-tag">
                          {f}
                        </span>
                      ))}
                      <span className="accordion-toggle-icon">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </header>

                  {isExpanded && (
                    <div className="set-body">
                      <p className="set-theme-desc"><strong>Theme:</strong> {set.theme}</p>

                      {/* TIER 9 SIGNATURE CHARACTER PERKS */}
                      <div className="set-tier-block">
                        <div className="tier-block-head head-gold">
                          <h5>⭐ Level 9 Signature Character Perks</h5>
                          <small>Character-specific game changers</small>
                        </div>
                        <div className="tier9-cards-grid">
                          {set.tier9Perks.map((t9) => (
                            <div key={t9.characterId} className="tier9-perk-card">
                              <div className="t9-head">
                                <h6>{t9.characterName}</h6>
                                <span className={`tw-tier-badge tier-${t9.twTier.toLowerCase()}`}>
                                  {t9.twTier.replace("_", "+")} Tier
                                </span>
                              </div>
                              <strong className="t9-title">{t9.title}</strong>
                              <p className="t9-desc">&ldquo;{t9.description}&rdquo;</p>
                              <div className="t9-pairing">
                                <strong>Recommended Squad:</strong>
                                <span>{t9.squadPairing}</span>
                              </div>
                              <div className="t9-tip">
                                <strong>TW Tip:</strong> {t9.strategicTip}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TIER 6 FACTION PERKS */}
                      <div className="set-tier-block">
                        <div className="tier-block-head head-purple">
                          <h5>🛡️ Level 6 Faction Perks</h5>
                          <small>Faction-wide combat amplifiers</small>
                        </div>
                        <div className="tier6-cards-grid">
                          {set.tier6Perks.map((t6) => (
                            <div key={t6.factionId} className="tier6-perk-card">
                              <div className="t6-head">
                                <h6>{t6.factionName}</h6>
                                <span className={`tw-tier-badge tier-${t6.twTier.toLowerCase()}`}>
                                  {t6.twTier.replace("_", "+")} Tier
                                </span>
                              </div>
                              <strong className="t6-title">{t6.title}</strong>
                              <p className="t6-desc">&ldquo;{t6.description}&rdquo;</p>
                              <div className="t6-leaders">
                                <strong>Recommended Leaders:</strong>
                                <span>{t6.recommendedLeaders.join(", ")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TIER 3 ALIGNMENT PERKS */}
                      <div className="set-tier-block">
                        <div className="tier-block-head head-cyan">
                          <h5>⚖️ Level 3 Alignment Perks</h5>
                          <small>Base Light / Dark Side mechanics</small>
                        </div>
                        <div className="tier3-cards-grid">
                          {set.tier3Perks.map((t3, idx) => (
                            <div key={idx} className="tier3-perk-card">
                              <span className={`align-pill align-${t3.alignment.toLowerCase()}`}>
                                {t3.alignment} SIDE
                              </span>
                              <strong>{t3.title}</strong>
                              <p>&ldquo;{t3.description}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: TW COMMAND SYNERGIES */}
      {activeTab === "tw-synergy" && (
        <section className="tw-synergy-section" aria-labelledby="tw-synergy-heading">
          <div className="signature-heading">
            <div>
              <span>02</span>
              <h3 id="tw-synergy-heading">Territory War Defence &amp; Offence Command Matrix</h3>
            </div>
            <p>Direct squad pairing recommendations for guild officers and members during TW planning.</p>
          </div>

          <div className="synergy-cards-grid">
            <article className="synergy-card card-frontline">
              <div className="syn-head">
                <span className="syn-zone-tag">Frontline Defence Priority</span>
                <h4>Lord Vader + Set 20 Empire Datacron</h4>
              </div>
              <div className="syn-squad">
                <strong>Optimal Lineup:</strong>
                <span>Lord Vader (L), Maul, Royal Guard, Grand Inquisitor, Admiral Thrawn</span>
              </div>
              <div className="syn-mechanic">
                <strong>Why It Holds:</strong> Starts with 40 Underestimated stacks. Enemy attackers cannot burst down Royal Guard without charging Lord Vader&apos;s Ultimate immediately.
              </div>
              <div className="syn-counter-note">
                <strong>Counters:</strong> Requires enemy to burn high-relic Bounty Hunters with Fennec or mirror GL JMK with CAT.
              </div>
            </article>

            <article className="synergy-card card-frontline">
              <div className="syn-head">
                <span className="syn-zone-tag">Frontline Defence Priority</span>
                <h4>Bo-Katan (Mand&apos;alor) + Set 18 Mando Datacron</h4>
              </div>
              <div className="syn-squad">
                <strong>Optimal Lineup:</strong>
                <span>Bo-Katan (Mand&apos;alor) (L), Paz Vizsla, The Armorer, IG-12 &amp; Grogu, Beskar Mando</span>
              </div>
              <div className="syn-mechanic">
                <strong>Why It Holds:</strong> 80% Max Protection + AoE damage halving. Paz Vizsla resurrects and counters with AoE Heat while team gains 100% TM.
              </div>
              <div className="syn-counter-note">
                <strong>Counters:</strong> Forces enemy GL Leia or heavy Bane nuke, protecting other backline zones.
              </div>
            </article>

            <article className="synergy-card card-offence">
              <div className="syn-head">
                <span className="syn-zone-tag tag-offence">Key Offence Nuke</span>
                <h4>Darth Bane + Set 18 Sith Rule of Two</h4>
              </div>
              <div className="syn-squad">
                <strong>Optimal Lineup:</strong>
                <span>Darth Bane (L) + Sith Eternal Emperor (2-man clean clear)</span>
              </div>
              <div className="syn-mechanic">
                <strong>Why It Dominates:</strong> Immune to Instant Defeat and TM reduction. Bane basic attack ignores 100% Armor with +100% Offense.
              </div>
              <div className="syn-counter-note">
                <strong>Target Profiles:</strong> Free 65-banner win against enemy Lord Vader, Jabba, Rey, and Malgus squads.
              </div>
            </article>

            <article className="synergy-card card-offence">
              <div className="syn-head">
                <span className="syn-zone-tag tag-offence">Key Offence Striker</span>
                <h4>Commander Luke + Set 20 Rebel Ambush</h4>
              </div>
              <div className="syn-squad">
                <strong>Optimal Lineup:</strong>
                <span>CLS (L), Han Solo, Chewbacca, C-3PO, Chewpio</span>
              </div>
              <div className="syn-mechanic">
                <strong>Why It Dominates:</strong> +100% Tenacity prevents all opening debuffs. Luke specials grant Han &amp; Chewie 100% TM loop.
              </div>
              <div className="syn-counter-note">
                <strong>Target Profiles:</strong> Shreds high-defense Inquisitor, Dash Rendar, and Doctor Aphra defence walls.
              </div>
            </article>
          </div>
        </section>
      )}

      {/* TAB 4: REROLL & FARMING ADVISOR */}
      {activeTab === "reroll-guide" && (
        <section className="reroll-guide-section" aria-labelledby="reroll-heading">
          <div className="signature-heading">
            <div>
              <span>03</span>
              <h3 id="reroll-heading">Datacron Farming &amp; Reroll Strategic Advisor</h3>
            </div>
            <p>Maximize Conquest materials, optimize stat thresholds, and stop wasting credits on suboptimal rolls.</p>
          </div>

          <div className="guide-grid">
            <article className="guide-card">
              <div className="g-head">
                <span className="g-step">Rule 01</span>
                <h4>Level 3 &amp; Level 6 Reroll Thresholds</h4>
              </div>
              <p>
                Never take a Datacron beyond <strong>Level 3</strong> unless you rolled the alignment mechanic that matches your intended team.
                At <strong>Level 6</strong>, only commit upgrade materials if the faction ability is S-Tier (e.g. Empire, Mandalorian, Republic).
              </p>
              <ul className="g-list">
                <li><strong>Dark Side Set 20:</strong> Target <em>Oppression &amp; Retribution</em> for stacking offense.</li>
                <li><strong>Light Side Set 19:</strong> Target <em>Republic Shield Wall</em> for anti-crit protection.</li>
              </ul>
            </article>

            <article className="guide-card">
              <div className="g-head">
                <span className="g-step">Rule 02</span>
                <h4>Primary Stat Targets by Archetype</h4>
              </div>
              <p>Different squad archetypes scale exponentially with specific stat rolls:</p>
              <div className="stat-target-rows">
                <div className="st-row">
                  <strong>Tanks / GL Defense (Vader, Malgus, Paz):</strong>
                  <span>Target Defense (% &gt; 60%) + Max Health / Max Protection</span>
                </div>
                <div className="st-row">
                  <strong>Attackers (Bane, CLS, Grievous):</strong>
                  <span>Target Offense (% &gt; 35%) + Critical Damage / Health Steal</span>
                </div>
                <div className="st-row">
                  <strong>Speed Controllers (Rex, Gideon):</strong>
                  <span>Target Flat Speed (+15 or higher) + Potency</span>
                </div>
              </div>
            </article>

            <article className="guide-card">
              <div className="g-head">
                <span className="g-step">Rule 03</span>
                <h4>Conquest Energy &amp; Scavenger Farming Priority</h4>
              </div>
              <p>
                Focus Conquest Sector 5 bonus nodes during weeks 1 and 2 of each Conquest cycle to build a cache of <strong>Datacraft Upgrade Materials</strong>.
                Prioritize upgrading 2 Level 9 Datacrons per active set before spreading materials across multiple Level 6s.
              </p>
            </article>
          </div>
        </section>
      )}
    </div>
  );
}
