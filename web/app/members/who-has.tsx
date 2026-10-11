"use client";

import { useEffect, useRef, useState } from "react";

type Unit = { id: string; name: string };
type Holder = { name: string; stars: number; relic: number; gear: number };
type Result = { unit: Unit | null; holders: Holder[]; totalMembers: number; minStars: number };

/** "Who has…?": type a unit, pick it, optionally set a minimum star level, see who has it and how far they've taken it. */
export default function WhoHas() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Unit[]>([]);
  const [minStars, setMinStars] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picked = useRef<Unit | null>(null);
  // Only the newest search may show its answer; an older, slower one must not overwrite it.
  const latest = useRef(0);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2 || picked.current?.name === query) {
      const clear = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(clear);
    }
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/who-has/units?q=${encodeURIComponent(text)}`, { cache: "no-store" }).catch(() => null);
      const data = (await response?.json().catch(() => null)) as { units?: Unit[] } | null;
      setSuggestions(data?.units ?? []);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  async function lookup(unit: string, stars: number) {
    const mine = ++latest.current;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/who-has?unit=${encodeURIComponent(unit)}&minStars=${stars}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as (Omit<Result, "minStars"> & { ok?: boolean; error?: string }) | null;
      if (mine !== latest.current) return;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Couldn't look that up.");
      setResult({ ...data, minStars: stars });
    } catch (err) {
      if (mine === latest.current) setError(err instanceof Error ? err.message : "Couldn't look that up.");
    } finally {
      if (mine === latest.current) setBusy(false);
    }
  }

  function choose(unit: Unit) {
    picked.current = unit;
    setQuery(unit.name);
    setSuggestions([]);
    void lookup(unit.id, minStars);
  }

  function changeStars(stars: number) {
    setMinStars(stars);
    if (picked.current) void lookup(picked.current.id, stars);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim()) void lookup(picked.current?.name === query ? picked.current.id : query.trim(), minStars);
  }

  return (
    <section className="who-has" aria-label="Who has a unit">
      <header>
        <p className="eyebrow">Roster search</p>
        <h2>Who has…?</h2>
      </header>
      <form onSubmit={submit}>
        <div className="who-has-field">
          <input
            value={query}
            onChange={(event) => { picked.current = null; setQuery(event.target.value); }}
            placeholder="Type a unit, e.g. dark yoda"
            aria-label="Unit"
            autoComplete="off"
          />
          {suggestions.length ? (
            <ul className="who-has-suggestions" role="listbox">
              {suggestions.map((unit) => (
                <li key={unit.id}><button type="button" onClick={() => choose(unit)}>{unit.name}</button></li>
              ))}
            </ul>
          ) : null}
        </div>
        <select value={minStars} onChange={(event) => changeStars(Number(event.target.value))} aria-label="Minimum stars">
          <option value={0}>Any stars</option>
          {[3, 4, 5, 6, 7].map((stars) => <option key={stars} value={stars}>{stars}★ or more</option>)}
        </select>
        <button type="submit" disabled={busy || !query.trim()}>{busy ? "Looking…" : "Search"}</button>
      </form>

      {error ? <p className="who-has-note who-has-error">{error}</p> : null}
      {result && !result.unit ? <p className="who-has-note">I couldn&apos;t find that unit. Try part of its name.</p> : null}
      {result?.unit ? (
        <div className="who-has-result">
          <p className="who-has-head"><strong>{result.unit.name}</strong>: {result.holders.length} of {result.totalMembers} members{result.minStars ? ` at ${result.minStars}★ or more` : ""}</p>
          {result.holders.length ? (
            <ul>
              {result.holders.map((holder) => (
                <li key={holder.name}>
                  <span className="who-has-stars">{holder.stars}★</span>
                  <span className="who-has-level">{holder.relic > 0 ? `R${holder.relic}` : `G${holder.gear}`}</span>
                  <span>{holder.name}</span>
                </li>
              ))}
            </ul>
          ) : <p className="who-has-note">Nobody yet.</p>}
        </div>
      ) : null}
    </section>
  );
}
