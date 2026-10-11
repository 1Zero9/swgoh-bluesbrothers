"use client";

import type { ChatMessage } from "@/lib/chat";
import type { Segment } from "@/lib/discord-text";

export function Rich({ segments }: { segments: Segment[] }) {
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

/** The message list, with day dividers and grouping of consecutive messages from one person. */
export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <>
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
    </>
  );
}

/** A one-line version of a message, for the collapsed home panel. */
export function messagePreview(message: ChatMessage) {
  const text = message.segments.map((segment) => segment.text).join("").trim()
    || message.embeds.map((embed) => [embed.title, embed.segments.map((s) => s.text).join("")].filter(Boolean).join(": ")).join(" ").trim();
  return { name: message.author.name, text, app: message.author.app };
}
