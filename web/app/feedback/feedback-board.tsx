"use client";

import { useState, type FormEvent } from "react";
import { Check, ThumbsUp, Trash2 } from "lucide-react";
import { KIND_LABELS, KINDS, STATUS_LABELS, STATUSES, sortItems, type FeedbackKind, type FeedbackStatus } from "@/lib/feedback";
import type { FeedbackListing } from "@/lib/feedback-data";

type Filter = "todo" | "done" | "all";
const day = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const isTodo = (status: string) => status === "OPEN" || status === "PLANNED" || status === "IN_PROGRESS";

export default function FeedbackBoard({ initial, isOfficer, canPost }: { initial: FeedbackListing[]; isOfficer: boolean; canPost: boolean }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("todo");
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("FEATURE");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function reload() {
    const response = await fetch("/api/feedback", { cache: "no-store" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { items?: FeedbackListing[] } | null;
    if (data?.items) setItems(data.items);
  }

  async function call(method: "POST" | "DELETE", payload: unknown): Promise<{ ok?: boolean; error?: string; votes?: number } | null> {
    const response = await fetch("/api/feedback", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => null);
    return (await response?.json().catch(() => null)) as { ok?: boolean; error?: string; votes?: number } | null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const data = await call("POST", { kind, title, body });
    if (data?.ok) {
      setTitle(""); setBody(""); setAdding(false); setFilter("todo");
      setMessage({ ok: true, text: "Thanks. It is on the list for everyone to see." });
      await reload();
    } else setMessage({ ok: false, text: data?.error ?? "That did not go through. Try again." });
  }

  async function vote(item: FeedbackListing) {
    const next = !item.votedByMe;
    setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, votedByMe: next, votes: entry.votes + (next ? 1 : -1) } : entry)));
    const data = await call("POST", { id: item.id, vote: next });
    if (data?.ok && typeof data.votes === "number") setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, votes: data.votes as number } : entry)));
    else await reload();
  }

  async function officerUpdate(id: string, update: { status?: FeedbackStatus; reply?: string }) {
    const data = await call("POST", { id, ...update });
    if (!data?.ok) setMessage({ ok: false, text: data?.error ?? "That did not save." });
    await reload();
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this item for everyone?")) return;
    const data = await call("DELETE", { id });
    if (!data?.ok) setMessage({ ok: false, text: data?.error ?? "That did not go through." });
    await reload();
  }

  const counts = { todo: items.filter((item) => isTodo(item.status)).length, done: items.filter((item) => item.status === "DONE").length, all: items.length };
  const shown = sortItems(items.map((item) => ({ ...item }))).filter((item) => (filter === "all" ? true : filter === "done" ? item.status === "DONE" || item.status === "DECLINED" : isTodo(item.status)));

  return (
    <div className="hub-knowledge fb">
      <div className="hub-kbar">
        <div className="hub-segment" role="group" aria-label="Which items">
          <button type="button" aria-pressed={filter === "todo"} onClick={() => setFilter("todo")}>To do · {counts.todo}</button>
          <button type="button" aria-pressed={filter === "done"} onClick={() => setFilter("done")}>Done · {counts.done}</button>
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All · {counts.all}</button>
        </div>
        {canPost ? <button type="button" className="hub-button hub-add" onClick={() => setAdding((value) => !value)}>{adding ? "Close" : "+ Add a request"}</button> : null}
      </div>

      {message ? <p className={`kb-notice${message.ok ? "" : " is-bad"}`} role="status">{message.text}<button type="button" onClick={() => setMessage(null)} aria-label="Dismiss">×</button></p> : null}

      {adding ? (
        <form className="kb-form kb-panel fb-form" onSubmit={submit}>
          <h3>What do you want?</h3>
          <div className="hub-segment" role="group" aria-label="What kind">
            {KINDS.map((value) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>{KIND_LABELS[value]}</button>)}
          </div>
          <label>Short title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="e.g. Show my ticket count on the home page" required /></label>
          <label>Tell us more<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={1500} rows={4} placeholder="What should it do, and why would it help the guild?" required /></label>
          <button type="submit" className="kb-primary">Post it</button>
        </form>
      ) : null}

      <ul className="fb-list">
        {shown.length === 0 ? <li className="kb-empty"><strong>{filter === "done" ? "Nothing finished yet." : "Nothing on the list."}</strong><p>{canPost ? "Add the first request with the orange button." : "Check back soon."}</p></li> : null}
        {shown.map((item) => (
          <li key={item.id} className={`fb-item is-${item.status.toLowerCase()}`}>
            <div className="fb-tick" aria-hidden="true">{item.status === "DONE" ? <Check size={16} /> : null}</div>
            <div className="fb-main">
              <div className="fb-top">
                <span className={`kb-badge fb-kind is-${item.kind.toLowerCase()}`}>{KIND_LABELS[item.kind as FeedbackKind] ?? item.kind}</span>
                <span className={`fb-status is-${item.status.toLowerCase()}`}>{STATUS_LABELS[item.status as FeedbackStatus] ?? item.status}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="fb-body">{item.body}</p>
              {item.reply ? <p className="fb-reply"><strong>From the officers:</strong> {item.reply}</p> : null}
              <p className="fb-meta">{item.mine ? "You" : item.submittedByName} · {day(item.createdAt)}{item.status === "DONE" && item.doneAt ? ` · done ${day(item.doneAt)}` : ""}</p>
              {isOfficer ? (
                <div className="fb-officer">
                  <label>Status
                    <select value={item.status} onChange={(event) => void officerUpdate(item.id, { status: event.target.value as FeedbackStatus })}>
                      {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                    </select>
                  </label>
                  <ReplyBox key={`${item.id}:${item.reply ?? ""}`} initial={item.reply ?? ""} onSave={(reply) => void officerUpdate(item.id, { reply })} />
                  <button type="button" className="fb-delete" onClick={() => void remove(item.id)} aria-label={`Remove ${item.title}`}><Trash2 size={14} aria-hidden="true" /> Remove</button>
                </div>
              ) : item.mine && item.status === "OPEN" ? <div className="fb-officer"><button type="button" className="fb-delete" onClick={() => void remove(item.id)}><Trash2 size={14} aria-hidden="true" /> Take mine back</button></div> : null}
            </div>
            <button type="button" className={`fb-vote${item.votedByMe ? " is-on" : ""}`} aria-pressed={item.votedByMe} onClick={() => void vote(item)} disabled={!canPost} title={canPost ? "I want this too" : "Link your account to vote"}>
              <ThumbsUp size={16} aria-hidden="true" /><strong>{item.votes}</strong><small>+1</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReplyBox({ initial, onSave }: { initial: string; onSave: (reply: string) => void }) {
  const [text, setText] = useState(initial);
  return (
    <label className="fb-reply-edit">Note to the guild
      <span><input value={text} onChange={(event) => setText(event.target.value)} maxLength={500} placeholder="e.g. Shipped in 1.3, try it" />
        <button type="button" disabled={text.trim() === initial.trim()} onClick={() => onSave(text)}>Save note</button></span>
    </label>
  );
}
