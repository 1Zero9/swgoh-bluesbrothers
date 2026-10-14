"use client";

import Image from "next/image";
import NavIcon from "./nav-icon";
import { useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { icon: "sprout", text: "What should I farm next?" },
  { icon: "roster", text: "What team should I finish?" },
  { icon: "help", text: "How can I help the band?" },
];

/** Talk to B-Lue3. The conversation lives only in this page; the server keeps nothing but a daily count. */
export default function BlueChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const content = question.trim();
    if (!content || busy) return;
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
      const data = (await response.json().catch(() => null)) as { ok?: boolean; answer?: string; left?: number; error?: string } | null;
      if (data?.ok && data.answer) {
        setTurns([...next, { role: "assistant", content: data.answer }]);
        setLeft(data.left ?? null);
      } else {
        setError(data?.error ?? "B-Lue3 lost the signal. Try again.");
      }
    } catch {
      setError("B-Lue3 lost the signal. Try again.");
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }

  return (
    <div className="blue-chat">
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
              <p>{turn.content}</p>
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
          disabled={busy}
        />
        <button type="submit" disabled={busy || !text.trim()}>Ask</button>
      </form>
      <p className="blue-fineprint">B-Lue3 looks things up in the guild&apos;s synced data. It can&apos;t see mods or farm locations, and can be wrong, so check in game.{left !== null ? ` ${left} question${left === 1 ? "" : "s"} left this week.` : ""}</p>
    </div>
  );
}
