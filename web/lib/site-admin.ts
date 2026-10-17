import type { ViewerAccess } from "@/lib/access-control";

/**
 * The site admin is one person (the guild's owner), not "an officer". Set SITE_ADMIN_DISCORD_ID (comma-separated for more than one)
 * to the admin's Discord user id. With nothing set, nobody is admin, so things fail closed.
 */
export function adminIds(env = process.env.SITE_ADMIN_DISCORD_ID): string[] {
  return (env ?? "").split(",").map((id) => id.replace(/[^0-9]/g, "")).filter(Boolean);
}

export function isSiteAdmin(access: Pick<ViewerAccess, "discordUserId">, env = process.env.SITE_ADMIN_DISCORD_ID): boolean {
  const ids = adminIds(env);
  return Boolean(access.discordUserId) && ids.includes(String(access.discordUserId));
}
