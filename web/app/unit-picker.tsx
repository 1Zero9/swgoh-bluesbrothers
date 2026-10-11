"use client";

import { useEffect, useRef, useState } from "react";

export type PickedUnit = { id: string; name: string };

/** A text box that suggests units as you type (members only; reads /api/who-has/units). */
export default function UnitPicker({ placeholder, onPick, onClear, label }: { placeholder: string; onPick: (unit: PickedUnit) => void; onClear?: () => void; label: string }) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState<PickedUnit[]>([]);
  const chosen = useRef<string | null>(null);

  useEffect(() => {
    const query = text.trim();
    if (query.length < 2 || chosen.current === text) {
      const clear = setTimeout(() => setOptions([]), 0);
      return () => clearTimeout(clear);
    }
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/who-has/units?q=${encodeURIComponent(query)}`, { cache: "no-store" }).catch(() => null);
      const data = (await response?.json().catch(() => null)) as { units?: PickedUnit[] } | null;
      setOptions(data?.units ?? []);
    }, 200);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div className="who-has-field">
      <input
        value={text}
        onChange={(event) => { chosen.current = null; setText(event.target.value); if (!event.target.value) onClear?.(); }}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
      />
      {options.length ? (
        <ul className="who-has-suggestions" role="listbox">
          {options.map((unit) => (
            <li key={unit.id}>
              <button type="button" onClick={() => { chosen.current = unit.name; setText(unit.name); setOptions([]); onPick(unit); }}>{unit.name}</button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
