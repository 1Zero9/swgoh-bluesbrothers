"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

const ago = (value: string, now: number) => { const m = (now - new Date(value).getTime()) / 60_000; return m < 2 ? "just now" : m < 90 ? `${Math.round(m)}m ago` : m < 2880 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };

/** When this card was worked out, and a button to work it out again from live data. */
export default function RefreshCard({ id, capturedAt, fromCache }: { id: string; capturedAt: string; fromCache: boolean }) {
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  async function refresh() {
    setBusy(true);
    await fetch("/api/officer/member-cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    window.location.reload();
  }
  return (
    <span className="mc-refresh-wrap">
      <span className="mc-updated">{fromCache ? "Saved" : "Worked out"} {ago(capturedAt, now)}</span>
      <button type="button" className="mc-refresh" onClick={() => void refresh()} disabled={busy}><RefreshCw size={14} aria-hidden="true" className={busy ? "is-spinning" : undefined} /> {busy ? "Refreshing…" : "Refresh"}</button>
    </span>
  );
}
