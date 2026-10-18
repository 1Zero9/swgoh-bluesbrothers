"use client";

import { useEffect, useState } from "react";

/** Brings the 50-squad starter list in as tips waiting for review. Hidden once they are all in. */
export default function ImportStarterButton({ onDone }: { onDone?: () => void }) {
  const [waiting, setWaiting] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/knowledge/import-starter", { cache: "no-store" }).then((r) => r.json()).then((d: { waiting?: number }) => setWaiting(d.waiting ?? 0)).catch(() => setWaiting(0));
  }, []);

  async function run() {
    setBusy(true); setMessage(null);
    const response = await fetch("/api/knowledge/import-starter", { method: "POST" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; imported?: number; error?: string } | null;
    setBusy(false);
    if (data?.ok) { setMessage(`Brought in ${data.imported} tips. Check them in the tips list below and publish the ones you trust.`); setWaiting(0); onDone?.(); }
    else setMessage(data?.error ?? "That did not work. Try again.");
  }

  if (!waiting && !message) return null;
  return (
    <div className="kb-notice" role="status">
      <span>{message ?? `A starter list of ${waiting} popular enemy squads (the usual line-up and the counters people mention) can be brought in as tips. It was written without sources, so nothing is public until you check and publish each one.`}</span>
      {!message ? <button type="button" className="kb-secondary" onClick={() => void run()} disabled={busy}>{busy ? "Bringing in…" : "Bring them in"}</button> : null}
    </div>
  );
}
