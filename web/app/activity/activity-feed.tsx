"use client";

import { useState } from "react";
import type { ActivityGroup, ActivityItem } from "@/lib/activity-feed";

const FILTERS: { key: "all" | ActivityGroup; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "stars", label: "Stars" },
  { key: "gear", label: "Gear" },
  { key: "relics", label: "Relics" },
  { key: "legends", label: "Legends & ultimates" },
  { key: "units", label: "New units" },
];

/** A game-style feed: one line per thing, the big ones in green, the time on the right. */
export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [filter, setFilter] = useState<"all" | ActivityGroup>("all");
  const [who, setWho] = useState("");
  const shown = items.filter((item) => (filter === "all" || item.group === filter) && (!who || item.who === who));
  const members = [...new Set(items.map((item) => item.who))].sort((a, b) => a.localeCompare(b));

  return (
    <div className="hub-knowledge act">
      <div className="hub-kbar">
        <div className="hub-segment act-filters" role="group" aria-label="What to show">
          {FILTERS.map((item) => <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</button>)}
        </div>
        <select className="act-who" value={who} onChange={(event) => setWho(event.target.value)} aria-label="Member">
          <option value="">Every member</option>
          {members.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      {shown.length === 0 ? (
        <div className="kb-empty"><strong>{items.length ? "Nothing matches." : "Nothing yet."}</strong><p>{items.length ? "Try another filter." : "Activity appears here as rosters are checked. It starts from the next check, so give it a day."}</p></div>
      ) : (
        <ul className="act-list">
          {shown.map((item) => (
            <li key={item.id} className={`act-row is-${item.group}${item.tier === "headline" ? " is-big" : ""}`}>
              <span><strong>{item.who}</strong> {item.text}</span>
              <time dateTime={item.at}>{item.ago}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
