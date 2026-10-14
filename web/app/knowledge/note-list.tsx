"use client";

import { useCallback, useEffect, useState } from "react";
import { NOTE_KIND_LABELS, type NoteKind } from "@/lib/knowledge/notes";

export type NoteItem = {
  id: string; kind: string; title: string; body: string; topic: string | null; howKnown: string | null; status: string;
  authorName: string; createdAt: string; helpfulCount: number; helpedByMe: boolean; mine: boolean;
};

/** Published tips or ideas, with a search box and a "this helped" mark. */
export default function NoteList({ kind, reloadKey, canAct, onAdd }: { kind: NoteKind; reloadKey: number; canAct: boolean; onAdd: () => void }) {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<NoteItem[] | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ kind });
    if (text.trim()) params.set("q", text.trim());
    const response = await fetch(`/api/knowledge/notes?${params}`, { cache: "no-store" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { notes?: NoteItem[] } | null;
    setNotes(data?.notes ?? []);
  }, [kind, text]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 250);
    return () => clearTimeout(timer);
  }, [load, reloadKey]);

  async function toggle(note: NoteItem) {
    const response = await fetch("/api/knowledge/notes/helpful", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ noteId: note.id, helpful: !note.helpedByMe }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; count?: number } | null;
    if (data?.ok) setNotes((current) => current?.map((item) => (item.id === note.id ? { ...item, helpedByMe: !note.helpedByMe, helpfulCount: data.count ?? item.helpfulCount } : item)) ?? null);
  }

  const label = NOTE_KIND_LABELS[kind].toLowerCase();
  return (
    <div className="hub-notes">
      <input className="hub-search" value={text} onChange={(event) => setText(event.target.value)} placeholder={`Search ${label}s`} aria-label={`Search ${label}s`} />
      {notes === null ? <p className="hub-empty">Loading…</p> : notes.length === 0 ? (
        <div className="hub-empty">
          <strong>{text ? "Nothing here matches yet." : `No ${label}s yet.`}</strong>
          <p>{canAct ? `Be the first. What do you know that would help someone else?` : "Check back soon."}</p>
          {canAct ? <button type="button" className="hub-button" onClick={onAdd}>Add a {label}</button> : null}
        </div>
      ) : notes.map((note) => (
        <article key={note.id} className={`hub-note${note.status === "CANDIDATE" ? " is-waiting" : ""}`}>
          <header>
            <span className={`hub-badge${note.kind === "IDEA" ? " is-paid" : ""}`}>{NOTE_KIND_LABELS[note.kind as NoteKind] ?? note.kind}</span>
            {note.topic ? <span className="hub-badge">{note.topic}</span> : null}
            {note.status === "CANDIDATE" ? <span className="hub-badge">Waiting for an officer</span> : null}
          </header>
          <h3>{note.title}</h3>
          <p>{note.body}</p>
          <footer>
            <small>{note.mine ? "You" : note.authorName} · {new Date(note.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{note.howKnown ? ` · ${note.howKnown}` : ""}</small>
            {canAct && note.status === "PUBLISHED" ? (
              <button type="button" className={`hub-helpful${note.helpedByMe ? " is-on" : ""}`} aria-pressed={note.helpedByMe} onClick={() => void toggle(note)}>
                {note.helpedByMe ? "Helped me" : "This helped"}{note.helpfulCount ? ` · ${note.helpfulCount}` : ""}
              </button>
            ) : note.helpfulCount ? <small>{note.helpfulCount} found this helpful</small> : null}
          </footer>
        </article>
      ))}
    </div>
  );
}
