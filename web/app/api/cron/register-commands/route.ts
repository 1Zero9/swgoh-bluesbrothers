import { GUILD_COMMANDS } from "@/lib/discord-commands";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Registers the Droid's slash commands in the guild (instant, and replaces the previous set).
 * Protected by the cron secret and run from the "Register Discord commands" GitHub workflow.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const applicationId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!applicationId || !guildId || !token) return Response.json({ ok: false, error: "Discord isn't fully configured." }, { status: 503 });

  const response = await fetch(`https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`, {
    method: "PUT",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(GUILD_COMMANDS),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!response) return Response.json({ ok: false, error: "Couldn't reach Discord." }, { status: 502 });

  const text = await response.text();
  if (!response.ok) {
    // 50001/403 usually means the bot was invited without the applications.commands scope.
    return Response.json({ ok: false, status: response.status, error: text.slice(0, 300), hint: response.status === 403 || response.status === 401 ? "Re-invite the bot with the applications.commands scope." : undefined }, { status: 502 });
  }
  const registered = (JSON.parse(text) as { name: string }[]).map((command) => command.name);
  return Response.json({ ok: true, registered });
}
