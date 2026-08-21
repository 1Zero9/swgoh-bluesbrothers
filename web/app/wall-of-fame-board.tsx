"use client";

import { useState } from "react";
import type { WallOfFameCategory } from "@/lib/wall-of-fame";

export default function WallOfFameBoard({ categories }: { categories: WallOfFameCategory[] }) {
  const [active, setActive] = useState(0);
  const category = categories[active];
  if (!category) return null;

  return (
    <>
      <div className="fame-tabs" role="tablist" aria-label="Wall of Fame category">
        {categories.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={index === active ? "is-active" : ""}
            onClick={() => setActive(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ol className="standing-list fame-list">
        {category.entries.map((entry) => (
          <li key={entry.playerId}>
            <a href={`#member-${entry.playerId}`}>
              <span className="standing-rank">{entry.rank}</span>
              <span className="standing-avatar" aria-hidden="true">{entry.name.charAt(0).toUpperCase()}</span>
              <span className="standing-member"><strong>{entry.name}</strong><small>{entry.badge || `Top ${category.label.toLowerCase()}`}</small></span>
              <span className="standing-value"><strong>{entry.displayValue}</strong><small>{category.unit}</small></span>
              <span className="standing-arrow">→</span>
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}
