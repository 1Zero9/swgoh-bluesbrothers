"use client";

import { useState, type FormEvent } from "react";
import AnnouncementPopup from "@/app/announcement-popup";
import type { Announcement } from "@/lib/announcement";

type Field = "label" | "title" | "text" | "cta" | "href" | "quote";

export default function AnnouncementEditor({ initial }: { initial: Announcement }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState({ ...initial, seconds: String(initial.seconds) });
  const [state, setState] = useState<{ kind: "idle" | "saving" | "ok" | "error"; message?: string }>({ kind: "idle" });

  const set = (field: Field) => (event: { target: { value: string } }) => setDraft((previous) => ({ ...previous, [field]: event.target.value }));
  const seconds = Number(draft.seconds);
  const preview: Announcement = { ...draft, seconds: Number.isFinite(seconds) ? seconds : 20, enabled: true };
  const changed = JSON.stringify({ ...saved, seconds: String(saved.seconds) }) !== JSON.stringify(draft);

  async function save(event: FormEvent) {
    event.preventDefault();
    setState({ kind: "saving" });
    try {
      const response = await fetch("/api/announcement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, seconds }) });
      const data = (await response.json()) as { ok: boolean; error?: string; announcement?: Announcement };
      if (!data.ok || !data.announcement) { setState({ kind: "error", message: data.error ?? "That did not save." }); return; }
      setSaved(data.announcement);
      setDraft({ ...data.announcement, seconds: String(data.announcement.seconds) });
      setState({ kind: "ok", message: draft.enabled ? "Saved. Everyone sees it the next time they open Home." : "Saved as a draft. Nobody sees it until you switch it on." });
    } catch {
      setState({ kind: "error", message: "Could not reach the site. Try again." });
    }
  }

  return (
    <div className="hub-ann-editor">
      <header className="hub-heading">
        <p className="hub-eyebrow">Officers</p>
        <h1>Announcement</h1>
        <p className="hub-intro">The card that floats over Home. It stays hidden until you tick “Show the announcement” and save. Every save shows it again to everyone, once, and it fades away after the time you set.</p>
      </header>
      <div className="hub-ann-grid">
        <form className="hub-card hub-ann-form" onSubmit={save}>
          <label className="hub-ann-switch"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((previous) => ({ ...previous, enabled: event.target.checked }))} /> Show the announcement</label>
          <label>Small label<input value={draft.label} onChange={set("label")} maxLength={40} /></label>
          <label>Headline<input value={draft.title} onChange={set("title")} maxLength={90} required /></label>
          <label>Message<textarea value={draft.text} onChange={set("text")} maxLength={300} rows={3} /></label>
          <div className="hub-ann-row">
            <label>Button words<input value={draft.cta} onChange={set("cta")} maxLength={24} required /></label>
            <label>Button goes to<input value={draft.href} onChange={set("href")} maxLength={300} required placeholder="/chat or https://…" /></label>
          </div>
          <label>A quote (optional)<input value={draft.quote} onChange={set("quote")} maxLength={160} /></label>
          <label>Seconds on screen<input type="number" min={5} max={120} value={draft.seconds} onChange={set("seconds" as Field)} /></label>
          <div className="hub-ann-actions">
            <button type="submit" className="hub-button" disabled={state.kind === "saving" || !changed}>{state.kind === "saving" ? "Saving…" : "Save and show to everyone"}</button>
            {state.kind === "ok" || state.kind === "error" ? <p role="status" className={state.kind === "error" ? "hub-ann-error" : "hub-ann-ok"}>{state.message}</p> : null}
          </div>
        </form>
        <div className="hub-ann-preview">
          <p className="hub-eyebrow">Preview</p>
          <AnnouncementPopup announcement={preview} preview />
        </div>
      </div>
    </div>
  );
}
