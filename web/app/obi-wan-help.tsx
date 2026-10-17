"use client";

import { useState, type FormEvent } from "react";
import { LifeBuoy, X } from "lucide-react";
import { PROBLEMS, type Problem } from "@/lib/signin-help";

/** "Help me, Obi-Wan, you're my only hope": a sign-in rescue for someone who can't get in. It tells the officers, who send a personal link. */
export default function ObiWanHelp({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [problem, setProblem] = useState<Problem>("white");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "sending" | "sent" | "error"; message?: string }>({ kind: "idle" });

  async function send(event: FormEvent) {
    event.preventDefault();
    setState({ kind: "sending" });
    const response = await fetch("/api/signin-help", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, contact, problem, note, website }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setState(data?.ok ? { kind: "sent" } : { kind: "error", message: data?.error ?? "That didn't send. Please try again, or message an officer in the Discord." });
  }

  return (
    <>
      <button type="button" className={`obi-btn ${className}`} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <LifeBuoy size={18} aria-hidden="true" />
        <span><strong>Help me, Obi-Wan</strong><small>You&apos;re my only hope to get logged in</small></span>
      </button>
      {open ? (
        <div className="whos-scrim" onClick={() => setOpen(false)}>
          <div className="whos-sheet obi-sheet" role="dialog" aria-label="Help me, Obi-Wan" onClick={(event) => event.stopPropagation()}>
            <header>
              <strong>Help me, Obi-Wan</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={18} aria-hidden="true" /></button>
            </header>
            {state.kind === "sent" ? (
              <div className="obi-done" role="status">
                <p><strong>Message sent. Thank you.</strong></p>
                <p>An officer will send you a personal sign-in link, usually the same day. Keep an eye on Discord. You don&apos;t need to do anything else.</p>
                <button type="button" className="obi-btn is-small" onClick={() => setOpen(false)}>Close</button>
              </div>
            ) : (
              <form onSubmit={send} className="obi-form">
                <p className="whos-note">Tell us who you are and we&apos;ll send you your own sign-in link. It only takes a moment.</p>
                <label>Your in-game name
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="off" required />
                </label>
                <label>How can we reach you? <small>(your Discord name is perfect, optional)</small>
                  <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={80} autoComplete="off" />
                </label>
                <fieldset>
                  <legend>What is happening?</legend>
                  {(Object.keys(PROBLEMS) as Problem[]).map((key) => (
                    <label key={key} className="obi-radio"><input type="radio" name="problem" checked={problem === key} onChange={() => setProblem(key)} /> {PROBLEMS[key]}</label>
                  ))}
                </fieldset>
                <label>Anything else? <small>(optional, e.g. iPad, iPhone, computer)</small>
                  <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} autoComplete="off" />
                </label>
                <input className="obi-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
                {state.kind === "error" ? <p role="alert" className="obi-error">{state.message}</p> : null}
                <button type="submit" className="obi-btn is-solid" disabled={state.kind === "sending"}>{state.kind === "sending" ? "Sending…" : "Send my message"}</button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
