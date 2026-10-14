"use client";

import Image from "next/image";
import BlueText from "./blue-text";
import NavIcon from "./nav-icon";
import { useRef, useState } from "react";

type Source = { title: string; url: string; host: string };
type Turn = { role: "user" | "assistant"; content: string; sources?: Source[]; searchDown?: boolean; searchError?: string };

const SUGGESTIONS = [
  { icon: "sprout", text: "What should I farm next?" },
  { icon: "roster", text: "What team should I finish?" },
  { icon: "help", text: "How can I help the band?" },
];

/** Talk to B-Lue3. The conversation lives only in this page; the server keeps nothing but a daily count. */
type Usage = { limit: number; used: number; left: number; resetsOn: string };

const resetLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });

export default function BlueChat({ usage, webSearch, isOfficer, rawLimit }: { usage: Usage; webSearch: boolean; isOfficer: boolean; rawLimit: string | null }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [left, setLeft] = useState<number>(usage.left);
  const [used, setUsed] = useState<number>(usage.used);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const content = question.trim();
    if (!content || busy || left <= 0) return;
    const next: Turn[] = [...turns, { role: "user", content }];
    setTurns(next);
    setText("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/blue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; answer?: string; sources?: Source[]; left?: number; error?: string; detail?: string; webSearch?: string; searchError?: string } | null;
      if (data?.ok && data.answer) {
        setTurns([...next, { role: "assistant", content: data.answer, sources: data.sources, searchDown: data.webSearch === "unavailable", searchError: data.searchError }]);
        setLeft(data.left ?? left);
        setUsed(usage.limit - (data.left ?? left));
      } else {
        if (response?.status === 429) setLeft(0);
        setError(`${data?.error ?? "B-Lue3 lost the signal. Try again."}${data?.detail ? ` [${data.detail}]` : ""}`);
      }
    } catch {
      setError("B-Lue3 lost the signal. Try again.");
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }

  async function resetCount() {
    const response = await fetch("/api/blue/reset", { method: "POST" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; usage?: Usage } | null;
    if (data?.ok && data.usage) { setLeft(data.usage.left); setUsed(data.usage.used); setError(""); }
  }

  const noneLeft = left <= 0;
  return (
    <div className="blue-chat">
      <div className="blue-status" role="status">
        {usage.limit <= 12 ? (
          <span className="blue-pips" aria-hidden="true">{Array.from({ length: usage.limit }, (_, i) => <i key={i} className={i < left ? "on" : ""} />)}</span>
        ) : null}
        <span>{noneLeft ? `No questions left this week. Back on ${resetLabel(usage.resetsOn)}.` : `${left} of ${usage.limit} question${usage.limit === 1 ? "" : "s"} left this week · resets ${resetLabel(usage.resetsOn)}`}</span>
        <span className={`blue-ws ${webSearch ? "is-on" : "is-off"}`}>Web search {webSearch ? "on" : "off"}</span>
      </div>
      {isOfficer ? (
        <p className="blue-officer-line">Officers: limit {usage.limit} (BLUE_WEEKLY_LIMIT is {rawLimit === null ? "not set, so the default of 5 applies" : JSON.stringify(rawLimit)}), used {used}. <button type="button" className="kb-link" onClick={resetCount}>Reset my count</button></p>
      ) : null}
      {turns.length === 0 ? (
        <nav className="blue-question-actions" aria-label="Questions for B-Lue3">
          {SUGGESTIONS.map((question) => (
            <button type="button" key={question.text} onClick={() => send(question.text)} disabled={busy}><NavIcon name={question.icon} size={20} />{question.text}</button>
          ))}
        </nav>
      ) : (
        <div className="blue-thread" aria-live="polite">
          {turns.map((turn, index) => (
            <div key={index} className={`blue-turn blue-turn-${turn.role}`}>
              {turn.role === "assistant" ? <Image src="/blue.png" alt="" width={36} height={36} /> : null}
              <div className="blue-turn-body">
                {turn.role === "assistant" ? <BlueText text={turn.content} /> : <p>{turn.content}</p>}
                {turn.role === "assistant" ? (
                  <>
                    {turn.sources?.length ? (
                      <p className="blue-sources">From the web: {turn.sources.map((source, i) => <span key={source.url}>{i ? " · " : ""}<a href={source.url} target="_blank" rel="noreferrer noopener">{source.title}</a></span>)}</p>
                    ) : null}
                    {turn.searchDown ? <p className="blue-caveat">I couldn&apos;t search the web just now, so this is only from the guild&apos;s own data. Try again in a few minutes.{turn.searchError ? ` [Officers: ${turn.searchError}]` : ""}</p> : null}
                    <p className="blue-caveat">B-Lue3 can get it wrong. Check in game before you commit a squad.</p>
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {busy ? <div className="blue-turn blue-turn-assistant"><Image src="/blue.png" alt="" width={36} height={36} /><p className="blue-thinking">Checking the roster…</p></div> : null}
          <div ref={endRef} />
        </div>
      )}
      {error ? <p className="blue-error" role="alert">{error}</p> : null}
      <form className="blue-form" onSubmit={(event) => { event.preventDefault(); void send(text); }}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={500}
          placeholder="Ask B-Lue3 anything"
          aria-label="Ask B-Lue3"
          enterKeyHint="send"
          disabled={busy || noneLeft}
        />
        <button type="submit" disabled={busy || noneLeft || !text.trim()}>Ask</button>
      </form>
      <p className="blue-fineprint"><strong>B-Lue3 can sometimes get it wrong.</strong> It looks things up in the guild&apos;s synced data and, for counters, the web. It can&apos;t see mods or farm locations, so check in game before you commit a squad.</p>
    </div>
  );
}
