"use client";

import { useEffect, useState } from "react";

/** Brings the older "Saved squads" into the review queue as candidates. Hidden when there is nothing left to bring in. */
export default function ImportSavedButton() {
  const [waiting, setWaiting] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/knowledge/import-saved", { cache: "no-store" }).then((r) => r.json()).then((d: { waiting?: number }) => setWaiting(d.waiting ?? 0)).catch(() => setWaiting(0));
  }, []);

  async function run() {
    setBusy(true); setMessage(null);
    const response = await fetch("/api/knowledge/import-saved", { method: "POST" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; imported?: number; skipped?: number; error?: string } | null;
    setBusy(false);
    if (data?.ok) { setMessage(`Brought in ${data.imported} for review${data.skipped ? `, skipped ${data.skipped}` : ""}. Reload to see them.`); setWaiting(0); }
    else setMessage(data?.error ?? "That did not work. Try again.");
  }

  if (!waiting && !message) return null;
  return (
    <div className="kb-notice" role="status">
      <span>{message ?? `${waiting} saved squad${waiting === 1 ? "" : "s"} from the old Saved squads list can be brought in for review. Mode is marked for you to confirm.`}</span>
      {!message ? <button type="button" className="kb-secondary" onClick={() => void run()} disabled={busy}>{busy ? "Bringing in…" : "Bring them in"}</button> : null}
    </div>
  );
}
