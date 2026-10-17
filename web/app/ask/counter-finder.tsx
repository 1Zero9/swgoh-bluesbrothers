"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import UnitPicker, { type PickedUnit } from "@/app/unit-picker";
import MatchCard, { type Listing } from "@/app/knowledge/match-card";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import type { CounterView } from "@/lib/counters-data";

const MODES: KbMode[] = ["TW", "GAC_5V5", "GAC_3V3"];
const SHORT: Record<string, string> = { TW: "Territory War", GAC_5V5: "GAC 5v5", GAC_3V3: "GAC 3v3" };

/**
 * Find a counter from the guild's own knowledge, free: pick the enemy leader (and a mode), see the checked counters and the squads
 * members saved, with whether you can run them. If nothing fits, one tap hands the question to B-Lue3 or to the guild.
 */
export default function CounterFinder({ names, canAct, onAskBlue }: { names: Record<string, string>; canAct: boolean; onAskBlue: (question: string) => void }) {
  const [enemy, setEnemy] = useState<PickedUnit | null>(null);
  const [mode, setMode] = useState<"" | KbMode>("");
  const [hits, setHits] = useState<Listing[] | null>(null);
  const [saved, setSaved] = useState<CounterView[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enemy) { setHits(null); setSaved([]); return; }
    setLoading(true);
    const params = new URLSearchParams({ unit: enemy.id });
    if (mode) params.set("mode", mode);
    const [known, own] = await Promise.all([
      fetch(`/api/knowledge?${params}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null) as Promise<{ hits?: Listing[] } | null>,
      fetch(`/api/counters?enemy=${encodeURIComponent(enemy.id)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null) as Promise<{ counters?: CounterView[] } | null>,
    ]);
    setHits(known?.hits ?? []);
    // Saved squads are tagged TW, GAC or both; a mode filter keeps the ones that fit it (fleet modes fit none of them).
    const fits = (counterMode: string) => !mode || counterMode === "BOTH" || (mode === "TW" && counterMode === "TW") || ((mode === "GAC_5V5" || mode === "GAC_3V3") && counterMode === "GAC");
    setSaved((own?.counters ?? []).filter((counter) => fits(counter.mode)));
    setLoading(false);
  }, [enemy, mode]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const empty = enemy && hits !== null && !hits.length && !saved.length && !loading;
  const question = enemy ? `How do I beat ${enemy.name}${mode ? ` in ${MODE_LABELS[mode]}` : ""}?` : "";

  return (
    <div className="cf">
      <div className="cf-bar">
        <UnitPicker label="Enemy squad leader" placeholder="Who are you facing? e.g. Lord Vader" onPick={setEnemy} onClear={() => setEnemy(null)} />
        <div className="hub-segment cf-modes" role="group" aria-label="Game mode">
          <button type="button" aria-pressed={mode === ""} onClick={() => setMode("")}>Any</button>
          {MODES.map((m) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>{SHORT[m]}</button>)}
        </div>
      </div>

      {!enemy ? <p className="cf-hint">Pick the enemy squad&apos;s leader to see the counters the guild trusts. This is free and never uses a question.</p> : null}
      {loading && !hits ? <p className="cf-hint">Looking…</p> : null}

      {hits?.length ? <section aria-label="Checked counters" className="cf-list"><h3>Checked by officers</h3>{hits.map((hit) => <MatchCard key={hit.id} item={hit} names={names} canMark={canAct} />)}</section> : null}

      {saved.length ? (
        <section aria-label="Saved squads" className="cf-list">
          <h3>Saved by members</h3>
          {saved.map((counter) => (
            <article key={counter.id} className="kb-card cf-saved">
              <header><strong>{counter.title}</strong><span className="kb-badge kb-badge-mode">{counter.mode === "BOTH" ? "TW + GAC" : counter.mode}</span></header>
              <p className="kb-squad">{counter.squad.map((slot, i) => <span key={slot.unitId} className={`kb-chip${i === 0 ? " kb-chip-leader" : ""}`}>{slot.name}{slot.minRelic > 0 ? <i> R{slot.minRelic}+</i> : null}</span>)}</p>
              {counter.notes ? <p className="kb-strategy">{counter.notes}</p> : null}
              {counter.readiness.you ? <p className={`counter-you${counter.readiness.you.ready ? " is-ready" : ""}`}>{counter.readiness.you.ready ? "You can run this now." : `You are not there yet: ${counter.readiness.you.gaps.slice(0, 3).join("; ")}`}</p> : null}
              <footer><span className="kb-meta">{counter.readiness.ready.length} guildmate{counter.readiness.ready.length === 1 ? "" : "s"} ready · saved by {counter.createdByName}</span></footer>
            </article>
          ))}
        </section>
      ) : null}

      {empty ? (
        <div className="cf-empty">
          <strong>The guild has nothing saved for {enemy.name}{mode ? ` in ${MODE_LABELS[mode]}` : ""} yet.</strong>
          <p>You have two ways forward. The web search uses one of your weekly questions and can be wrong; asking the guild is free.</p>
          <div className="cf-actions">
            <button type="button" className="kb-primary" onClick={() => onAskBlue(question)}>Ask B-Lue3 to search the web</button>
            {canAct ? <Link className="kb-secondary" href="/knowledge">Ask the guild for a counter</Link> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
