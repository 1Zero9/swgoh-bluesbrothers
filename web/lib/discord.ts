type Announcement = {
  title: string;
  description: string;
  color: number;
  websiteUrl?: string;
};

export function getDiscordUrl() {
  return process.env.DISCORD_INVITE_URL
    || (process.env.DISCORD_GUILD_ID ? `https://discord.com/channels/${process.env.DISCORD_GUILD_ID}` : "https://discord.com/");
}

export async function postDiscordAnnouncement(announcement: Announcement) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return false;
  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    throw new Error("DISCORD_WEBHOOK_URL is not a Discord webhook URL");
  }

  const response = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Blues Brothers Droid",
      allowed_mentions: { parse: [] },
      embeds: [{
        title: announcement.title,
        description: announcement.description,
        color: announcement.color,
        url: announcement.websiteUrl,
        footer: { text: "Blues Brothers Guild Wire" },
        timestamp: new Date().toISOString(),
      }],
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new Error(`Discord webhook returned HTTP ${response.status}`);
  return true;
}

export async function addDiscordRole(discordUserId: string | null, roleId: string | undefined) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!discordUserId || !token || !guildId || !roleId) return false;

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${token}`,
        "X-Audit-Log-Reason": "Blues Brothers site role assignment",
      },
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Discord role assignment returned HTTP ${response.status}`);
  }
  return true;
}

export async function removeDiscordMemberRole(discordUserId: string | null) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_MEMBER_ROLE_ID;
  if (!discordUserId || !token || !guildId || !roleId) return false;

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${token}`,
        "X-Audit-Log-Reason": "Player left the SWGOH guild roster",
      },
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok && response.status !== 404 && response.status !== 204) {
    throw new Error(`Discord role removal returned HTTP ${response.status}`);
  }
  return true;
}

export async function demoteDiscordMemberOnDeparture(discordUserId: string | null) {
  if (!discordUserId) return false;
  const publicRoleId = process.env.DISCORD_PUBLIC_ROLE_ID;
  await removeDiscordMemberRole(discordUserId);
  if (publicRoleId) {
    await addDiscordRole(discordUserId, publicRoleId);
  }
  return true;
}
