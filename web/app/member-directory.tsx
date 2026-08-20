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

export default function MemberDirectory({ members }: { members: MemberDirectoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("power");
  const [selected, setSelected] = useState<MemberDirectoryEntry | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
  }, [selected]);

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
            type="search"
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
            return (
              <button
                className={`member-card${needsAttention ? " member-card-attention" : ""}`}
                id={`member-${member.playerId}`}
                key={member.playerId}
                type="button"
                onClick={() => setSelected(member)}
                aria-label={`View ${member.name}'s member card`}
              >
                <span className="member-card-head">
                  <i aria-hidden="true">{member.name.charAt(0).toUpperCase()}</i>
                  <span><strong>{member.name}</strong><small>Guild rank #{member.rank} · Level {member.playerLevel || "—"}</small></span>
                  <em className={`role-${member.memberRole.toLowerCase()}`}>{member.memberRole}</em>
                </span>
                <span className="member-card-stats">
                  <span><small>Power</small><strong>{formatPower(member.galacticPower)}</strong></span>
                  <span><small>GLs</small><strong>{member.galacticLegends ?? "—"}</strong></span>
                  <span><small>Tickets</small><strong>{member.raidTickets}<b>/600</b></strong></span>
                  <span><small>In guild</small><strong>{guildTenure(member.joinedAt)}</strong></span>
                </span>
                <span className="member-card-foot"><small>{needsAttention ? `Needs check-in · ${relativeTime(member.lastActivityAt)}` : relativeTime(member.lastActivityAt)}</small><b>Open card →</b></span>
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
        onClose={() => setSelected(null)}
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
