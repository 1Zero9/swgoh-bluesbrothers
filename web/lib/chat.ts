import { enabledChatChannels, type ChatChannelConfig } from "@/lib/chat-config";
import { webhookDisplayName } from "@/lib/chat-rules";
import { parseDiscordText, type Segment } from "@/lib/discord-text";
import { fetchDiscordGuildMembers } from "@/lib/discord-sync";

const API = "https://discord.com/api/v10";
const MESSAGE_TTL_MS = 4000;
const DIRECTORY_TTL_MS = 10 * 60 * 1000;

export type ChatEmbed = { title: string | null; url: string | null; color: string | null; segments: Segment[] };
export type ChatAttachment = { url: string; name: string; isImage: boolean };
export type ChatMessage = {
  id: string;
  at: string;
  edited: boolean;
  author: { name: string; avatarUrl: string | null; app: boolean };
  segments: Segment[];
  attachments: ChatAttachment[];
  embeds: ChatEmbed[];
};
export type ChatResult =
  | { ok: true; messages: ChatMessage[]; contentHidden: boolean }
  | { ok: false; error: string; status: number };

type RawUser = { id: string; username: string; global_name?: string | null; avatar?: string | null; bot?: boolean };
type RawMessage = {
  id: string;
  type: number;
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  webhook_id?: string;
  author: RawUser;
  mentions?: RawUser[];
  attachments?: { url: string; filename: string; content_type?: string }[];
  embeds?: { title?: string; url?: string; description?: string; color?: number }[];
};

function botHeaders() {
  return { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN ?? ""}` };
}

let directory: { at: number; channels: Map<string, string>; names: Map<string, string>; members: Map<string, { name: string; avatar: string | null }> } | null = null;

/** Channel names and members change rarely, so they're looked up at most every ten minutes. */
async function getDirectory() {
  if (directory && Date.now() - directory.at < DIRECTORY_TTL_MS) return directory;
  const guildId = process.env.DISCORD_GUILD_ID;
  const channels = new Map<string, string>(); // name -> id
  const names = new Map<string, string>(); // id -> name
  if (guildId && process.env.DISCORD_BOT_TOKEN) {
    const response = await fetch(`${API}/guilds/${guildId}/channels`, { headers: botHeaders(), signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (response?.ok) {
      for (const channel of (await response.json()) as { id: string; name: string; type: number }[]) {
        if (channel.type === 0) { channels.set(channel.name, channel.id); names.set(channel.id, channel.name); }
      }
    }
  }
  const members = new Map<string, { name: string; avatar: string | null }>();
  for (const member of await fetchDiscordGuildMembers()) {
    members.set(member.id, { name: member.nickname || member.globalName || member.username, avatar: member.avatarUrl });
  }
  directory = { at: Date.now(), channels, names, members };
  return directory;
}

function avatarFor(author: RawUser, memberAvatar: string | null | undefined) {
  if (memberAvatar) return memberAvatar;
  return author.avatar ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=64` : null;
}

function embedColor(color: number | undefined) {
  return typeof color === "number" && color > 0 ? `#${color.toString(16).padStart(6, "0")}` : null;
}

const MEDIA_HOSTS = new Set(["cdn.discordapp.com", "media.discordapp.net"]);

function safeMediaUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && MEDIA_HOSTS.has(parsed.hostname) ? url : null;
  } catch {
    return null;
  }
}

/** Turns one raw Discord message into something safe and ready to render. Exported for tests. */
export function shapeMessage(
  raw: RawMessage,
  dir: { names: Map<string, string>; members: Map<string, { name: string; avatar: string | null }> },
): ChatMessage {
  const app = Boolean(raw.author.bot || raw.webhook_id);
  const member = dir.members.get(raw.author.id);
  const nameOf = (user: RawUser) => dir.members.get(user.id)?.name ?? user.global_name ?? user.username;

  const users = new Map<string, string>((raw.mentions ?? []).map((user) => [user.id, nameOf(user)]));
  const ctx = { users, channels: dir.names };

  return {
    id: raw.id,
    at: raw.timestamp,
    edited: Boolean(raw.edited_timestamp),
    author: {
      name: app ? raw.author.username : member?.name ?? raw.author.global_name ?? raw.author.username,
      avatarUrl: avatarFor(raw.author, app ? null : member?.avatar),
      app,
    },
    segments: parseDiscordText(raw.content ?? "", ctx),
    attachments: (raw.attachments ?? []).flatMap((attachment) => {
      const url = safeMediaUrl(attachment.url);
      return url ? [{ url, name: attachment.filename, isImage: Boolean(attachment.content_type?.startsWith("image/")) }] : [];
    }),
    embeds: (raw.embeds ?? [])
      .filter((embed) => embed.title || embed.description)
      .map((embed) => ({
        title: embed.title ?? null,
        url: embed.url && /^https:\/\//.test(embed.url) ? embed.url : null,
        color: embedColor(embed.color),
        segments: parseDiscordText(embed.description ?? "", ctx),
      })),
  };
}

const cache = new Map<string, { at: number; result: ChatResult }>();

export function chatChannel(key: string): ChatChannelConfig | undefined {
  return enabledChatChannels().find((channel) => channel.key === key);
}

export function canPostTo(channel: ChatChannelConfig) {
  return Boolean(process.env[channel.webhookEnv]?.startsWith("https://discord.com/api/webhooks/"));
}

export async function getChatMessages(channel: ChatChannelConfig): Promise<ChatResult> {
  const hit = cache.get(channel.key);
  if (hit && Date.now() - hit.at < MESSAGE_TTL_MS) return hit.result;

  const result = await loadMessages(channel);
  cache.set(channel.key, { at: Date.now(), result });
  return result;
}

async function loadMessages(channel: ChatChannelConfig): Promise<ChatResult> {
  if (!process.env.DISCORD_BOT_TOKEN) return { ok: false, error: "The chat isn't connected to Discord yet.", status: 503 };
  const dir = await getDirectory();
  const channelId = dir.channels.get(channel.key);
  if (!channelId) return { ok: false, error: `Couldn't find ${channel.label} in the Discord server.`, status: 404 };

  const response = await fetch(`${API}/channels/${channelId}/messages?limit=50`, { headers: botHeaders(), signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!response) return { ok: false, error: "Couldn't reach Discord. Trying again shortly.", status: 502 };
  if (response.status === 403) return { ok: false, error: `The bot can't read ${channel.label}. In Discord, give it View Channel and Read Message History there.`, status: 403 };
  if (!response.ok) return { ok: false, error: `Discord returned an error (${response.status}).`, status: 502 };

  const raw = ((await response.json()) as RawMessage[]).filter((message) => message.type === 0 || message.type === 19);
  // Without the Message Content Intent, Discord blanks people's message text. Spot that and say so.
  const contentHidden = raw.some((message) => !message.author.bot && !message.webhook_id && !message.content && !message.attachments?.length && !message.embeds?.length);
  return { ok: true, messages: raw.reverse().map((message) => shapeMessage(message, dir)), contentHidden };
}

export async function postChatMessage(channel: ChatChannelConfig, member: { name: string; discordUserId: string | null }, content: string) {
  const webhook = process.env[channel.webhookEnv];
  if (!webhook?.startsWith("https://discord.com/api/webhooks/")) return { ok: false as const, error: `Posting to ${channel.label} isn't switched on.` };

  const dir = await getDirectory();
  const avatar = member.discordUserId ? dir.members.get(member.discordUserId)?.avatar : null;
  const response = await fetch(`${webhook}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      username: webhookDisplayName(member.name),
      avatar_url: avatar ?? undefined,
      allowed_mentions: { parse: [] },
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!response?.ok) return { ok: false as const, error: "Discord didn't accept that message. Try again." };
  cache.delete(channel.key);
  return { ok: true as const };
}
