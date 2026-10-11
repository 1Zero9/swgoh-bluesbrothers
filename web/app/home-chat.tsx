"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageList, messagePreview } from "./chat/chat-parts";
import { useChat } from "./chat/use-chat";

const STORAGE_KEY = "bb-home-chat";

/**
 * The guild chat at the top of the dashboard. Collapsed, it shows the latest message and a reply box;
 * one tap opens a live chat in place. The choice is remembered on this device.
 */
export default function HomeChat({ channelKey, channelLabel, signedInAsMember }: { channelKey: string; channelLabel: string; signedInAsMember: boolean }) {
  const { messages, loaded, error, canPost, contentHidden, send } = useChat(channelKey, 8000);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Restore the remembered choice after the first paint (localStorage isn't available on the server).
  useEffect(() => {
    const timer = setTimeout(() => {
      try { setOpen(window.localStorage.getItem(STORAGE_KEY) === "open"); } catch { /* ignore */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (open && list) list.scrollTop = list.scrollHeight;
  }, [open, messages]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try { window.localStorage.setItem(STORAGE_KEY, next ? "open" : "closed"); } catch { /* ignore */ }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError(null);
    const problem = await send(content);
    if (problem) setSendError(problem);
    else setText("");
    setSending(false);
  }

  // The last two messages, one line each, so the collapsed panel reads like a conversation.
  const peek = messages.slice(-2).map(messagePreview).filter((item) => item.text);

  return (
    <section className={`home-chat${open ? " is-open" : ""}`} aria-label="Guild chat">
      <header>
        <div>
          <p className="eyebrow">Guild chat</p>
          <h2>{channelLabel}</h2>
        </div>
        <div className="home-chat-actions">
          <Link href="/chat">Full screen →</Link>
          <button type="button" onClick={toggle} aria-expanded={open}>{open ? "Collapse ▴" : "Open chat ▾"}</button>
        </div>
      </header>

      {open ? (
        <div className="home-chat-list" ref={listRef}>
          {!loaded ? <p className="chat-note">Loading the chat…</p> : null}
          {loaded && error ? <p className="chat-note chat-error">{error}</p> : null}
          {contentHidden ? <p className="chat-banner">Discord isn&apos;t sharing people&apos;s message text with the site yet, so only automatic posts show.</p> : null}
          <MessageList messages={messages.slice(-25)} />
        </div>
      ) : (
        <button type="button" className="home-chat-peek" onClick={toggle} aria-label="Open the chat">
          {error ? <span className="chat-error">{error}</span> : !loaded ? <span>Loading the chat…</span> : peek.length ? (
            peek.map((item, index) => (
              <span key={index} className="home-chat-line"><strong>{item.name}</strong>{item.app ? <i>APP</i> : null} {item.text}</span>
            ))
          ) : <span>Nothing here yet. Say hello.</span>}
        </button>
      )}

      {canPost && signedInAsMember ? (
        <form className="home-chat-compose" onSubmit={submit}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`Message ${channelLabel}`}
            maxLength={1000}
            aria-label="Message"
          />
          <button type="submit" disabled={sending || !text.trim()}>{sending ? "…" : "Send"}</button>
          {sendError ? <p className="chat-error">{sendError}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
