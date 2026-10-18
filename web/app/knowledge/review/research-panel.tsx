"use client";

import { useRef, useState } from "react";
import UnitPicker, { type PickedUnit } from "@/app/unit-picker";
import NavIcon from "@/app/nav-icon";
import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";

type Report = {
  filed: { attacker: string; defender: string; status: string; newRecord: boolean; url: string }[];
  rejected: { what: string; reason: string }[];
  sources: { title: string; url: string; host: string }[];
  notes: string;
};

const MODES: KbMode[] = ["TW", "GAC_5V5", "GAC_3V3"];

/** Enemy leaders members meet most. These are only names to look up: each is matched against the real unit list, and anything not recognised is skipped. */
const STARTER_LEADERS = [
  "Lord Vader", "Darth Revan", "Darth Malak", "Jedi Knight Revan", "Jedi Master Kenobi", "Grand Master Yoda", "Supreme Leader Kylo Ren", "Sith Eternal Emperor",
  "Emperor Palpatine", "Rey", "Jedi Knight Luke Skywalker", "Commander Luke Skywalker", "General Skywalker", "Padmé Amidala", "Darth Traya", "Bastila Shan (Fallen)",
  "Jedi Master Luke Skywalker", "Mother Talzin", "Geonosian Brood Alpha", "Bossk", "Boba Fett", "Cad Bane", "Pirate King Hondo Ohnaka", "General Kenobi",
  "Captain Rex", "Commander Ahsoka Tano", "Ahsoka Tano (Fulcrum)", "Qi'ra", "Wat Tambor", "Jabba the Hutt",
];

const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
type Row = { name: string; state: "waiting" | "running" | "done" | "skipped" | "failed"; note?: string };

/** Officers: ask B-Lue3 to search the web for counters to one enemy squad. Everything he finds goes to the queue below for review. */
export default function ResearchPanel({ onDone = () => undefined }: { onDone?: () => void }) {
  const [mode, setMode] = useState<KbMode>("TW");
  const [leader, setLeader] = useState<PickedUnit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [batching, setBatching] = useState(false);
  const [batchMessage, setBatchMessage] = useState("");
  const stopRef = useRef(false);

  /** One squad at a time (each is a real web search), stopping cleanly if the weekly research allowance runs out. */
  async function fillList() {
    if (batching) return;
    stopRef.current = false;
    setBatching(true);
    setBatchMessage("");
    const list: Row[] = STARTER_LEADERS.map((name) => ({ name, state: "waiting" }));
    setRows(list);
    const update = (index: number, row: Partial<Row>) => setRows((current) => current.map((item, i) => (i === index ? { ...item, ...row } : item)));
    let filed = 0;
    for (let index = 0; index < list.length; index += 1) {
      if (stopRef.current) break;
      const name = list[index].name;
      update(index, { state: "running" });
      const found = (await fetch(`/api/who-has/units?q=${encodeURIComponent(name)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null)) as { units?: PickedUnit[] } | null;
      const unit = found?.units?.find((u) => norm(u.name) === norm(name)) ?? null;
      if (!unit) { update(index, { state: "skipped", note: "not a unit name I recognise" }); continue; }
      const response = await fetch("/api/knowledge/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, leaderUnitId: unit.id }) }).catch(() => null);
      const data = (await response?.json().catch(() => null)) as { ok?: boolean; report?: Report; error?: string } | null;
      if (data?.ok && data.report) { filed += data.report.filed.length; update(index, { state: "done", note: `${data.report.filed.length} filed` }); onDone(); continue; }
      if (response?.status === 429 || response?.status === 503) {
        update(index, { state: "failed", note: data?.error ?? "stopped" });
        setBatchMessage(response.status === 429 ? "The weekly research allowance is used up, so I stopped here. Raise BLUE_RESEARCH_LIMIT in Vercel (for example 60) to do more, or carry on after Monday." : (data?.error ?? "Research needs B-Lue3's AI and web search switched on."));
        break;
      }
      update(index, { state: "failed", note: data?.error ?? "didn't finish" });
    }
    setBatching(false);
    setBatchMessage((current) => current || `Finished. ${filed} counters are in the queue below for you to check and publish.`);
  }

  async function run(event: React.FormEvent) {
    event.preventDefault();
    if (!leader || busy) { if (!leader) setError("Pick the enemy squad's leader."); return; }
    setBusy(true);
    setError("");
    setReport(null);
    const response = await fetch("/api/knowledge/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, leaderUnitId: leader.id }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; report?: Report; error?: string; detail?: string } | null;
    setBusy(false);
    if (data?.ok && data.report) { setReport(data.report); onDone(); }
    else setError(`${data?.error ?? "The research didn't finish. Try again."}${data?.detail ? ` [${data.detail}]` : ""}`);
  }

  return (
    <section className="kb-panel" aria-label="Research with B-Lue3">
      <h3>Research with B-Lue3</h3>
      <p className="kb-meta">B-Lue3 searches the web for counters to one enemy squad and files what he finds below as candidates, each with its source. He can&apos;t publish; you decide. He can get it wrong.</p>
      <form className="kb-form" onSubmit={run}>
        <label>Game mode
          <select value={mode} onChange={(event) => setMode(event.target.value as KbMode)}>{MODES.map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}</select>
        </label>
        <label>The enemy squad&apos;s leader<UnitPicker label="Enemy leader" placeholder="e.g. Pirate King Hondo Ohnaka" onPick={setLeader} onClear={() => setLeader(null)} /></label>
        <button type="submit" className="kb-primary" disabled={busy}><NavIcon name="blue" size={18} />{busy ? "Searching… up to a minute" : "Research"}</button>
      </form>
      <div className="kb-batch">
        <h4>Fill the list in one go</h4>
        <p className="kb-batch-note">Researches the {STARTER_LEADERS.length} enemy squads members meet most, in {MODE_LABELS[mode]}, one after another (about {Math.ceil(STARTER_LEADERS.length * 0.75)} minutes). Keep this page open. Each one uses one research from your weekly allowance, and everything lands in the queue as a candidate. Nothing is published until you say so.</p>
        <p>
          <button type="button" className="kb-primary" onClick={() => void fillList()} disabled={batching || busy}><NavIcon name="blue" size={18} />{batching ? "Researching…" : "Research the popular squads"}</button>
          {batching ? <button type="button" className="kb-secondary" onClick={() => { stopRef.current = true; }}>Stop after this one</button> : null}
        </p>
        {rows.length ? <ul className="kb-batch-rows">{rows.map((row) => <li key={row.name} className={`is-${row.state}`}><span>{row.state === "done" ? "✓" : row.state === "running" ? "…" : row.state === "failed" ? "✕" : row.state === "skipped" ? "–" : "·"}</span> {row.name}{row.note ? <small> · {row.note}</small> : null}</li>)}</ul> : null}
        {batchMessage ? <p className="kb-ok" role="status">{batchMessage}</p> : null}
      </div>
      {error ? <p className="kb-error" role="alert">{error}</p> : null}
      {report ? (
        <div className="kb-report" role="status">
          <p className="kb-ok"><strong>{report.filed.length}</strong> filed for review{report.rejected.length ? `, ${report.rejected.length} set aside` : ""}.</p>
          {report.filed.map((item, index) => <p key={index}>• <strong>{item.attacker}</strong> into {item.defender} · <a href={item.url} target="_blank" rel="noreferrer noopener">source</a>{item.newRecord ? "" : " · already known, source added"}</p>)}
          {report.rejected.map((item, index) => <p key={index} className="kb-warn">• Set aside ({item.what}): {item.reason}</p>)}
          {report.sources.length ? <p className="kb-meta">Pages he found: {report.sources.map((source, index) => <span key={source.url}>{index ? " · " : ""}<a href={source.url} target="_blank" rel="noreferrer noopener">{source.title}</a></span>)}</p> : null}
          {report.filed.length === 0 ? <details><summary className="kb-link">What he found</summary><p className="kb-meta">{report.notes || "Nothing."}</p></details> : null}
        </div>
      ) : null}
    </section>
  );
}
