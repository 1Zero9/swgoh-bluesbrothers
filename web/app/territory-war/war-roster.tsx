"use client";

import { useMemo, useState } from "react";
import type { TerritoryWarMember } from "@/lib/territory-war";

function power(value: string | number | null) {
  if (value === null) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString("en-GB");
}

function relativeActivity(value: string | null) {
  if (!value) return "Activity unknown";
  const hours = Math.max(0, (Date.now() - new Date(value).getTime()) / 3_600_000);
  if (hours < 1) return "Active this hour";
  if (hours < 24) return `Active ${Math.round(hours)}h ago`;
  return `Active ${Math.round(hours / 24)}d ago`;
}

export default function WarRoster({ members, active }: { members: TerritoryWarMember[]; active: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(active ? "joined" : "all");
  const [sort, setSort] = useState(active ? "locked" : "gp");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members
      .filter((member) => !needle || member.name.toLowerCase().includes(needle))
      .filter((member) => filter === "all" || (filter === "joined" ? member.joined : !member.joined))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "locked") return (b.lockedPower ?? -1) - (a.lockedPower ?? -1);
        if (sort === "gls") return (b.galacticLegends ?? -1) - (a.galacticLegends ?? -1);
        return Number(BigInt(b.galacticPower) - BigInt(a.galacticPower));
      });
  }, [filter, members, query, sort]);

  return (
    <>
      <div className="tw-roster-tools">
        <label>
          <span>Find a member</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the band…" />
        </label>
        {active ? (
          <label>
            <span>Registration</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="joined">Joined</option>
              <option value="not-joined">Not joined</option>
              <option value="all">Everyone</option>
            </select>
          </label>
        ) : null}
        <label>
          <span>Order by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            {active ? <option value="locked">Locked GP</option> : null}
            <option value="gp">Current GP</option>
            <option value="gls">Galactic Legends</option>
            <option value="name">Name</option>
          </select>
        </label>
        <p><strong>{visible.length}</strong> shown</p>
      </div>

      {visible.length ? (
        <div className="tw-member-list">
          {visible.map((member) => (
            <details className={`tw-member-row${member.joined ? " is-joined" : ""}`} key={member.playerId}>
              <summary>
                <span className="tw-member-avatar" aria-hidden="true">{member.name.charAt(0).toUpperCase()}</span>
                <span className="tw-member-name"><strong>{member.name}</strong><small>{member.role}</small></span>
                <span className="tw-member-primary">
                  <strong>{active ? power(member.lockedPower) : power(member.galacticPower)}</strong>
                  <small>{active ? "Locked GP" : "Galactic power"}</small>
                </span>
                {active ? <strong className={member.joined ? "tw-joined" : "tw-out"}>{member.joined ? "Joined" : "Not joined"}</strong> : null}
                <svg className="tw-chevron" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </summary>
              <div className="tw-member-detail">
                <div className="tw-member-stats">
                  <span><small>{active ? "Current GP" : "Galactic power"}</small><strong>{power(member.galacticPower)}</strong></span>
                  <span><small>GLs</small><strong>{member.galacticLegends ?? "—"}</strong></span>
                  <span><small>Relic units</small><strong>{member.relicUnits ?? "—"}</strong></span>
                  <span><small>Datacrons</small><strong>{member.datacrons ?? "—"}</strong></span>
                </div>
                <footer>
                  <span>{relativeActivity(member.lastActivityAt)}</span>
                  <span>{member.profileSyncedAt ? "Profile captured" : "Profile awaiting sync"}</span>
                </footer>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="tw-empty"><strong>No members match this view.</strong><p>Try a different registration filter or search.</p></div>
      )}
    </>
  );
}
