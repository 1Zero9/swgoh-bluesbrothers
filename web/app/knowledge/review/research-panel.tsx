"use client";

import { useState } from "react";
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

/** Officers: ask B-Lue3 to search the web for counters to one enemy squad. Everything he finds goes to the queue below for review. */
export default function ResearchPanel({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<KbMode>("TW");
  const [leader, setLeader] = useState<PickedUnit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);

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
