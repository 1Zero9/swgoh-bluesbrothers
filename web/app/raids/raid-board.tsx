"use client";

import { useMemo, useState } from "react";
import type { RaidSummary } from "@/lib/raids";

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatEnded(value: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function RaidBoard({ raids }: { raids: RaidSummary[] }) {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const raid = raids[active];

  const visible = useMemo(() => {
    if (!raid) return [];
    const q = query.trim().toLowerCase();
    if (!q) return raid.participants;
    return raid.participants.filter((member) => member.name.toLowerCase().includes(q));
  }, [raid, query]);

  if (!raid) return null;

  return (
    <>
      <div className="fame-tabs" role="tablist" aria-label="Raid type">
        {raids.map((item, index) => (
          <button
            key={item.raidId}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={index === active ? "is-active" : ""}
            onClick={() => { setActive(index); setQuery(""); }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="tw-live-strip raid-status-strip">
        <span><i /> {raid.outcomeLabel} · Ended {formatEnded(raid.endedAt)}</span>
        <strong>Cleared in {formatDuration(raid.durationSeconds)}</strong>
      </div>

      <label className="raid-search">
        <span>Find a participant</span>
        <input
          type="search"
          placeholder="Search the roster…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <ol className="standing-list fame-list">
        {visible.map((member) => (
          <li key={member.playerId}>
            <a href={`#member-${member.playerId}`}>
              <span className="standing-rank">{member.rank}</span>
              <span className="standing-avatar" aria-hidden="true">{member.name.charAt(0).toUpperCase()}</span>
              <span className="standing-member"><strong>{member.name}</strong><small>{member.rank === 1 ? "Top damage" : `Rank ${member.rank}`}</small></span>
              <span className="standing-value"><strong>{member.damage.toLocaleString("en-GB")}</strong><small>damage</small></span>
              <span className="standing-arrow">→</span>
            </a>
          </li>
        ))}
        {!visible.length ? <li className="raid-empty">No participants match that search.</li> : null}
      </ol>
    </>
  );
}
