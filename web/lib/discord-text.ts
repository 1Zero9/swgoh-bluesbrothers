/** A tiny, safe reader for Discord message text: no HTML is ever produced, only typed segments to render. */

export type Segment =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; url: string }
  | { type: "mention"; text: string };

export type TextContext = {
  users: Map<string, string>;
  channels: Map<string, string>;
};

const TOKEN = new RegExp(
  [
    "\\[(?<mdText>[^\\]\\n]+)\\]\\((?<mdUrl>https?:\\/\\/[^\\s)]+)\\)",
    "<@[!&]?(?<user>\\d+)>",
    "<#(?<channel>\\d+)>",
    "<a?:(?<emoji>\\w+):\\d+>",
    "\\*\\*(?<bold>[^*\\n]+)\\*\\*",
    "`(?<code>[^`\\n]+)`",
    "(?<url>https?:\\/\\/[^\\s<]+)",
  ].join("|"),
  "g",
);

export function parseDiscordText(input: string, ctx: TextContext): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  const pushText = (text: string) => {
    if (!text) return;
    const previous = segments[segments.length - 1];
    if (previous?.type === "text") previous.text += text;
    else segments.push({ type: "text", text });
  };

  for (const match of input.matchAll(TOKEN)) {
    const g = match.groups ?? {};
    pushText(input.slice(last, match.index));
    last = (match.index ?? 0) + match[0].length;

    if (g.mdText && g.mdUrl) segments.push({ type: "link", text: g.mdText, url: g.mdUrl });
    else if (g.user) segments.push({ type: "mention", text: `@${ctx.users.get(g.user) ?? "someone"}` });
    else if (g.channel) segments.push({ type: "mention", text: `#${ctx.channels.get(g.channel) ?? "channel"}` });
    else if (g.emoji) pushText(`:${g.emoji}:`);
    else if (g.bold) segments.push({ type: "bold", text: g.bold });
    else if (g.code) segments.push({ type: "code", text: g.code });
    else if (g.url) {
      // Keep sentence punctuation out of the link.
      const trimmed = g.url.replace(/[.,;:!?)\]]+$/, "");
      segments.push({ type: "link", text: trimmed, url: trimmed });
      pushText(g.url.slice(trimmed.length));
    }
  }
  pushText(input.slice(last));
  return segments;
}
