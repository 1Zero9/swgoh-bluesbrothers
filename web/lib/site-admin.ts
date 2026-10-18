import type { ViewerAccess } from "@/lib/access-control";

/**
 * The site admin is one person (the guild's owner), not "an officer". Set SITE_ADMIN_DISCORD_ID (comma-separated for more than one)
 * to the admin's Discord user id. With nothing set, nobody is admin, so things fail closed.
 */
export function adminIds(env = process.env.SITE_ADMIN_DISCORD_ID): string[] {
  // Only real Discord user ids count (long numbers). A username such as "dex7707" must not be turned into "7707".
  return (env ?? "").split(",").map((id) => id.replace(/["'\s]/g, "")).filter((id) => /^\d{15,25}$/.test(id));
}

/** Entries in the setting that are not a numeric Discord user id (a username, for example), so the page can say what is wrong. */
export function adminEnvProblems(env = process.env.SITE_ADMIN_DISCORD_ID): string[] {
  return (env ?? "").split(",").map((id) => id.replace(/["'\s]/g, "")).filter((id) => id && !/^\d{15,25}$/.test(id));
}

/**
 * Admin only if the Discord account this session actually signed in with is on the list. Not "a player linked to that account": a personal
 * sign-in link, an extra account added to the player, or an old session without the account can never be the admin.
 */
export function isSiteAdmin(access: Pick<ViewerAccess, "sessionDiscordUserId">, env = process.env.SITE_ADMIN_DISCORD_ID): boolean {
  return Boolean(access.sessionDiscordUserId) && adminIds(env).includes(String(access.sessionDiscordUserId));
}

/** True when any of these Discord accounts is the site admin's, so nobody can be given a sign-in as the admin's player. */
export function includesAdminAccount(discordIds: (string | null | undefined)[], env = process.env.SITE_ADMIN_DISCORD_ID): boolean {
  const admin = adminIds(env);
  return discordIds.some((id) => Boolean(id) && admin.includes(String(id)));
}
