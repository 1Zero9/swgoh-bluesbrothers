"use client";

import { useCallback, useEffect, useState } from "react";
import UnitPicker, { type PickedUnit } from "@/app/unit-picker";
import NavIcon from "@/app/nav-icon";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";
import MatchCard, { type Listing } from "./match-card";
import SubmitForm from "./submit-form";

type Wanted = { id: string; mode: string; leaderUnitId: string; leaderName: string; note: string | null; requestedByName: string; mine: boolean };
const SEARCH_MODES: KbMode[] = ["TW", "GAC_5V5", "GAC_3V3"];

export default function KnowledgeClient({ names, canAct }: { names: Record<string, string>; canAct: boolean }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"" | KbMode>("");
  const [hits, setHits] = useState<Listing[] | null>(null);
  const [wanted, setWanted] = useState<Wanted[]>([]);
  const [panel, setPanel] = useState<"none" | "add" | "help">("none");
  const [prefill, setPrefill] = useState<{ mode: KbMode; leader: PickedUnit } | null>(null);

  // help form
  const [helpMode, setHelpMode] = useState<KbMode>("TW");
  const [helpLeader, setHelpLeader] = useState<PickedUnit | null>(null);
  const [helpNote, setHelpNote] = useState("");
  const [helpMessage, setHelpMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (text.trim()) params.set("q", text.trim());
    if (mode) params.set("mode", mode);
    const response = await fetch(`/api/knowledge?${params}`, { cache: "no-store" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { hits?: Listing[] } | null;
    setHits(data?.hits ?? []);
  }, [text, mode]);

  const loadWanted = useCallback(async () => {
    const response = await fetch("/api/knowledge/request", { cache: "no-store" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { requests?: Wanted[] } | null;
    setWanted(data?.requests ?? []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 250);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const timer = setTimeout(() => { void loadWanted(); }, 0);
    return () => clearTimeout(timer);
  }, [loadWanted]);

  async function askForHelp(event: React.FormEvent) {
    event.preventDefault();
    if (!helpLeader) { setHelpMessage({ ok: false, text: "Pick the enemy squad's leader." }); return; }
    const response = await fetch("/api/knowledge/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: helpMode, leaderUnitId: helpLeader.id, note: helpNote }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string; created?: boolean; posted?: boolean } | null;
    if (data?.ok) {
      setHelpMessage({ ok: true, text: data.created === false ? "Someone has already asked for that one. It's on the Wanted list." : data.posted ? "Sent. The guild has been asked in Discord, and it's on the Wanted list." : "Added to the Wanted list." });
      void loadWanted();
    } else setHelpMessage({ ok: false, text: data?.error ?? "That didn't go through. Try again." });
  }

  return (
    <div className="kb">
      <div className="kb-search">
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Search a team or character, e.g. Lord Vader, GAS, Jabba" aria-label="Search counters" />
        <select value={mode} onChange={(event) => setMode(event.target.value as "" | KbMode)} aria-label="Game mode">
          <option value="">Every mode</option>
          {SEARCH_MODES.map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
        </select>
      </div>

      {canAct ? (
        <div className="kb-actions">
          <button type="button" className="kb-primary" onClick={() => { setPrefill(null); setPanel(panel === "add" ? "none" : "add"); }}><NavIcon name="check" size={18} />Add a counter</button>
          <button type="button" className="kb-secondary" onClick={() => setPanel(panel === "help" ? "none" : "help")}><NavIcon name="help" size={18} />I need a counter</button>
        </div>
      ) : null}

      {panel === "help" ? (
        <form className="kb-form kb-panel" onSubmit={askForHelp}>
          <h3>Ask the guild for a counter</h3>
          <label>Where do you need it?
            <select value={helpMode} onChange={(event) => setHelpMode(event.target.value as KbMode)}>{SEARCH_MODES.map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}</select>
          </label>
          <label>The enemy squad&apos;s leader<UnitPicker label="Enemy leader" placeholder="e.g. Lord Vader" onPick={setHelpLeader} onClear={() => setHelpLeader(null)} /></label>
          <label>Anything else? (optional)<input value={helpNote} onChange={(event) => setHelpNote(event.target.value)} maxLength={300} placeholder="e.g. I only have these toons at R5" /></label>
          <button type="submit" className="kb-primary">Ask for help</button>
          {helpMessage ? <p className={helpMessage.ok ? "kb-ok" : "kb-error"} role="status">{helpMessage.text}</p> : null}
        </form>
      ) : null}
      {panel === "add" ? <div className="kb-panel"><h3>Add a counter</h3><SubmitForm key={prefill?.leader.id ?? "new"} prefill={prefill} onDone={() => void loadWanted()} /></div> : null}

      {wanted.length ? (
        <section className="kb-wanted" aria-label="Counters the guild is looking for">
          <h3>Wanted: can you help?</h3>
          <ul>
            {wanted.map((item) => (
              <li key={item.id}>
                <span><strong>{item.leaderName}</strong> · {MODE_LABELS[item.mode as KbMode] ?? item.mode}{item.note ? ` · ${item.note}` : ""}<small> asked by {item.mine ? "you" : item.requestedByName}</small></span>
                {canAct ? <button type="button" className="kb-link" onClick={() => { setPrefill({ mode: item.mode as KbMode, leader: { id: item.leaderUnitId, name: item.leaderName } }); setPanel("add"); }}>I have one</button> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Counters">
        {hits === null ? <p className="kb-empty">Loading…</p> : hits.length === 0 ? (
          <div className="kb-empty">
            <strong>{text || mode ? "Nothing here matches yet." : "No counters have been published yet."}</strong>
            <p>{canAct ? "Add one you use, or ask the guild for help with a squad. Officers review everything before it shows here." : "Check back soon."}</p>
          </div>
        ) : hits.map((hit) => <MatchCard key={hit.id} item={hit} names={names} canMark={canAct} />)}
      </section>
    </div>
  );
}
