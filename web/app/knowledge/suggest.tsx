"use client";

import { useState, type FormEvent } from "react";
import UnitPicker, { type PickedUnit } from "@/app/unit-picker";
import SubmitForm from "./submit-form";
import type { Listing } from "./match-card";
import type { KbMode } from "@/lib/knowledge/modes";

/**
 * Under a published counter: "Swap a unit" (use Y instead of X) and "I have a better counter". Both go to an officer as a new candidate
 * that points back at this counter; the existing one stays as it is until an officer decides.
 */
export default function SuggestImprovement({ item, names }: { item: Listing; names: Record<string, string> }) {
  const [panel, setPanel] = useState<"none" | "swap" | "better">("none");
  const [replace, setReplace] = useState(item.attacker.members[1]?.unitId ?? item.attacker.members[0]?.unitId ?? "");
  const [by, setBy] = useState<PickedUnit | null>(null);
  const [why, setWhy] = useState("");
  const [tried, setTried] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const label = (id: string) => names[id] ?? id;

  async function sendSwap(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!by) { setMessage({ ok: false, text: "Pick the unit you would use instead." }); return; }
    if (item.attacker.members.some((member) => member.unitId === by.id)) { setMessage({ ok: false, text: `${by.name} is already in this squad.` }); return; }
    setBusy(true);
    setMessage(null);
    const swapped = item.attacker.members.map((member, index) => ({ unitId: member.unitId === replace ? by.id : member.unitId, role: index === 0 ? "LEADER" : "CORE" }));
    const note = `Swap ${label(replace)} for ${by.name}${why.trim() ? `: ${why.trim()}` : "."} (A variation on an existing counter.)`;
    const response = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: item.mode as KbMode, defender: { members: item.defender.members.map((member, index) => ({ unitId: member.unitId, role: index === 0 ? "LEADER" : "CORE" })) }, attacker: { members: swapped },
        strategy: [item.strategy, note].filter(Boolean).join("\n\n"),
        evidence: [{ type: tried ? "COMMUNITY_REPORT" : "THEORY", sourceProvider: tried ? "A guild member who tried it" : "A guild member's idea", observedAt: new Date().toISOString() }],
        improves: item.id, suggestion: "SWAP",
      }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string; created?: boolean } | null;
    setBusy(false);
    setMessage(data?.ok ? { ok: true, text: data.created === false ? "That squad is already in the list, so your note was added to it. Thank you." : "Thanks! An officer will look at your swap before it goes live." } : { ok: false, text: data?.error ?? "That didn't go through. Try again." });
  }

  return (
    <div className="kb-suggest">
      <div className="kb-suggest-buttons">
        <button type="button" className="kb-secondary" aria-expanded={panel === "swap"} onClick={() => { setPanel(panel === "swap" ? "none" : "swap"); setMessage(null); }}>Swap a unit</button>
        <button type="button" className="kb-secondary" aria-expanded={panel === "better"} onClick={() => { setPanel(panel === "better" ? "none" : "better"); setMessage(null); }}>I have a better counter</button>
      </div>
      {panel === "swap" ? (
        <form className="kb-form kb-suggest-panel" onSubmit={sendSwap}>
          <p className="kb-suggest-note">Use a different unit in this squad. An officer checks it before anyone else sees it.</p>
          <label>Take out
            <select value={replace} onChange={(event) => setReplace(event.target.value)}>
              {item.attacker.members.map((member) => <option key={member.unitId} value={member.unitId}>{label(member.unitId)}</option>)}
            </select>
          </label>
          <label>Put in<UnitPicker label="Unit to put in" placeholder="e.g. Hermit Yoda" onPick={setBy} onClear={() => setBy(null)} /></label>
          <label>Why is it better? <small>(optional)</small><input value={why} onChange={(event) => setWhy(event.target.value)} maxLength={300} placeholder="e.g. keeps their taunter alive longer" /></label>
          <div className="hub-segment" role="group" aria-label="How do you know?">
            <button type="button" aria-pressed={tried} onClick={() => setTried(true)}>I tried it</button>
            <button type="button" aria-pressed={!tried} onClick={() => setTried(false)}>Just an idea</button>
          </div>
          <button type="submit" className="kb-primary" disabled={busy}>{busy ? "Sending…" : "Suggest this swap"}</button>
        </form>
      ) : null}
      {panel === "better" ? (
        <div className="kb-panel kb-suggest-panel">
          <h3>A better counter for {label(item.defender.members[0]?.unitId ?? "")}</h3>
          <SubmitForm key={item.id} prefill={{ mode: item.mode as KbMode, leader: { id: item.defender.members[0]?.unitId ?? "", name: label(item.defender.members[0]?.unitId ?? "") } }} improves={item.id} onDone={() => setMessage({ ok: true, text: "Thanks! An officer will compare it with this one." })} />
        </div>
      ) : null}
      {message ? <p className={message.ok ? "kb-ok" : "kb-error"} role="status">{message.text}</p> : null}
    </div>
  );
}
