"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat";
import type { Segment } from "@/lib/discord-text";

type ChannelTab = { key: string; label: string };

function Rich({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "bold": return <strong key={index}>{segment.text}</strong>;
          case "code": return <code key={index}>{segment.text}</code>;
          case "mention": return <span key={index} className="chat-mention">{segment.text}</span>;
          case "link": return <a key={index} href={segment.url} target="_blank" rel="noopener noreferrer nofollow">{segment.text}</a>;
          default: return <span key={index}>{segment.text}</span>;
        }
      })}
    </>
  );
}

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });

function sameDay(a: string, b: string) {
  return DAY.format(new Date(a)) === DAY.format(new Date(b));
}

export default function ChatClient({ channels, signedInAsMember }: { channels: ChannelTab[]; signedInAsMember: boolean }) {
  const [active, setActive] = useState(channels[0]?.key ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // "Loaded" belongs to a channel, so switching tabs shows the loading note without resetting state in an effect.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loaded = loadedFor === active;
  const [error, setError] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(false);
  const [contentHidden, setContentHidden] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/messages?channel=${encodeURIComponent(active)}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; messages?: ChatMessage[]; canPost?: boolean; contentHidden?: boolean } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Couldn't load the chat.");
      setMessages(data.messages ?? []);
      setCanPost(Boolean(data.canPost));
      setContentHidden(Boolean(data.contentHidden));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the chat.");
    } finally {
      setLoadedFor(active);
    }
  }, [active]);

  useEffect(() => {
    stickToBottom.current = true;
    const tick = () => { if (document.visibilityState === "visible") void load(); };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 6000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearTimeout(first); clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [load]);

  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages]);

  function onScroll() {
    const list = listRef.current;
    if (list) stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
  }

  async function send(event?: React.FormEvent) {
    event?.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: active, content }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Couldn't send that.");
      setText("");
      stickToBottom.current = true;
      await load();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Couldn't send that.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-shell" aria-label="Guild chat">
      <nav className="chat-tabs" aria-label="Channels">
        {channels.map((channel) => (
          <button key={channel.key} type="button" className={channel.key === active ? "is-active" : ""} onClick={() => setActive(channel.key)}>
            {channel.label}
          </button>
        ))}
      </nav>

      {contentHidden ? (
        <p className="chat-banner">Discord isn&apos;t sharing people&apos;s message text with the site yet, so only automatic posts show. An officer needs to switch on the bot&apos;s Message Content Intent.</p>
      ) : null}

      <div className="chat-list" ref={listRef} onScroll={onScroll}>
        {!loaded ? <p className="chat-note">Loading the chat…</p> : null}
        {loaded && error ? <p className="chat-note chat-error">{error}</p> : null}
        {loaded && !error && !messages.length ? <p className="chat-note">Nothing here yet. Say hello.</p> : null}
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const newDay = !previous || !sameDay(previous.at, message.at);
          const grouped = !newDay && previous.author.name === message.author.name
            && new Date(message.at).getTime() - new Date(previous.at).getTime() < 5 * 60_000;
          return (
            <div key={message.id}>
              {newDay ? <p className="chat-day">{DAY.format(new Date(message.at))}</p> : null}
              <article className={`chat-message${grouped ? " is-grouped" : ""}`}>
                {grouped ? <span className="chat-avatar-gap" /> : (
                  message.author.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img className="chat-avatar" src={message.author.avatarUrl} alt="" width={36} height={36} loading="lazy" referrerPolicy="no-referrer" />
                    : <span className="chat-avatar chat-avatar-initial" aria-hidden="true">{message.author.name.charAt(0).toUpperCase()}</span>
                )}
                <div className="chat-body">
                  {grouped ? null : (
                    <header>
                      <strong>{message.author.name}</strong>
                      {message.author.app ? <i>APP</i> : null}
                      <time dateTime={message.at}>{TIME.format(new Date(message.at))}</time>
                    </header>
                  )}
                  {message.segments.length ? <p className="chat-text"><Rich segments={message.segments} /></p> : null}
                  {message.embeds.map((embed, embedIndex) => (
                    <div key={embedIndex} className="chat-embed" style={embed.color ? { borderLeftColor: embed.color } : undefined}>
                      {embed.title ? <strong>{embed.url ? <a href={embed.url} target="_blank" rel="noopener noreferrer nofollow">{embed.title}</a> : embed.title}</strong> : null}
                      <p className="chat-text"><Rich segments={embed.segments} /></p>
                    </div>
                  ))}
                  {message.attachments.map((attachment) => (
                    attachment.isImage
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <a key={attachment.url} href={attachment.url} target="_blank" rel="noopener noreferrer"><img className="chat-image" src={attachment.url} alt={attachment.name} loading="lazy" referrerPolicy="no-referrer" /></a>
                      : <a key={attachment.url} className="chat-file" href={attachment.url} target="_blank" rel="noopener noreferrer">{attachment.name}</a>
                  ))}
                </div>
              </article>
            </div>
          );
        })}
      </div>

      {canPost && signedInAsMember ? (
        <form className="chat-compose" onSubmit={send}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}
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
