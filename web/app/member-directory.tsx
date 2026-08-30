"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MemberDirectoryEntry = {
  playerId: string;
  name: string;
  galacticPower: string;
  characterPower: string;
  shipPower: string;
  raidTickets: number;
  lastActivityAt: string | null;
  joinedAt: string | null;
  rank: number;
  playerLevel: number;
  memberRole: string;
  galacticLegends: number | null;
  relicUnits: number | null;
  datacrons: number | null;
  profileSyncedAt: string | null;
  attentionReasons: string[];
};

type SortMode = "power" | "tickets" | "recent" | "name";

function formatPower(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "0";
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return number.toLocaleString("en-GB");
}

function relativeTime(value: string | null) {
  if (!value) return "No activity recorded";
  const date = new Date(value);
  const hours = Math.max(0, (Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "Active just now";
  if (hours < 24) return `Active ${Math.round(hours)}h ago`;
  if (hours < 24 * 7) return `Active ${Math.round(hours / 24)}d ago`;
  return `Active ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

function longDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "Not recorded";
}

function guildTenure(value: string | null) {
  if (!value) return "Not recorded";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days < 31) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = days / 365;
  return `${years.toFixed(years >= 10 ? 0 : 1)}yr`;
}

function roleTier(role: string) {
  const normalized = role.toLowerCase();
  if (normalized === "leader") return "leader";
  if (normalized === "officer") return "officer";
  return "member";
}

export default function MemberDirectory({ members }: { members: MemberDirectoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("power");
  const [selected, setSelected] = useState<MemberDirectoryEntry | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  type ProgressionPoint = {
    capturedAt: string;
    galacticPower: string;
    characterPower: string;
    shipPower: string;
    galacticLegends: number;
    relicUnits: number;
  };

  const [progression, setProgression] = useState<ProgressionPoint[] | null>(null);
  const [loadingProgression, setLoadingProgression] = useState(false);
  const [loadedAt, setLoadedAt] = useState<number>(0);

  useEffect(() => {
    function checkHash() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      if (hash.startsWith("#member-")) {
        const playerId = hash.replace("#member-", "");
        const target = members.find((m) => m.playerId === playerId);
        if (target) {
          setSelected(target);
        }
      }
    }
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [members]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) {
      dialog.showModal();
      setLoadingProgression(true);
      setProgression(null);
      fetch(`/api/members/progression?playerId=${selected.playerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.points) {
            setProgression(data.points);
            setLoadedAt(Date.now());
          }
          setLoadingProgression(false);
        })
        .catch(() => {
          setLoadingProgression(false);
        });
    }
  }, [selected]);

  const growthStats = useMemo(() => {
    if (!progression || progression.length < 2 || !loadedAt) return null;
    
    const latest = progression[progression.length - 1];
    const latestGp = Number(latest.galacticPower);
    
    // Find snap around 7 days ago
    const oneWeekAgo = loadedAt - 7 * 86_400_000;
    const snap7d = progression.reduce((best, current) => {
      const bestDiff = Math.abs(new Date(best.capturedAt).getTime() - oneWeekAgo);
      const currentDiff = Math.abs(new Date(current.capturedAt).getTime() - oneWeekAgo);
      return currentDiff < bestDiff ? current : best;
    });
    
    // Find snap around 30 days ago
    const oneMonthAgo = loadedAt - 30 * 86_400_000;
    const snap30d = progression.reduce((best, current) => {
      const bestDiff = Math.abs(new Date(best.capturedAt).getTime() - oneMonthAgo);
      const currentDiff = Math.abs(new Date(current.capturedAt).getTime() - oneMonthAgo);
      return currentDiff < bestDiff ? current : best;
    });

    const gpDelta7d = latestGp - Number(snap7d.galacticPower);
    const gpDelta30d = latestGp - Number(snap30d.galacticPower);
    
    const relicsDelta = latest.relicUnits - snap7d.relicUnits;
    const glsDelta = latest.galacticLegends - snap7d.galacticLegends;

    return {
      gpDelta7d,
      gpDelta30d,
      relicsDelta,
      glsDelta,
    };
  }, [progression, loadedAt]);

  const visibleMembers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const result = members.filter((member) => member.name.toLocaleLowerCase().includes(normalized));
    return result.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "tickets") return b.raidTickets - a.raidTickets || a.rank - b.rank;
      if (sort === "recent") {
        return (b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0)
          - (a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0);
      }
      return a.rank - b.rank;
    });
  }, [members, query, sort]);

  return (
    <>
      <div className="roster-tools">
        <label className="roster-search">
          <span>Search the band</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a member…"
          />
        </label>
        <label className="roster-sort">
          <span>Sort by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            <option value="power">Galactic power</option>
            <option value="tickets">Raid tickets</option>
            <option value="recent">Recent activity</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {visibleMembers.length ? (
        <div className="roster-grid" aria-live="polite">
          {visibleMembers.map((member) => {
            const needsAttention = member.attentionReasons.length > 0;
            const tier = roleTier(member.memberRole);
            return (
              <button
                className={`trading-card trading-card-${tier}${needsAttention ? " trading-card-attention" : ""}`}
                id={`member-${member.playerId}`}
                key={member.playerId}
                type="button"
                onClick={() => setSelected(member)}
                aria-label={`View ${member.name}'s member card`}
              >
                <span className="trading-card-frame" aria-hidden="true" />
                <span className="trading-card-rank">#{member.rank}</span>
                <em className={`trading-card-role role-${tier}`}>{member.memberRole}</em>
                <span className="trading-card-portrait">
                  <i aria-hidden="true">{member.name.charAt(0).toUpperCase()}</i>
                </span>
                <span className="trading-card-name">
                  <strong>{member.name}</strong>
                  <small>Level {member.playerLevel || "—"} · {guildTenure(member.joinedAt)} in the band</small>
                </span>
                <span className="trading-card-stats">
                  <span><small>Power</small><strong>{formatPower(member.galacticPower)}</strong></span>
                  <span><small>GLs</small><strong>{member.galacticLegends ?? "—"}</strong></span>
                  <span><small>Tickets</small><strong>{member.raidTickets}<b>/600</b></strong></span>
                  <span><small>Relics</small><strong>{member.relicUnits ?? "—"}</strong></span>
                </span>
                <span className="trading-card-foot">
                  <small>{needsAttention ? `Needs check-in · ${relativeTime(member.lastActivityAt)}` : relativeTime(member.lastActivityAt)}</small>
                  <b>Open card →</b>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="roster-empty">
          <strong>{members.length ? "No crew members match that search." : "The roster is waiting for its first sync."}</strong>
          <p>{members.length ? "Try a shorter name or clear the search." : "Member cards will appear here automatically when Comlink checks in."}</p>
        </div>
      )}

      <dialog
        className="member-dialog"
        ref={dialogRef}
        aria-labelledby="member-profile-title"
        onClose={() => { setSelected(null); setProgression(null); }}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        {selected && (
          <div className="member-profile">
            <button className="member-dialog-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close member card">×</button>
            <div className="profile-hero">
              <span className="profile-avatar" aria-hidden="true">{selected.name.charAt(0).toUpperCase()}</span>
              <div><p>{selected.memberRole} · Blues Brothers</p><h3 id="member-profile-title">{selected.name}</h3><span>Guild rank #{selected.rank} · Player level {selected.playerLevel || "—"}</span></div>
            </div>
            <div className="profile-stat-grid">
              <div><span>Galactic power</span><strong>{formatPower(selected.galacticPower)}</strong></div>
              <div><span>Character GP</span><strong>{formatPower(selected.characterPower)}</strong></div>
              <div><span>Ship GP</span><strong>{formatPower(selected.shipPower)}</strong></div>
              <div><span>Galactic Legends</span><strong>{selected.galacticLegends ?? "Syncing"}</strong></div>
              <div><span>Raid tickets</span><strong>{selected.raidTickets}<small>/600</small></strong></div>
              <div><span>Relic units</span><strong>{selected.relicUnits ?? "Syncing"}</strong></div>
              <div><span>Datacrons</span><strong>{selected.datacrons ?? "Syncing"}</strong></div>
              <div><span>Last activity</span><strong>{relativeTime(selected.lastActivityAt).replace("Active ", "")}</strong></div>
              <div className="profile-stat-wide"><span>Joined the band</span><strong>{longDate(selected.joinedAt)} · {guildTenure(selected.joinedAt)}</strong></div>
            </div>
            <div className="profile-progression" style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
              <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: "#c0b19d", letterSpacing: "0.08em", margin: "0 0 12px" }}>Roster Growth &amp; Deltas</h4>
              {loadingProgression ? (
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>Loading growth timeline...</p>
              ) : growthStats ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "10px", color: "#738193", display: "block" }}>7-Day GP Progress</span>
                    <strong style={{ fontSize: "14px", color: growthStats.gpDelta7d >= 0 ? "#53d69a" : "#ff5247" }}>
                      {growthStats.gpDelta7d >= 0 ? "+" : ""}{formatPower(growthStats.gpDelta7d.toString())}
                    </strong>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "10px", color: "#738193", display: "block" }}>30-Day GP Progress</span>
                    <strong style={{ fontSize: "14px", color: growthStats.gpDelta30d >= 0 ? "#53d69a" : "#ff5247" }}>
                      {growthStats.gpDelta30d >= 0 ? "+" : ""}{formatPower(growthStats.gpDelta30d.toString())}
                    </strong>
                  </div>
                  {(growthStats.relicsDelta !== 0 || growthStats.glsDelta !== 0) && (
                    <div style={{ gridColumn: "1 / -1", padding: "10px", borderRadius: "8px", background: "rgba(33, 112, 255, 0.05)", border: "1px solid rgba(33, 112, 255, 0.1)", fontSize: "12px", color: "#d3e8ff" }}>
                      📈 Milestones: {growthStats.relicsDelta > 0 && `+${growthStats.relicsDelta} Relics`} {growthStats.glsDelta > 0 && `+${growthStats.glsDelta} GLs`} (7d)
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "#738193", marginBottom: "16px" }}>No historical snapshots recorded yet. Progression deltas will populate weekly.</p>
              )}
            </div>
            <div className={`profile-standing${selected.attentionReasons.length ? " profile-standing-watch" : ""}`}>
              <span>{selected.attentionReasons.length ? "Needs a check-in" : "All clear"}</span>
              {selected.attentionReasons.length ? (
                <ul>{selected.attentionReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              ) : (
                <p>No current activity or roster flags. Keep it rolling.</p>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
