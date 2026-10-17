"use client";

import { useEffect, useState } from "react";
import type { PickedUnit } from "@/app/unit-picker";
import { MODE_LABELS, squadRules, type KbMode } from "@/lib/knowledge/modes";
import SquadBuilder, { type RosterChip, type Slot } from "./squad-builder";

const GROUND_MODES: KbMode[] = ["TW", "GAC_5V5", "GAC_3V3"];
const SHORT: Record<string, string> = { TW: "Territory War", GAC_5V5: "GAC 5v5", GAC_3V3: "GAC 3v3" };
const EVIDENCE: { value: string; label: string; from: string }[] = [
  { value: "INDIVIDUAL_BATTLE", label: "I beat it with this", from: "My own battles" },
  { value: "DEMONSTRATION", label: "I saw it done", from: "A video or a guildmate" },
  { value: "COMMUNITY_REPORT", label: "I read it", from: "Community report" },
  { value: "THEORY", label: "Untested idea", from: "My own idea" },
];

const blank = (): Slot[] => Array.from({ length: 5 }, () => null);

/** Add a counter in four short steps. It always goes to an officer for review before anyone else sees it. */
export default function SubmitForm({ prefill, onDone }: { prefill?: { mode: KbMode; leader: PickedUnit } | null; onDone: () => void }) {
  const [mode, setMode] = useState<KbMode>(prefill?.mode ?? "TW");
  const size = squadRules(mode).min;
  const [defender, setDefender] = useState<Slot[]>(() => { const s = blank(); if (prefill) s[0] = prefill.leader; return s; });
  const [attacker, setAttacker] = useState<Slot[]>(blank);
  const [roster, setRoster] = useState<RosterChip[]>([]);
  const [strategy, setStrategy] = useState("");
  const [opening, setOpening] = useState("");
  const [datacron, setDatacron] = useState(false);
  const [datacronEnds, setDatacronEnds] = useState("");
  const [evidenceType, setEvidenceType] = useState("INDIVIDUAL_BATTLE");
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void fetch("/api/my-roster", { cache: "no-store" }).then((r) => r.json()).then((d: { units?: RosterChip[] }) => setRoster(d.units ?? [])).catch(() => setRoster([]));
  }, []);

  const count = (slots: Slot[]) => slots.slice(0, size).filter(Boolean).length;
  const ready = count(defender) === size && count(attacker) === size && strategy.trim().length > 0;
  const chosen = EVIDENCE.find((e) => e.value === evidenceType) ?? EVIDENCE[0];
  const squadOf = (slots: Slot[]) => slots.slice(0, size).map((unit, index) => ({ unitId: unit?.id ?? "", role: index === 0 ? "LEADER" : "CORE" }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode, defender: { members: squadOf(defender) }, attacker: { members: squadOf(attacker) }, strategy, opening,
        datacron: { dependent: datacron, expiresAt: datacron ? datacronEnds : undefined },
        evidence: [{ type: evidenceType, sourceProvider: (url ? provider.trim() : "") || chosen.from, sourceUrl: url || undefined, observedAt: new Date().toISOString() }],
      }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string; created?: boolean } | null;
    setBusy(false);
    if (data?.ok) {
      setMessage({ ok: true, text: data.created === false ? "That counter is already in the list. Your source was added to it. Thank you." : "Thanks! An officer will review it before it goes live." });
      onDone();
    } else setMessage({ ok: false, text: data?.error ?? "That didn't go through. Try again." });
  }

  return (
    <form className="kb-form kb-steps" onSubmit={submit}>
      <section className="kb-step">
        <h4><i>1</i> Who are you facing?</h4>
        <div className="hub-segment" role="group" aria-label="Where is it for?">
          {GROUND_MODES.map((m) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} title={MODE_LABELS[m]}>{SHORT[m]}</button>)}
        </div>
        <SquadBuilder label="Enemy" size={size} slots={defender} onChange={setDefender} locked={prefill?.leader} />
      </section>

      <section className="kb-step">
        <h4><i>2</i> What beats it?</h4>
        <SquadBuilder label="Your" size={size} slots={attacker} onChange={setAttacker} roster={roster} />
      </section>

      <section className="kb-step">
        <h4><i>3</i> How do you run it?</h4>
        <textarea value={strategy} onChange={(event) => setStrategy(event.target.value)} rows={3} maxLength={1200} placeholder="Who goes first, what to hit, what to watch out for." required aria-label="How do you run it?" />
        <details className="kb-more">
          <summary>More detail (opening move, Datacron)</summary>
          <label>Opening move<input value={opening} onChange={(event) => setOpening(event.target.value)} maxLength={600} /></label>
          <label className="kb-check"><input type="checkbox" checked={datacron} onChange={(event) => setDatacron(event.target.checked)} /> It only works with a particular Datacron</label>
          {datacron ? <label>When does that Datacron end?<input type="date" value={datacronEnds} onChange={(event) => setDatacronEnds(event.target.value)} /></label> : null}
        </details>
      </section>

      <section className="kb-step">
        <h4><i>4</i> How do you know it works?</h4>
        <div className="hub-segment kb-evidence-pick" role="group" aria-label="How do you know it works?">
          {EVIDENCE.map((e) => <button key={e.value} type="button" aria-pressed={evidenceType === e.value} onClick={() => setEvidenceType(e.value)}>{e.label}</button>)}
        </div>
        <details className="kb-more">
          <summary>Add a link or a source name</summary>
          <label>A link<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" /></label>
          {url ? <label>Where is it from?<input value={provider} onChange={(event) => setProvider(event.target.value)} maxLength={80} placeholder="e.g. a YouTube channel or forum" /></label> : null}
        </details>
      </section>

      <div className="kb-submitrow">
        <button type="submit" className="kb-primary" disabled={busy || !ready}>{busy ? "Sending…" : "Send for review"}</button>
        {!ready ? <small>Fill both squads ({size} units each) and say how to run it.</small> : null}
      </div>
      {message ? <p className={message.ok ? "kb-ok" : "kb-error"} role="status">{message.text}</p> : null}
    </form>
  );
}
