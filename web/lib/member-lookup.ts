import { getPrisma } from "@/lib/prisma";

/**
 * The active guild member (if any) that a Discord account is linked to, either as
 * their primary account or as an extra one an officer added.
 */
export async function findActiveMemberByDiscordId(discordUserId: string) {
  const prisma = getPrisma();
  const activeTerm = { membershipTerms: { some: { state: "ACTIVE" as const } } };
  const player = await prisma.player.findFirst({
    where: {
      ...activeTerm,
      OR: [{ discordUserId }, { extraDiscordAccounts: { some: { discordUserId } } }],
    },
    select: { id: true, currentName: true },
  });
  return player ? { id: player.id, name: player.currentName } : null;
}
