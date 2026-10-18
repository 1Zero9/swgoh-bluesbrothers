"use client";

import Image from "next/image";
import BlueText from "./blue-text";
import NavIcon from "./nav-icon";
import { useEffect, useRef, useState } from "react";
import { resetLabel } from "@/lib/blue/reset-label";

type Source = { title: string; url: string; host: string };
type Offer = { leaderUnitId: string; leaderName: string; mode: string | null };
type Turn = { role: "user" | "assistant"; content: string; sources?: Source[]; searchDown?: boolean; searchError?: string; route?: "database" | "ai"; needsWebSearch?: boolean; offer?: Offer | null; save?: { state: "saving" | "done" | "error"; text?: string } };

const SUGGESTIONS = [
  { icon: "sprout", text: "What should I farm next?" },
  { icon: "roster", text: "What team should I finish?" },
  { icon: "help", text: "How can I help the band?" },
];

/** Talk to B-Lue3. The conversation lives only in this page; the server keeps nothing but a daily count. */
type Usage = { limit: number; used: number; left: number; resetsOn: string };


export default function BlueChat({ usage, webSearch, isOfficer, rawLimit, initialText = "" }: { usage: Usage; webSearch: boolean; isOfficer: boolean; rawLimit: string | null; initialText?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [left, setLeft] = useState<number>(usage.left);
  const [used, setUsed] = useState<number>(usage.used);
  const endRef = useRef<HTMLDivElement>(null);

  /** Sends a question. The server answers from the guild database first (free); `web: true` asks it to use the AI and web search instead. */
  async function send(question: string, web = false, fresh = false) {
    const content = question.trim();
    if (!content || busy) return;
    // A web search started from the button under an answer reuses that conversation; one started from Find a counter adds the question itself.
    const add = !web || fresh;
    const next: Turn[] = add ? [...turns, { role: "user", content }] : turns;
    if (add) { setTurns(next); setText(""); }
    setError("");
    setSearching(web);
    setBusy(true);
    try {
      // Only plain questions and answers go to the server: it re-reads the last question itself.
      const history = next.map(({ role, content: body }) => ({ role, content: body }));
      const lastUser = history.map((turn) => turn.role).lastIndexOf("user");
      const response = await fetch("/api/blue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(0, lastUser + 1), webSearch: web }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; answer?: string; sources?: Source[]; left?: number; error?: string; detail?: string; webSearch?: string; searchError?: string; route?: "database" | "ai"; needsWebSearch?: boolean; offer?: Offer | null } | null;
      if (data?.ok && data.answer) {
        setTurns([...(add ? next : turns.map((turn) => ({ ...turn, needsWebSearch: false }))), { role: "assistant", content: data.answer, sources: data.sources, searchDown: data.webSearch === "unavailable", searchError: data.searchError, route: data.route, needsWebSearch: data.needsWebSearch, offer: data.offer }]);
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
      setSearching(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }

  /** Keep a web answer: B-Lue3's answer becomes candidate counters (with their sources) for an officer to check. */
  async function saveAnswer(index: number) {
    const turn = turns[index];
    const question = turns[index - 1]?.content ?? "";
    setTurns((current) => current.map((item, i) => (i === index ? { ...item, save: { state: "saving" } } : item)));
    const response = await fetch("/api/blue/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, answer: turn.content, sources: turn.sources ?? [] }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string; report?: { filed: unknown[]; rejected: { what: string; reason: string }[] } } | null;
    let result: Turn["save"];
    if (data?.ok && data.report) {
      const filed = data.report.filed.length;
      const aside = data.report.rejected.length;
      result = { state: filed ? "done" : "error", text: filed ? `Saved ${filed} counter${filed === 1 ? "" : "s"} for an officer to check${aside ? ` (${aside} set aside: ${data.report.rejected[0].reason})` : ""}. Thank you.` : `Nothing could be saved from that answer${aside ? `: ${data.report.rejected[0].reason}` : ""}.` };
    } else result = { state: "error", text: data?.error ?? "That didn't save. Try again." };
    setTurns((current) => current.map((item, i) => (i === index ? { ...item, save: result } : item)));
  }

  async function resetCount() {
    const response = await fetch("/api/blue/reset", { method: "POST" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; usage?: Usage } | null;
    if (data?.ok && data.usage) { setLeft(data.usage.left); setUsed(data.usage.used); setError(""); }
  }

  // "Search the web" in Find a counter starts the search here directly, so there is no empty box to fill in and no second button to press.
  const sendRef = useRef(send);
  useEffect(() => { sendRef.current = send; });
  useEffect(() => {
    const onWeb = (event: Event) => {
      const question = (event as CustomEvent<{ question: string }>).detail?.question;
      if (question) void sendRef.current(question, true, true);
    };
    window.addEventListener("bb-ask-web", onWeb);
    return () => window.removeEventListener("bb-ask-web", onWeb);
  }, []);

  const noneLeft = left <= 0; // AI questions only: counter and "who has" questions are answered from the database and stay free
  return (
    <div className="blue-chat">
      <div className="blue-status" role="status">
        {usage.limit <= 12 ? (
          <span className="blue-pips" aria-hidden="true">{Array.from({ length: usage.limit }, (_, i) => <i key={i} className={i < left ? "on" : ""} />)}</span>
        ) : null}
        <span>{noneLeft ? `No AI questions left this week (back on ${resetLabel(usage.resetsOn)}). Counter and "who has" questions are still free.` : `${left} of ${usage.limit} question${usage.limit === 1 ? "" : "s"} left this week · resets ${resetLabel(usage.resetsOn)}`}</span>
        <span className={`blue-ws ${webSearch ? "is-on" : "is-off"}`}>{webSearch ? "Web search on" : "Web search off"}</span>
      </div>
      {isOfficer ? (
        <details className="blue-officer-details"><summary>Officer info</summary><p className="blue-officer-line">Officers: limit {usage.limit} (BLUE_WEEKLY_LIMIT is {rawLimit === null ? "not set, so the default of 5 applies" : JSON.stringify(rawLimit)}), used {used}. <button type="button" className="kb-link" onClick={resetCount}>Reset my count</button></p></details>
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
                    {turn.route === "ai" && turn.sources?.length && turns[index - 1]?.role === "user" ? (
                      <div className="blue-save">
                        {turn.save?.state === "done" || turn.save?.state === "error" ? <p className={turn.save.state === "done" ? "kb-ok" : "kb-error"} role="status">{turn.save.text}</p> : (
                          <button type="button" className="kb-secondary" disabled={turn.save?.state === "saving"} onClick={() => void saveAnswer(index)}>
                            {turn.save?.state === "saving" ? <><span className="blue-spinner" aria-hidden="true" />Saving…</> : "Add these counters to the guild list"}
                          </button>
                        )}
                        <small>An officer checks them, with their sources, before anyone else sees them.</small>
                      </div>
                    ) : null}
                    {turn.searchDown ? <p className="blue-caveat">I couldn&apos;t search the web just now, so this is only from the guild&apos;s own data. Try again in a few minutes.{turn.searchError ? ` [Officers: ${turn.searchError}]` : ""}</p> : null}
                    {turn.needsWebSearch && turns[index - 1]?.role === "user" ? (
                      <div className="blue-offer">
                        <button type="button" className="kb-primary" disabled={busy || left <= 0} onClick={() => void send(turns[index - 1].content, true)}>
                          {busy && searching ? <><span className="blue-spinner" aria-hidden="true" />Searching the web… up to 30 seconds</> : <><NavIcon name="search" size={18} />Search the web with B-Lue3 · uses 1 question</>}
                        </button>
                        <small className="blue-ai-note">AI web search can be wrong or out of date. Check in game.</small>
                        {turn.offer ? <button type="button" className="kb-secondary" onClick={() => window.dispatchEvent(new CustomEvent("bb-add-counter", { detail: { unitId: turn.offer?.leaderUnitId, name: turn.offer?.leaderName, mode: turn.offer?.mode } }))}>Add one you know to the guild list</button> : null}
                        <a href="/ask?tab=counters" className="kb-link">Ask the guild for help instead</a>
                        {left <= 0 ? <small>No AI questions left this week.</small> : null}
                      </div>
                    ) : null}
                    {turn.route === "ai" ? <p className="blue-caveat blue-ai-note"><strong>AI answer</strong> · used 1 question. It can be wrong or out of date.</p> : null}
                    <p className="blue-caveat">B-Lue3 can get it wrong. Check in game before you commit a squad.</p>
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {busy ? <div className="blue-turn blue-turn-assistant"><Image src="/blue.png" alt="" width={36} height={36} /><p className="blue-thinking" role="status">{searching ? "Searching the web for counters… this can take up to 30 seconds." : "Checking the roster…"}</p></div> : null}
          <div ref={endRef} />
        </div>
      )}
      {error ? <p className="blue-error" role="alert">{error}</p> : null}
      <form className="blue-form" onSubmit={(event) => { event.preventDefault(); void send(text); }}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={500}
          placeholder="Ask B-Lue3 about the game"
          aria-label="Ask B-Lue3"
          enterKeyHint="send"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !text.trim()}>Ask</button>
      </form>
      <p className="blue-fineprint"><strong>B-Lue3 can sometimes get it wrong.</strong> It looks things up in the guild&apos;s synced data and, for counters, the web. It can&apos;t see mods or farm locations, so check in game before you commit a squad.</p>
    </div>
  );
}
