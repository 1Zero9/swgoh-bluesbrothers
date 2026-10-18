"use client";

import { useCallback, useEffect, useState } from "react";
import UnitPicker, { type PickedUnit } from "@/app/unit-picker";
import MatchCard, { type Listing } from "@/app/knowledge/match-card";
import SubmitForm from "@/app/knowledge/submit-form";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import type { CounterView } from "@/lib/counters-data";

const MODES: KbMode[] = ["TW", "GAC_5V5", "GAC_3V3"];
const SHORT: Record<string, string> = { TW: "Territory War", GAC_5V5: "GAC 5v5", GAC_3V3: "GAC 3v3" };

type Wanted = { id: string; mode: string; leaderUnitId: string; leaderName: string; note: string | null; requestedByName: string; mine: boolean };

/**
 * Find a counter from the guild's own knowledge, free: pick the enemy leader (and a mode), see the checked counters and the squads
 * members saved, with whether you can run them. If nothing fits, one tap hands the question to B-Lue3 or to the guild.
 */
export default function CounterFinder({ names, canAct, onAskBlue }: { names: Record<string, string>; canAct: boolean; /** Absent when B-Lue3's AI is switched off. */ onAskBlue?: (question: string) => void }) {
  const [enemy, setEnemy] = useState<PickedUnit | null>(null);
  const [mode, setMode] = useState<"" | KbMode>("");
  const [hits, setHits] = useState<Listing[] | null>(null);
  const [saved, setSaved] = useState<CounterView[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [wanted, setWanted] = useState<Wanted[]>([]);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [helping, setHelping] = useState<Wanted | null>(null);
  const [addFor, setAddFor] = useState<{ mode: KbMode; leader: PickedUnit } | null>(null);

  // B-Lue3's chat can send someone here to add a counter for the squad he found nothing on.
  useEffect(() => {
    const onAdd = (event: Event) => {
      const detail = (event as CustomEvent<{ unitId: string; name: string; mode: KbMode | null }>).detail;
      if (!detail?.unitId) return;
      setAddFor({ mode: detail.mode ?? "TW", leader: { id: detail.unitId, name: detail.name } });
      setAdding(true);
      requestAnimationFrame(() => document.getElementById("cf-add-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    window.addEventListener("bb-add-counter", onAdd);
    return () => window.removeEventListener("bb-add-counter", onAdd);
  }, []);

  const loadWanted = useCallback(async () => {
    const data = (await fetch("/api/knowledge/request", { cache: "no-store" }).then((r) => r.json()).catch(() => null)) as { requests?: Wanted[] } | null;
    setWanted(data?.requests ?? []);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { if (canAct) void loadWanted(); }, 0);
    return () => clearTimeout(timer);
  }, [canAct, loadWanted]);

  async function sendRequest() {
    if (!enemy) return;
    setAsking(true);
    const response = await fetch("/api/knowledge/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: mode || "TW", leaderUnitId: enemy.id, note }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string; created?: boolean } | null;
    setAsking(false);
    if (data?.ok) { setNote(""); setNotice(data.created === false ? "Someone has already asked for that one. We'll tell you both when a counter is added." : "Asked. You'll be told here and on Discord when an officer checks a counter for it."); void loadWanted(); }
    else setNotice(data?.error ?? "That didn't send. Try again.");
  }

  async function cancelRequest(id: string) {
    await fetch("/api/knowledge/request", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    setNotice("Your request was cancelled.");
    void loadWanted();
  }

  const load = useCallback(async () => {
    if (!enemy) { setHits(null); setSaved([]); return; }
    setLoading(true);
    const params = new URLSearchParams({ unit: enemy.id, log: "1" });
    if (mode) params.set("mode", mode);
    const [known, own] = await Promise.all([
      fetch(`/api/knowledge?${params}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null) as Promise<{ hits?: Listing[] } | null>,
      fetch(`/api/counters?enemy=${encodeURIComponent(enemy.id)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null) as Promise<{ counters?: CounterView[]; isOfficer?: boolean } | null>,
    ]);
    setHits(known?.hits ?? []);
    setIsOfficer(Boolean(own?.isOfficer));
    // Saved squads are tagged TW, GAC or both; a mode filter keeps the ones that fit it (fleet modes fit none of them).
    const fits = (counterMode: string) => !mode || counterMode === "BOTH" || (mode === "TW" && counterMode === "TW") || ((mode === "GAC_5V5" || mode === "GAC_3V3") && counterMode === "GAC");
    setSaved((own?.counters ?? []).filter((counter) => fits(counter.mode)));
    setLoading(false);
  }, [enemy, mode]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function removeSaved(id: string) {
    if (!window.confirm("Remove this saved squad?")) return;
    await fetch("/api/counters", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    void load();
  }

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

      {canAct ? (
        <div className="cf-addrow">
          <button type="button" className="kb-secondary" onClick={() => setAdding((value) => !value)}>{adding ? "Close" : "+ Add a counter"}</button>
          <span className="cf-hint">Know one that works? Add it. An officer checks it before others see it.</span>
        </div>
      ) : null}
      {adding ? <div className="kb-panel" id="cf-add-panel"><h3>Add a counter{(addFor ?? (enemy ? { leader: enemy } : null)) ? ` for ${(addFor?.leader ?? enemy)?.name}` : ""}</h3><SubmitForm key={addFor?.leader.id ?? enemy?.id ?? "blank"} prefill={addFor ?? (enemy ? { mode: mode || "TW", leader: enemy } : null)} onDone={() => { setAddFor(null); setAdding(false); void load(); }} /></div> : null}

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
              <footer><span className="kb-meta">{counter.readiness.ready.length} guildmate{counter.readiness.ready.length === 1 ? "" : "s"} ready · saved by {counter.createdByName}</span>{counter.mine || isOfficer ? <button type="button" className="kb-link" onClick={() => void removeSaved(counter.id)}>Remove</button> : null}</footer>
            </article>
          ))}
        </section>
      ) : null}

      {notice ? <p className="kb-notice" role="status">{notice}<button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></p> : null}

      {empty ? (
        <div className="cf-empty">
          <strong>The guild has nothing saved for {enemy.name}{mode ? ` in ${MODE_LABELS[mode]}` : ""} yet.</strong>
          <p>You have three ways forward. Add one you already know (best, and free), ask the guild, or let B-Lue3 search the web, which uses one of your weekly questions and can be wrong.</p>
          <div className="cf-actions">
            {onAskBlue ? <button type="button" className="kb-primary" onClick={() => onAskBlue(question)}>Search the web with B-Lue3 · uses 1 question</button> : null}
            {canAct ? <button type="button" className="kb-secondary" onClick={() => { setAddFor(null); setAdding(true); requestAnimationFrame(() => document.getElementById("cf-add-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>Add a counter you know</button> : null}
          </div>
          {canAct ? (
            <div className="cf-request">
              <label>Ask the guild instead (free)
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Anything that helps? e.g. I only have G12 Rey" />
              </label>
              <button type="button" className="kb-secondary" disabled={asking} onClick={() => void sendRequest()}>{asking ? "Sending…" : "Ask the guild for a counter"}</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {canAct && wanted.length ? (
        <section aria-label="Members asking for a counter" className="cf-list">
          <h3>Members asking for a counter</h3>
          <ul className="cf-wanted">
            {wanted.map((item) => (
              <li key={item.id}>
                <span><strong>{item.leaderName}</strong> <small>{SHORT[item.mode] ?? item.mode} · {item.mine ? "you asked" : `asked by ${item.requestedByName}`}{item.note ? ` · ${item.note}` : ""}</small></span>
                {item.mine
                  ? <button type="button" className="kb-link" onClick={() => void cancelRequest(item.id)} aria-label={`Cancel my request for ${item.leaderName}`}>Cancel</button>
                  : <button type="button" className="kb-secondary" onClick={() => { setHelping(item); setAdding(false); }}>I know a counter</button>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {helping ? (
        <div className="kb-panel">
          <h3>Add a counter for {helping.leaderName}</h3>
          <SubmitForm prefill={{ mode: helping.mode as KbMode, leader: { id: helping.leaderUnitId, name: helping.leaderName } as PickedUnit }} onDone={() => { setHelping(null); void loadWanted(); }} />
          <button type="button" className="kb-link" onClick={() => setHelping(null)}>Close</button>
        </div>
      ) : null}
    </div>
  );
}
