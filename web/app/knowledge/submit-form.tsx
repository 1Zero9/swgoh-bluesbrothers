"use client";

import { useState } from "react";
import UnitPicker, { type PickedUnit } from "@/app/unit-picker";
import { MODE_LABELS, squadRules, type KbMode } from "@/lib/knowledge/modes";

const GROUND_MODES: KbMode[] = ["TW", "GAC_5V5", "GAC_3V3"];
const EVIDENCE: { value: string; label: string }[] = [
  { value: "INDIVIDUAL_BATTLE", label: "I beat this squad with it" },
  { value: "DEMONSTRATION", label: "I saw it done (video or someone showed me)" },
  { value: "COMMUNITY_REPORT", label: "I read it somewhere" },
  { value: "THEORY", label: "It should work, but I haven't tried it" },
];

type Slot = PickedUnit | null;
const blank = (n: number): Slot[] => Array.from({ length: n }, () => null);

/** Add a counter to the knowledge base. It always goes to an officer for review before anyone else sees it. */
export default function SubmitForm({ prefill, onDone }: { prefill?: { mode: KbMode; leader: PickedUnit } | null; onDone: () => void }) {
  const [mode, setMode] = useState<KbMode>(prefill?.mode ?? "TW");
  const size = squadRules(mode).min;
  const [defender, setDefender] = useState<Slot[]>(() => { const s = blank(5); if (prefill) s[0] = prefill.leader; return s; });
  const [attacker, setAttacker] = useState<Slot[]>(blank(5));
  const [strategy, setStrategy] = useState("");
  const [opening, setOpening] = useState("");
  const [datacron, setDatacron] = useState(false);
  const [datacronEnds, setDatacronEnds] = useState("");
  const [evidenceType, setEvidenceType] = useState("INDIVIDUAL_BATTLE");
  const [provider, setProvider] = useState("My own battles");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const squadOf = (slots: Slot[]) => slots.slice(0, size).map((unit, index) => ({ unitId: unit?.id ?? "", role: index === 0 ? "LEADER" : "CORE" }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode, defender: { members: squadOf(defender) }, attacker: { members: squadOf(attacker) }, strategy, opening,
        datacron: { dependent: datacron, expiresAt: datacron ? datacronEnds : undefined },
        evidence: [{ type: evidenceType, sourceProvider: provider, sourceUrl: url || undefined, observedAt: new Date().toISOString() }],
      }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string; created?: boolean } | null;
    setBusy(false);
    if (data?.ok) {
      setMessage({ ok: true, text: data.created === false ? "That counter is already in the list. Your source was added to it. Thank you." : "Thanks! An officer will review it before it goes live." });
      onDone();
    } else setMessage({ ok: false, text: data?.error ?? "That didn't go through. Try again." });
  }

  const picker = (slots: Slot[], set: (next: Slot[]) => void, label: string, locked?: PickedUnit) => slots.slice(0, size).map((slot, index) => (
    <div key={`${label}-${index}`} className="kb-slot">
      {index === 0 && locked ? (
        <span className="kb-chip kb-chip-leader">{locked.name}</span>
      ) : (
        <UnitPicker label={`${label} ${index + 1}`} placeholder={index === 0 ? `${label} leader` : `${label} unit ${index + 1}`} onPick={(unit) => set(slots.map((s, i) => (i === index ? unit : s)))} onClear={() => set(slots.map((s, i) => (i === index ? null : s)))} />
      )}
    </div>
  ));

  return (
    <form className="kb-form" onSubmit={submit}>
      <label>Where is it for?
        <select value={mode} onChange={(event) => setMode(event.target.value as KbMode)}>
          {GROUND_MODES.map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
        </select>
      </label>
      <fieldset><legend>The enemy squad (leader first)</legend>{picker(defender, setDefender, "Enemy", prefill?.leader)}</fieldset>
      <fieldset><legend>Your counter squad (leader first)</legend>{picker(attacker, setAttacker, "Yours")}</fieldset>
      <label>How do you run it?<textarea value={strategy} onChange={(event) => setStrategy(event.target.value)} rows={4} maxLength={1200} placeholder="Who goes first, what to hit, what to watch out for." required /></label>
      <label>Opening move (optional)<input value={opening} onChange={(event) => setOpening(event.target.value)} maxLength={600} /></label>
      <label className="kb-check"><input type="checkbox" checked={datacron} onChange={(event) => setDatacron(event.target.checked)} /> It only works with a particular Datacron</label>
      {datacron ? <label>When does that Datacron end?<input type="date" value={datacronEnds} onChange={(event) => setDatacronEnds(event.target.value)} /></label> : null}
      <label>How do you know it works?
        <select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)}>{EVIDENCE.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}</select>
      </label>
      <label>Where from?<input value={provider} onChange={(event) => setProvider(event.target.value)} maxLength={80} required /></label>
      <label>A link, if there is one (optional)<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" /></label>
      <button type="submit" className="kb-primary" disabled={busy}>{busy ? "Sending…" : "Send for review"}</button>
      {message ? <p className={message.ok ? "kb-ok" : "kb-error"} role="status">{message.text}</p> : null}
    </form>
  );
}
