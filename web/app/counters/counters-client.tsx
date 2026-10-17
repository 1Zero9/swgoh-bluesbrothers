"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import UnitPicker, { type PickedUnit } from "@/app/unit-picker";
import type { CounterView } from "@/lib/counters-data";
import NavIcon from "@/app/nav-icon";

type Slot = { unit: PickedUnit | null; minRelic: number; key: number };
const MODE_LABEL: Record<string, string> = { TW: "TW", GAC: "GAC", BOTH: "TW + GAC" };

export default function CountersClient({ aside }: { aside?: ReactNode }) {
  const [enemy, setEnemy] = useState<PickedUnit | null>(null);
  const [counters, setCounters] = useState<CounterView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newEnemy, setNewEnemy] = useState<PickedUnit | null>(null);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("BOTH");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<Slot[]>([{ unit: null, minRelic: 0, key: 1 }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async (enemyId: string | null) => {
    try {
      const response = await fetch(`/api/counters${enemyId ? `?enemy=${encodeURIComponent(enemyId)}` : ""}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; counters?: CounterView[]; canAdd?: boolean; isOfficer?: boolean } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Couldn't load the counters.");
      setCounters(data.counters ?? []);
      setCanAdd(Boolean(data.canAdd));
      setIsOfficer(Boolean(data.isOfficer));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the counters.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(enemy?.id ?? null), 0);
    return () => clearTimeout(timer);
  }, [enemy, load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const squad = slots.flatMap((slot) => (slot.unit ? [{ unitId: slot.unit.id, minStars: 7, minRelic: slot.minRelic }] : []));
    const response = await fetch("/api/counters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enemyLeaderId: newEnemy?.id, title, mode, squad, notes }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setSaving(false);
    if (!response?.ok || !data?.ok) return setFormError(data?.error || "Couldn't save that.");
    setAdding(false);
    setTitle(""); setNotes(""); setSlots([{ unit: null, minRelic: 0, key: 1 }]);
    setEnemy(newEnemy);
    setNewEnemy(null);
    await load(newEnemy?.id ?? null);
  }

  async function remove(id: string) {
    if (!confirm("Remove this counter?")) return;
    await fetch("/api/counters", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    await load(enemy?.id ?? null);
  }

  return (
    <div className="counters kb">
      <div className="counters-search kb-toolbar">
        <UnitPicker label="Enemy squad leader" placeholder="Enemy squad's leader, e.g. lord vader" onPick={setEnemy} onClear={() => setEnemy(null)} />
        {canAdd ? <button type="button" className="kb-secondary" onClick={() => setAdding(!adding)}>{adding ? "Cancel" : "+ Add a counter"}</button> : null}
      </div>

      {adding ? (
        <form className="counters-form kb-panel" onSubmit={save}>
          <h3>Add a counter</h3>
          <label>Enemy squad (its leader)<UnitPicker label="Enemy leader" placeholder="Start typing the enemy leader" onPick={setNewEnemy} onClear={() => setNewEnemy(null)} /></label>
          <label>Name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} placeholder="e.g. JMK squad" /></label>
          <label>Use it in
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="BOTH">Territory War and GAC</option><option value="TW">Territory War</option><option value="GAC">GAC</option>
            </select>
          </label>
          <div className="counters-slots">
            <p>Your squad, leader first (up to 5)</p>
            {slots.map((slot, index) => (
              <div key={slot.key} className="counters-slot">
                <UnitPicker label={`Unit ${index + 1}`} placeholder={index === 0 ? "Leader" : `Unit ${index + 1}`} onPick={(unit) => setSlots(slots.map((s) => (s.key === slot.key ? { ...s, unit } : s)))} onClear={() => setSlots(slots.map((s) => (s.key === slot.key ? { ...s, unit: null } : s)))} />
                <select value={slot.minRelic} aria-label="Minimum relic" onChange={(event) => setSlots(slots.map((s) => (s.key === slot.key ? { ...s, minRelic: Number(event.target.value) } : s)))}>
                  {Array.from({ length: 10 }, (_, relic) => <option key={relic} value={relic}>{relic === 0 ? "Any relic" : `Relic ${relic}+`}</option>)}
                </select>
              </div>
            ))}
            {slots.length < 5 ? <button type="button" onClick={() => setSlots([...slots, { unit: null, minRelic: 0, key: Math.max(...slots.map((s) => s.key)) + 1 }])}>+ Add a unit</button> : null}
          </div>
          <label>How to run it (optional)<textarea rows={2} maxLength={400} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Order, key mods, anything that makes it work" /></label>
          {formError ? <p className="who-has-error">{formError}</p> : null}
          <button type="submit" disabled={saving || !newEnemy || !title.trim() || !slots.some((slot) => slot.unit)}>{saving ? "Saving…" : "Save counter"}</button>
        </form>
      ) : null}

      {error ? <p className="who-has-note who-has-error">{error}</p> : null}
      {loaded && !error && !counters.length ? (
        <p className="who-has-note">{enemy ? `Nobody has added a counter to ${enemy.name} yet.` : "No counters yet."} {canAdd ? "Be the first: add one you trust." : ""}</p>
      ) : null}
      {!enemy && counters.length ? <p className="who-has-note">Newest counters. Search an enemy squad above to see its counters.</p> : null}

      <div className="kb-layout">
      {aside}
      <div className="counters-list kb-results">
        {counters.map((counter) => (
          <article key={counter.id} className="counter-card kb-card">
            <header>
              <div>
                <h3>{counter.title}</h3>
                <p>vs <strong>{counter.enemy.name}</strong> · {MODE_LABEL[counter.mode] ?? counter.mode} · by {counter.createdByName}</p>
              </div>
              {counter.mine || isOfficer ? <button type="button" className="counter-remove" onClick={() => void remove(counter.id)}>Remove</button> : null}
            </header>
            <p className="counter-squad kb-squad">{counter.squad.map((slot, index) => <span key={slot.unitId} className={`kb-chip${index === 0 ? " kb-chip-leader" : ""}`}>{slot.name}{slot.minRelic > 0 ? <i> R{slot.minRelic}+</i> : null}</span>)}</p>
            {counter.notes ? <p className="counter-notes">{counter.notes}</p> : null}
            {counter.readiness.you ? (
              <p className={`counter-you${counter.readiness.you.ready ? " is-ready" : ""}`}>
                {counter.readiness.you.ready ? <><NavIcon name="check" /> You can run this now.</> : <><NavIcon name="cross" /> You&apos;re not there yet: {counter.readiness.you.gaps.slice(0, 3).join("; ")}</>}
              </p>
            ) : null}
            <p className="counter-ready"><strong>Ready now ({counter.readiness.ready.length}):</strong> {counter.readiness.ready.length ? counter.readiness.ready.join(", ") : "nobody yet"}</p>
            {counter.readiness.close.length ? (
              <p className="counter-close"><strong>Closest:</strong> {counter.readiness.close.map((c) => `${c.name} (${c.gaps.slice(0, 2).join("; ")})`).join(" · ")}</p>
            ) : null}
          </article>
        ))}
      </div>
      </div>
    </div>
  );
}
