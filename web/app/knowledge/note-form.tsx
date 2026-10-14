"use client";

import { useState } from "react";
import { BODY_MAX, HOW_KNOWN_MAX, NOTE_KIND_LABELS, NOTE_TOPICS, TITLE_MAX, type NoteKind } from "@/lib/knowledge/notes";

const HINTS: Record<NoteKind, { title: string; body: string }> = {
  TIP: { title: "e.g. Spend raid tickets at reset", body: "What should someone do, and why does it work?" },
  IDEA: { title: "e.g. Plan Territory War defence on Thursday", body: "What would you change or try, and what would it fix?" },
};

/** Add a tip or an idea. It goes to an officer to check before anyone else sees it. */
export default function NoteForm({ kind, onDone }: { kind: NoteKind; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [howKnown, setHowKnown] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/knowledge/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, title, body, topic: topic || null, howKnown }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    if (data?.ok) {
      setMessage({ ok: true, text: "Thanks. An officer will check it, then it shows for everyone." });
      setTitle(""); setBody(""); setTopic(""); setHowKnown("");
      onDone();
    } else setMessage({ ok: false, text: data?.error ?? "That didn't go through. Try again." });
  }

  return (
    <form className="hub-form" onSubmit={submit}>
      <label>Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={TITLE_MAX} placeholder={HINTS[kind].title} required />
      </label>
      <label>{NOTE_KIND_LABELS[kind]}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={BODY_MAX} rows={5} placeholder={HINTS[kind].body} required />
      </label>
      <label>Where does it apply? (optional)
        <select value={topic} onChange={(event) => setTopic(event.target.value)}>
          <option value="">Not sure</option>
          {NOTE_TOPICS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label>How do you know? (optional)
        <input value={howKnown} onChange={(event) => setHowKnown(event.target.value)} maxLength={HOW_KNOWN_MAX} placeholder="I do this every week / saw it in a video" />
      </label>
      <button type="submit" className="hub-button" disabled={busy}>{busy ? "Sending…" : "Send for checking"}</button>
      {message ? <p className={message.ok ? "hub-ok" : "hub-error"} role="status">{message.text}</p> : null}
    </form>
  );
}
