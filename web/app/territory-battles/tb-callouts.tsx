"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CalloutProgress } from "@/lib/tb-callout-match";

export type CalloutCard = {
  id: string;
  headline: string;
  unitName: string;
  needed: number | null;
  note: string | null;
  status: "OPEN" | "CLOSED";
  createdBy: string | null;
  createdLabel: string;
  progress: CalloutProgress;
};

export type CalloutUnit = { id: string; name: string };

export default function TbCallouts({
  callouts,
  units,
  isOfficer,
}: {
  callouts: CalloutCard[];
  units: CalloutUnit[];
  isOfficer: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ unitId: "", minStars: 7, minRelic: 7, needed: "", phase: "", planetName: "", note: "", postToDiscord: true });

  async function send(method: string, body: unknown) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/officer/tb/callouts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; posted?: boolean } | null;
      if (!response.ok || !json?.ok) throw new Error(json?.error || `Request failed (${response.status})`);
      router.refresh();
      return json;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const result = await send("POST", {
      ...form,
      needed: form.needed === "" ? null : Number(form.needed),
      phase: form.phase === "" ? null : Number(form.phase),
    });
    if (result) {
      setMessage(form.postToDiscord ? (result.posted ? "Callout created and posted to Discord." : "Callout created. No Discord webhook is set, so nothing was posted.") : "Callout created.");
      setForm({ ...form, unitId: "", needed: "", note: "" });
    }
  }

  const open = callouts.filter((callout) => callout.status === "OPEN");
  const closed = callouts.filter((callout) => callout.status === "CLOSED");

  return (
    <div className="callouts">
      {open.length ? open.map((callout) => <CalloutItem key={callout.id} callout={callout} isOfficer={isOfficer} busy={busy} send={send} />) : (
        <div className="tw-empty"><strong>No open callouts.</strong><p>When the officers need a unit levelled for a phase, it appears here with who is ready and who is closest.</p></div>
      )}

      {closed.length ? (
        <details className="callout-closed">
          <summary>{closed.length} finished callout{closed.length === 1 ? "" : "s"}</summary>
          {closed.map((callout) => <CalloutItem key={callout.id} callout={callout} isOfficer={isOfficer} busy={busy} send={send} />)}
        </details>
      ) : null}

      {isOfficer ? (
        <form className="callout-form" onSubmit={create}>
          <h3>New callout</h3>
          <label>Unit
            <input list="callout-units" value={units.find((u) => u.id === form.unitId)?.name ?? form.unitId}
              onChange={(e) => setForm({ ...form, unitId: units.find((u) => u.name === e.target.value)?.id ?? "" })}
              placeholder="Start typing a unit name" required />
            <datalist id="callout-units">{units.map((unit) => <option key={unit.id} value={unit.name} />)}</datalist>
          </label>
          <div className="callout-form-row">
            <label>Min stars<input type="number" min={1} max={7} value={form.minStars} onChange={(e) => setForm({ ...form, minStars: Number(e.target.value) })} /></label>
            <label>Min relic<input type="number" min={0} max={9} value={form.minRelic} onChange={(e) => setForm({ ...form, minRelic: Number(e.target.value) })} /></label>
            <label>How many needed<input type="number" min={1} max={50} value={form.needed} onChange={(e) => setForm({ ...form, needed: e.target.value })} placeholder="optional" /></label>
            <label>Phase<input type="number" min={1} max={6} value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} placeholder="optional" /></label>
          </div>
          <label>Planet / zone<input value={form.planetName} onChange={(e) => setForm({ ...form, planetName: e.target.value })} placeholder="optional, e.g. Zeffo" /></label>
          <label>Why we need it<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} placeholder="One line the guild will read" /></label>
          <label className="callout-check"><input type="checkbox" checked={form.postToDiscord} onChange={(e) => setForm({ ...form, postToDiscord: e.target.checked })} /> Post to Discord</label>
          <button type="submit" disabled={busy || !form.unitId}>Create callout</button>
          {message ? <p className="callout-message">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

function CalloutItem({
  callout,
  isOfficer,
  busy,
  send,
}: {
  callout: CalloutCard;
  isOfficer: boolean;
  busy: boolean;
  send: (method: string, body: unknown) => Promise<unknown>;
}) {
  const { progress } = callout;
  const percent = callout.needed ? Math.min(100, Math.round((progress.readyCount / callout.needed) * 100)) : null;

  return (
    <article className={`callout-card${callout.status === "CLOSED" ? " is-closed" : ""}${progress.complete ? " is-complete" : ""}`}>
      <header>
        <div>
          <h3>{callout.headline}</h3>
          <small>Called by {callout.createdBy ?? "an officer"} · {callout.createdLabel}</small>
        </div>
        <strong className="callout-count">{progress.readyCount}{callout.needed ? <span>/{callout.needed}</span> : null}<small>ready</small></strong>
      </header>
      {percent !== null ? <div className="callout-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div> : null}
      {callout.note ? <p className="callout-note">{callout.note}</p> : null}
      {progress.complete ? <p className="callout-done">Target reached — nicely done, Brothers.</p> : null}

      {progress.ready.length ? (
        <p className="callout-line"><span>Ready</span>{progress.ready.map((m) => `${m.name}${m.relic ? ` (R${m.relic})` : ""}`).join(", ")}</p>
      ) : null}
      {progress.close.length ? (
        <div className="callout-close">
          <span>Closest to ready</span>
          <ul>{progress.close.slice(0, 8).map((m) => <li key={m.name}><strong>{m.name}</strong> <em>{m.gap}</em></li>)}</ul>
        </div>
      ) : null}
      <p className="callout-foot">
        {progress.missing.length} don&apos;t have {callout.unitName} yet
        {progress.unsynced.length ? ` · ${progress.unsynced.length} roster${progress.unsynced.length === 1 ? "" : "s"} not synced yet` : ""}
      </p>

      {isOfficer ? (
        <div className="callout-actions">
          <button type="button" disabled={busy} onClick={() => send("PATCH", { id: callout.id, status: callout.status === "OPEN" ? "CLOSED" : "OPEN" })}>
            {callout.status === "OPEN" ? "Mark finished" : "Reopen"}
          </button>
          <button type="button" disabled={busy} onClick={() => { if (confirm("Delete this callout?")) send("DELETE", { id: callout.id }); }}>Delete</button>
        </div>
      ) : null}
    </article>
  );
}
