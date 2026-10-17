"use client";

import UnitPicker, { type PickedUnit } from "@/app/unit-picker";

export type Slot = PickedUnit | null;
export type RosterChip = { id: string; name: string; relic: number };

/**
 * A squad as a row of chips, leader first. One search box adds the next unit; tapping a chip takes it out; your own
 * strongest units (when given) are one tap away. Units fill from the left, so there are no gaps.
 */
export default function SquadBuilder({ label, size, slots, onChange, locked, roster }: { label: string; size: number; slots: Slot[]; onChange: (next: Slot[]) => void; locked?: PickedUnit; roster?: RosterChip[] }) {
  const filled = slots.slice(0, size).filter((slot): slot is PickedUnit => Boolean(slot));
  const full = filled.length >= size;
  const set = (units: PickedUnit[]) => onChange([...units, ...Array.from({ length: Math.max(5, slots.length) - units.length }, () => null)]);
  const add = (unit: PickedUnit) => { if (!full && !filled.some((existing) => existing.id === unit.id)) set([...filled, unit]); };
  const remove = (index: number) => { if (index === 0 && locked) return; set(filled.filter((_, i) => i !== index)); };
  const suggestions = (roster ?? []).filter((unit) => !filled.some((existing) => existing.id === unit.id)).slice(0, 14);

  return (
    <div className="sb">
      <div className="sb-row" aria-label={`${label} squad`}>
        {Array.from({ length: size }, (_, index) => {
          const unit = filled[index];
          return unit
            ? <button key={unit.id} type="button" className={`sb-chip${index === 0 ? " is-leader" : ""}`} onClick={() => remove(index)} disabled={index === 0 && Boolean(locked)} title={index === 0 && locked ? "Locked" : "Tap to remove"}>{unit.name}{index === 0 && locked ? null : <i aria-hidden="true">×</i>}</button>
            : <span key={`empty-${index}`} className="sb-chip is-empty">{index === 0 ? "Leader" : `Unit ${index + 1}`}</span>;
        })}
      </div>
      {!full ? <UnitPicker key={filled.length} label={`Add a ${label.toLowerCase()} unit`} placeholder={filled.length === 0 ? "Search for the leader" : "Search for the next unit"} onPick={add} /> : null}
      {!full && suggestions.length ? (
        <div className="sb-suggest">
          <small>From your roster</small>
          <div>{suggestions.map((unit) => <button key={unit.id} type="button" onClick={() => add({ id: unit.id, name: unit.name })}>{unit.name}{unit.relic ? <i> R{unit.relic}</i> : null}</button>)}</div>
        </div>
      ) : null}
    </div>
  );
}
