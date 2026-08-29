"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type {
  DiscordSyncReport,
  PlayerDiscordStatus,
  MatchSuggestion,
} from "@/lib/discord-sync";

type Props = {
  initialReport: DiscordSyncReport;
};

export default function DiscordSyncInteractive({ initialReport }: Props) {
  const [report, setReport] = useState<DiscordSyncReport>(initialReport);
  const [filterMode, setFilterMode] = useState<"ALL" | "UNLINKED" | "LINKED" | "DRIFT">("UNLINKED");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Manual select modal state
  const [manualModalPlayer, setManualModalPlayer] = useState<PlayerDiscordStatus | null>(null);
  const [selectedDiscordId, setSelectedDiscordId] = useState("");

  const summary = report.summary;

  // Filtered active players list
  const filteredPlayers = report.activePlayers.filter((player) => {
    if (filterMode === "UNLINKED" && player.linkedDiscordUser) return false;
    if (filterMode === "LINKED" && !player.linkedDiscordUser) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesName = player.playerName.toLowerCase().includes(q);
    const matchesAlly = player.allyCode?.toLowerCase().includes(q);
    const matchesDiscord = player.linkedDiscordUser?.username.toLowerCase().includes(q)
      || player.linkedDiscordUser?.nickname?.toLowerCase().includes(q);

    return matchesName || matchesAlly || matchesDiscord;
  });

  async function executeAction(payload: Record<string, unknown>) {
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/officer/discord-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setStatusMessage({
          type: "success",
          text: payload.action === "reconcile_roles"
            ? `Reconciled Discord roles successfully (Demoted: ${data.demotedCount}, Verified: ${data.promotedCount}).`
            : "Discord mapping updated successfully.",
        });
        // Refresh page data
        window.location.reload();
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Action failed. Check Discord bot permissions.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error communicating with Discord sync API.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleLink(playerId: string, discordUserId: string) {
    await executeAction({ action: "link", playerId, discordUserId });
    setManualModalPlayer(null);
  }

  async function handleUnlink(playerId: string) {
    if (!confirm("Are you sure you want to unlink this member from their Discord account?")) return;
    await executeAction({ action: "unlink", playerId });
  }

  async function handleDemoteExMember(discordUserId: string) {
    await executeAction({ action: "demote_user", discordUserId });
  }

  async function handleReconcileAllRoles() {
    if (!confirm("Run full Discord role reconciliation? This will demote any ex-members to the Public role and verify active member roles.")) return;
    await executeAction({ action: "reconcile_roles" });
  }

  return (
    <div className="discord-sync-container">
      {/* 1. Tactical KPI Dashboard */}
      <section className="ds-kpi-grid" aria-label="Discord Sync KPIs">
        <article className="ds-kpi-card">
          <div className="ds-kpi-head">
            <span>Linked Active Crew</span>
            <span className="ds-kpi-mark">🔗</span>
          </div>
          <strong>{summary.linkedMembersCount}<span>/{summary.activeGameMembers}</span></strong>
          <p>{Math.round((summary.linkedMembersCount / (summary.activeGameMembers || 1)) * 100)}% roster mapped to Discord</p>
        </article>

        <article className={`ds-kpi-card${summary.unlinkedMembersCount > 0 ? " ds-kpi-warn" : ""}`}>
          <div className="ds-kpi-head">
            <span>Unlinked Active Members</span>
            <span className="ds-kpi-mark">⚡</span>
          </div>
          <strong>{summary.unlinkedMembersCount}</strong>
          <p>{summary.unlinkedMembersCount === 0 ? "All members connected!" : "In-game crew needing Discord link"}</p>
        </article>

        <article className={`ds-kpi-card${summary.exMembersWithMemberRoleCount > 0 ? " ds-kpi-alert" : ""}`}>
          <div className="ds-kpi-head">
            <span>Ex-Members in Role</span>
            <span className="ds-kpi-mark">🛡️</span>
          </div>
          <strong>{summary.exMembersWithMemberRoleCount}</strong>
          <p>{summary.exMembersWithMemberRoleCount === 0 ? "Zero role drift detected" : "Discord users holding member role after departure"}</p>
        </article>

        <article className="ds-kpi-card">
          <div className="ds-kpi-head">
            <span>Discord Server Members</span>
            <span className="ds-kpi-mark">◈</span>
          </div>
          <strong>{summary.totalDiscordMembers}</strong>
          <p>{summary.botConfigured ? "Bot connected & active" : "Bot token pending setup"}</p>
        </article>
      </section>

      {/* Global Status Banner */}
      {statusMessage && (
        <div className={`ds-alert ds-alert-${statusMessage.type}`} role="status">
          <i>{statusMessage.type === "success" ? "✓" : statusMessage.type === "error" ? "⚠" : "ℹ"}</i>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Command Toolbar */}
      <section className="ds-toolbar">
        <div className="ds-filter-pills">
          <button
            type="button"
            className={`ds-pill${filterMode === "UNLINKED" ? " active" : ""}`}
            onClick={() => setFilterMode("UNLINKED")}
          >
            ⚡ Unlinked Members ({summary.unlinkedMembersCount})
          </button>
          <button
            type="button"
            className={`ds-pill${filterMode === "LINKED" ? " active" : ""}`}
            onClick={() => setFilterMode("LINKED")}
          >
            🔗 Linked Crew ({summary.linkedMembersCount})
          </button>
          <button
            type="button"
            className={`ds-pill${filterMode === "DRIFT" ? " active" : ""}`}
            onClick={() => setFilterMode("DRIFT")}
          >
            🛡️ Role Drift ({summary.exMembersWithMemberRoleCount})
          </button>
          <button
            type="button"
            className={`ds-pill${filterMode === "ALL" ? " active" : ""}`}
            onClick={() => setFilterMode("ALL")}
          >
            All Active Roster ({summary.activeGameMembers})
          </button>
        </div>

        <div className="ds-actions-group">
          <input
            type="search"
            className="ds-search-input"
            placeholder="Search member, handle, or ally code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            type="button"
            className="btn-ds-reconcile"
            onClick={handleReconcileAllRoles}
            disabled={isProcessing}
          >
            {isProcessing ? "Reconciling..." : "⚡ Reconcile All Discord Roles"}
          </button>
        </div>
      </section>

      {/* 3. Main Content Views */}
      {filterMode === "DRIFT" ? (
        /* Role Drift: Ex-Members with Member Role */
        <section className="ds-drift-section">
          <div className="ds-section-header">
            <h3>Ex-Members Holding Member Role in Discord</h3>
            <p>These Discord users hold the Member role but are no longer listed on the active SWGOH in-game guild roster. Demoting them assigns the Public/Guest role and secures site access.</p>
          </div>

          {report.departedWithMemberRole.length === 0 ? (
            <div className="ds-empty-card">
              <span className="ds-empty-icon">✓</span>
              <h4>No Role Drift Detected</h4>
              <p>All Discord users with the Member role match active in-game guild members.</p>
            </div>
          ) : (
            <div className="ds-drift-grid">
              {report.departedWithMemberRole.map((dm) => (
                <div key={dm.id} className="ds-drift-card">
                  <div className="ds-user-badge">
                    {dm.avatarUrl ? (
                      <Image src={dm.avatarUrl} alt="" width={40} height={40} className="ds-avatar" />
                    ) : (
                      <div className="ds-avatar-placeholder">{dm.username[0].toUpperCase()}</div>
                    )}
                    <div>
                      <strong>{dm.nickname || dm.globalName || dm.username}</strong>
                      <small>@{dm.username}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-ds-demote"
                    onClick={() => handleDemoteExMember(dm.id)}
                    disabled={isProcessing}
                  >
                    Demote to Public Role →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Active In-Game Members Mapping Matrix */
        <section className="ds-matrix-section">
          <div className="ds-matrix-grid">
            {filteredPlayers.length === 0 ? (
              <div className="ds-empty-card">
                <span className="ds-empty-icon">ℹ</span>
                <h4>No members match the current filter</h4>
                <p>Try switching filters or adjusting your search query.</p>
              </div>
            ) : (
              filteredPlayers.map((player) => (
                <article
                  key={player.playerId}
                  className={`ds-player-card${player.linkedDiscordUser ? " is-linked" : " is-unlinked"}`}
                >
                  <div className="ds-card-top">
                    <div className="ds-game-profile">
                      <span className="ds-role-dot" />
                      <div>
                        <h4>{player.playerName}</h4>
                        <small>
                          {player.allyCode ? `Ally: ${player.allyCode}` : "No Ally Code"} · Level {player.playerLevel || 85}
                        </small>
                      </div>
                    </div>

                    <span className={`ds-status-badge ${player.linkedDiscordUser ? "badge-linked" : "badge-unlinked"}`}>
                      {player.linkedDiscordUser ? "✓ Linked" : "⚡ Unlinked"}
                    </span>
                  </div>

                  {player.linkedDiscordUser ? (
                    /* Linked State */
                    <div className="ds-linked-details">
                      <div className="ds-user-badge">
                        {player.linkedDiscordUser.avatarUrl ? (
                          <Image
                            src={player.linkedDiscordUser.avatarUrl}
                            alt=""
                            width={34}
                            height={34}
                            className="ds-avatar"
                          />
                        ) : (
                          <div className="ds-avatar-placeholder">
                            {player.linkedDiscordUser.username[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <strong>
                            {player.linkedDiscordUser.nickname ||
                              player.linkedDiscordUser.globalName ||
                              player.linkedDiscordUser.username}
                          </strong>
                          <small>@{player.linkedDiscordUser.username}</small>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-ds-unlink"
                        onClick={() => handleUnlink(player.playerId)}
                        disabled={isProcessing}
                        title="Unlink Discord account"
                      >
                        Unlink
                      </button>
                    </div>
                  ) : (
                    /* Unlinked State with Match Suggestions */
                    <div className="ds-unlinked-details">
                      {player.suggestedMatches.length > 0 ? (
                        <div className="ds-suggestions-box">
                          <small className="ds-suggestions-label">Auto-Match Suggestions:</small>
                          <div className="ds-suggestions-list">
                            {player.suggestedMatches.map((s) => (
                              <div key={s.discordMember.id} className="ds-suggestion-item">
                                <div className="ds-sug-info">
                                  <span className={`ds-confidence-tag tag-${s.confidence.toLowerCase()}`}>
                                    {s.score}% Match
                                  </span>
                                  <strong>{s.discordMember.nickname || s.discordMember.globalName || s.discordMember.username}</strong>
                                  <small>({s.matchReason})</small>
                                </div>
                                <button
                                  type="button"
                                  className="btn-ds-confirm-link"
                                  onClick={() => handleLink(player.playerId, s.discordMember.id)}
                                  disabled={isProcessing}
                                >
                                  Link →
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="ds-no-suggestions">No high-confidence nickname matches found automatically.</p>
                      )}

                      <button
                        type="button"
                        className="btn-ds-manual-link"
                        onClick={() => setManualModalPlayer(player)}
                      >
                        + Choose Discord Member Manually
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {/* 4. Manual Link Modal */}
      {manualModalPlayer && (
        <div className="ds-modal-overlay" onClick={() => setManualModalPlayer(null)}>
          <div className="ds-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="ds-modal-head">
              <h3>Link SWGOH Member: {manualModalPlayer.playerName}</h3>
              <button type="button" className="btn-modal-close" onClick={() => setManualModalPlayer(null)}>✕</button>
            </header>

            <p className="ds-modal-desc">
              Select the Discord user who corresponds to in-game member <strong>{manualModalPlayer.playerName}</strong>:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedDiscordId) {
                  handleLink(manualModalPlayer.playerId, selectedDiscordId);
                }
              }}
            >
              <div className="ds-modal-input-group">
                <input
                  type="text"
                  className="ds-modal-input"
                  placeholder="Paste Discord User ID directly (e.g. 123456789012345678)"
                  value={selectedDiscordId}
                  onChange={(e) => setSelectedDiscordId(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="ds-modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setManualModalPlayer(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-save" disabled={!selectedDiscordId.trim() || isProcessing}>
                  {isProcessing ? "Saving..." : "Save Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Audit Trail & Log */}
      {report.recentAuditEvents.length > 0 && (
        <section className="ds-audit-section">
          <header className="ds-section-header">
            <h3>Recent Discord Automation &amp; Mapping Log</h3>
            <p>Real-time audit events for member joins, departures, and role reconciliations.</p>
          </header>

          <div className="ds-audit-list">
            {report.recentAuditEvents.map((evt) => (
              <div key={evt.id} className="ds-audit-item">
                <span className="ds-audit-dot" />
                <div className="ds-audit-copy">
                  <p>{evt.summary}</p>
                  <small>{new Date(evt.occurredAt).toLocaleString("en-GB")}</small>
                </div>
                <span className="ds-audit-kind">{evt.kind}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
