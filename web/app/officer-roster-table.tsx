"use client";

import { useMemo, useState } from "react";

export type OfficerRosterRowData = {
  playerId: string;
  name: string;
  role: string | null;
  state: "ACTIVE" | "LEFT";
  joinedAt: string;
  leftAt: string | null;
  tenureDays: number;
  galacticPower: string | null;
  raidTickets: number | null;
  ticketTarget: number;
  lastActivityAt: string | null;
  raidParticipated: boolean | null;
  raidDamage: number | null;
  twJoined: boolean | null;
  flags: string[];
  needsAttention: boolean;
};

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "name" | "power" | "tickets" | "activity" | "tenure";

function formatPower(value: string | null) {
  if (!value) return "—";
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "—";
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return number.toLocaleString("en-GB");
}

function relativeTime(value: string | null) {
  if (!value) return "Unknown";
  const hours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 14) return `${Math.round(days)}d ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function shortDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function tenureLabel(days: number) {
  if (days < 31) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}yr`;
}

function participationBadge(value: boolean | null, joinedLabel: string, missedLabel: string) {
  if (value === null) return <span className="rr-pill rr-pill-muted">No data</span>;
  return value
    ? <span className="rr-pill rr-pill-good">{joinedLabel}</span>
    : <span className="rr-pill rr-pill-bad">{missedLabel}</span>;
}

export default function OfficerRosterTable({
  rows,
  raidLabel,
  twLabel,
}: {
  rows: OfficerRosterRowData[];
  raidLabel: string | null;
  twLabel: string | null;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("power");
  const [sortDesc, setSortDesc] = useState(true);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((row) => {
      if (status === "active" && row.state !== "ACTIVE") return false;
      if (status === "inactive" && row.state !== "LEFT") return false;
      if (attentionOnly && !row.needsAttention) return false;
      if (q && !row.name.toLowerCase().includes(q)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name);
      else if (sortKey === "power") diff = Number(BigInt(a.galacticPower ?? "0") - BigInt(b.galacticPower ?? "0"));
      else if (sortKey === "tickets") diff = (a.raidTickets ?? -1) - (b.raidTickets ?? -1);
      else if (sortKey === "tenure") diff = a.tenureDays - b.tenureDays;
      else if (sortKey === "activity") {
        diff = (a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0)
          - (b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0);
      }
      return sortDesc ? -diff : diff;
    });

    return list;
  }, [rows, query, status, attentionOnly, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((current) => !current);
    else { setSortKey(key); setSortDesc(true); }
  }

  const attentionCount = rows.filter((row) => row.needsAttention).length;

  return (
    <>
      <div className="rr-tools">
        <label>
          <span>Search roster</span>
          <input
            type="text"
            placeholder="Find a member…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            <option value="active">Active members</option>
            <option value="inactive">Departed members</option>
            <option value="all">All (full guild history)</option>
          </select>
        </label>
        <label className="rr-attention-toggle">
          <input
            type="checkbox"
            checked={attentionOnly}
            onChange={(event) => setAttentionOnly(event.target.checked)}
          />
          <span>Needs attention only ({attentionCount})</span>
        </label>
        <p>{visible.length} shown</p>
      </div>

      <div className="rr-table-wrap">
        <table className="rr-table">
          <thead>
            <tr>
              <th><button type="button" onClick={() => toggleSort("name")}>Member</button></th>
              <th>Status</th>
              <th><button type="button" onClick={() => toggleSort("power")}>Power</button></th>
              <th><button type="button" onClick={() => toggleSort("tickets")}>Tickets</button></th>
              <th title={raidLabel ?? undefined}>Last raid</th>
              <th title={twLabel ?? undefined}>TW</th>
              <th title="Comlink doesn't expose per-member Territory Battle data outside the guild's own account">TB</th>
              <th><button type="button" onClick={() => toggleSort("activity")}>Last active</button></th>
              <th><button type="button" onClick={() => toggleSort("tenure")}>Tenure</button></th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.playerId} className={row.needsAttention ? "rr-row-attention" : row.state === "LEFT" ? "rr-row-left" : ""}>
                <td>
                  <span className="rr-member">
                    <i aria-hidden="true">{row.name.charAt(0).toUpperCase()}</i>
                    <span>
                      <strong>{row.name}</strong>
                      <small>{row.role ?? "—"}</small>
                    </span>
                  </span>
                </td>
                <td>
                  <span className={`rr-pill ${row.state === "ACTIVE" ? "rr-pill-good" : "rr-pill-muted"}`}>
                    {row.state === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{formatPower(row.galacticPower)}</td>
                <td>
                  {row.raidTickets === null ? "—" : (
                    <span className={row.raidTickets < row.ticketTarget * 0.5 ? "rr-value-bad" : undefined}>
                      {row.raidTickets}<b>/{row.ticketTarget}</b>
                    </span>
                  )}
                </td>
                <td>
                  {participationBadge(row.raidParticipated, row.raidDamage ? `${row.raidDamage.toLocaleString("en-GB")} dmg` : "Joined", "Sat out")}
                </td>
                <td>{participationBadge(row.twJoined, "Joined", "Missed")}</td>
                <td><span className="rr-pill rr-pill-muted">No data</span></td>
                <td>{relativeTime(row.lastActivityAt)}</td>
                <td>{row.state === "ACTIVE" ? tenureLabel(row.tenureDays) : `${tenureLabel(row.tenureDays)} · left ${shortDate(row.leftAt)}`}</td>
                <td>
                  {row.flags.length ? (
                    <span className="rr-flags">
                      {row.flags.map((flag) => <em key={flag}>{flag}</em>)}
                    </span>
                  ) : row.state === "ACTIVE" ? <span className="rr-pill rr-pill-good">All clear</span> : "—"}
                </td>
              </tr>
            ))}
            {!visible.length ? (
              <tr><td colSpan={10} className="rr-empty">No members match the current filters.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
