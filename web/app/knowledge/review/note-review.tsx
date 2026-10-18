"use client";

import { useCallback, useEffect, useState } from "react";
import { NOTE_KIND_LABELS, type NoteKind } from "@/lib/knowledge/notes";
import type { NoteItem } from "../note-list";

/** Tips and ideas waiting for an officer's check. Publish what is useful and true, reject what is not. */
export default function NoteReview({ onChanged }: { onChanged?: () => void }) {
  const [queue, setQueue] = useState<NoteItem[] | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const response = await fetch("/api/knowledge/notes/review", { cache: "no-store" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { queue?: NoteItem[]; error?: string } | null;
    if (data?.queue) setQueue(data.queue); else setError(data?.error ?? "Couldn't load tips and ideas.");
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const starterCount = (queue ?? []).filter((note) => note.authorName === "Starter list").length;
  async function publishStarter() {
    if (!window.confirm(`Publish all ${starterCount} starter tips? Members will see them straight away. They are marked "not yet checked in game". (Tips members wrote stay here for you to check one by one.)`)) return;
    setError("");
    const response = await fetch("/api/knowledge/notes/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "PUBLISH_STARTER" }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; published?: number; error?: string } | null;
    if (data?.ok) { setDone(`Published ${data.published} starter tips.`); void load(); onChanged?.(); } else setError(data?.error ?? "That didn't go through.");
  }

  async function act(id: string, action: "PUBLISH" | "REJECT") {
    setError("");
    const response = await fetch("/api/knowledge/notes/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, note: reasons[id] }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (data?.ok) { void load(); onChanged?.(); } else setError(data?.error ?? "That didn't go through.");
  }

  if (queue === null && !error) return null;
  return (
    <section className="kb-panel" aria-label="Tips and ideas to check">
      <h3>Tips and ideas to check{queue ? ` (${queue.length})` : ""}</h3>
      {error ? <p className="kb-error" role="alert">{error}</p> : null}
      {done ? <p className="kb-ok" role="status">{done}</p> : null}
      {starterCount > 1 ? <p><button type="button" className="kb-secondary" onClick={() => void publishStarter()}>Publish all {starterCount} starter tips</button></p> : null}
      {queue && queue.length === 0 ? <p className="kb-meta">Nothing waiting.</p> : null}
      {queue?.map((note) => (
        <article key={note.id} className="kb-card">
          <header>
            <span className="kb-badge kb-badge-mode">{NOTE_KIND_LABELS[note.kind as NoteKind] ?? note.kind}</span>
            {note.topic ? <span className="kb-badge">{note.topic}</span> : null}
            <span className="kb-meta">from {note.authorName}</span>
          </header>
          <strong>{note.title}</strong>
          <p className="kb-strategy" style={{ whiteSpace: "pre-wrap" }}>{note.body}</p>
          {note.howKnown ? <p className="kb-meta">How they know: {note.howKnown}</p> : null}
          <footer>
            <input className="kb-note" placeholder="Reason (optional)" value={reasons[note.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [note.id]: event.target.value }))} maxLength={300} aria-label="Reason" />
            <button type="button" className="kb-primary" onClick={() => void act(note.id, "PUBLISH")}>Publish</button>
            <button type="button" className="kb-secondary" onClick={() => void act(note.id, "REJECT")}>Reject</button>
          </footer>
        </article>
      ))}
    </section>
  );
}
