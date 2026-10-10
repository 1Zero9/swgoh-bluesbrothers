/**
 * Discord channels mirrored on the site's Chat page. The channel `key` is its Discord name. Only channels
 * listed here can ever be read or written; officers' channels are deliberately not on the list.
 */
export type ChatChannelConfig = { key: string; label: string; webhookEnv: string };

export const ALL_CHAT_CHANNELS: ChatChannelConfig[] = [
  { key: "general", label: "#general", webhookEnv: "DISCORD_GENERAL_WEBHOOK_URL" },
  { key: "the-wins", label: "#the-wins", webhookEnv: "DISCORD_WINS_WEBHOOK_URL" },
  { key: "tw", label: "#tw", webhookEnv: "DISCORD_TW_WEBHOOK_URL" },
  { key: "tw_stats", label: "#tw_stats", webhookEnv: "DISCORD_TW_STATS_WEBHOOK_URL" },
];

/** Which channels are switched on: `DISCORD_CHAT_CHANNELS=general,tw` (default: just general). */
export function enabledChatChannels(env: string | undefined = process.env.DISCORD_CHAT_CHANNELS): ChatChannelConfig[] {
  const wanted = new Set((env ?? "general").split(",").map((name) => name.trim()).filter(Boolean));
  return ALL_CHAT_CHANNELS.filter((channel) => wanted.has(channel.key));
}
