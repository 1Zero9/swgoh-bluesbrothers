"use client";

import { useEffect, useRef, useState } from "react";
import { MessageList } from "./chat-parts";
import { useChat } from "./use-chat";
import NavIcon from "@/app/nav-icon";

type ChannelTab = { key: string; label: string };

export default function ChatClient({ channels, signedInAsMember }: { channels: ChannelTab[]; signedInAsMember: boolean }) {
  const [active, setActive] = useState(channels[0]?.key ?? "");
  const { messages, loaded, error, canPost, contentHidden, send } = useChat(active);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  function onScroll() {
    const list = listRef.current;
    if (list) stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
  }

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError(null);
    const problem = await send(content);
    if (problem) setSendError(problem);
    else { setText(""); stickToBottom.current = true; }
    setSending(false);
  }

  return (
    <section className="chat-shell" aria-label="Guild chat">
      <nav className="chat-tabs" aria-label="Channels">
        {channels.map((channel) => (
          <button key={channel.key} type="button" className={channel.key === active ? "is-active" : ""} onClick={() => { stickToBottom.current = true; setActive(channel.key); }}>
            {channel.label}
          </button>
        ))}
        <a className="chat-bell" href="/me#notifications"><NavIcon name="bell" size={16} /> Notifications</a>
      </nav>

      {contentHidden ? (
        <p className="chat-banner">Discord isn&apos;t sharing people&apos;s message text with the site yet, so only automatic posts show. An officer needs to switch on the bot&apos;s Message Content Intent.</p>
      ) : null}

      <div className="chat-list" ref={listRef} onScroll={onScroll}>
        {!loaded ? <p className="chat-note">Loading the chat…</p> : null}
        {loaded && error ? <p className="chat-note chat-error">{error}</p> : null}
        {loaded && !error && !messages.length ? <p className="chat-note">Nothing here yet. Say hello.</p> : null}
        <MessageList messages={messages} />
      </div>

      {canPost && signedInAsMember ? (
        <form className="chat-compose" onSubmit={submit}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }}
            placeholder={`Message ${channels.find((c) => c.key === active)?.label ?? ""}`}
            rows={1}
            maxLength={1000}
            aria-label="Message"
          />
          <button type="submit" disabled={sending || !text.trim()}>{sending ? "…" : "Send"}</button>
          {sendError ? <p className="chat-error">{sendError}</p> : null}
        </form>
      ) : (
        <p className="chat-readonly">
          {!signedInAsMember
            ? "Sign in with Discord to join the conversation."
            : "Posting isn't switched on for this channel yet, so it's read-only."}
        </p>
      )}
    </section>
  );
}
