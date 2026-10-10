import { planOfficerRoleChanges } from "@/lib/discord-role-plan";
import { addDiscordUserRole, fetchDiscordGuildMembersDetailed, removeDiscordUserRole } from "@/lib/discord-sync";
import { getPrisma } from "@/lib/prisma";

const OFFICER_RANKS = ["Officer", "Leader"];
/** A bug or a bad sync must never strip or hand out roles in bulk. */
const MAX_CHANGES_PER_RUN = 8;

export type OfficerRoleSyncResult = { skipped?: string; added: number; removed: number; failed: number };

/**
 * Makes the Discord officer role follow the in-game rank for every linked player:
 * Officer/Leader gets it, everyone else loses it. Runs after each guild sync and is
 * idempotent, so it also repairs drift without anyone pressing a button.
 */
export async function syncOfficerRoles(): Promise<OfficerRoleSyncResult> {
  const none = { added: 0, removed: 0, failed: 0 };
  const officerRoleId = process.env.DISCORD_OFFICER_ROLE_ID;
  if (!officerRoleId) return { ...none, skipped: "DISCORD_OFFICER_ROLE_ID is not set" };

  const prisma = getPrisma();
  const latest = await prisma.guildSnapshot.findFirst({ orderBy: { capturedAt: "desc" }, select: { id: true, guildId: true } });
  if (!latest) return { ...none, skipped: "no roster snapshot yet" };

  // Sanity check: a guild always has a leader. If none shows up, the rank data is suspect: change nothing.
  const officers = await prisma.memberSnapshot.count({ where: { guildSnapshotId: latest.id, memberRole: { in: OFFICER_RANKS } } });
  if (officers === 0) return { ...none, skipped: "no officers or leader in the latest roster" };

  const { members, error } = await fetchDiscordGuildMembersDetailed();
  if (error || members.length === 0) return { ...none, skipped: error ?? "empty Discord member list" };

  const linked = await prisma.player.findMany({
    where: { OR: [{ discordUserId: { not: null } }, { extraDiscordAccounts: { some: {} } }] },
    select: {
      currentName: true,
      discordUserId: true,
      extraDiscordAccounts: { select: { discordUserId: true } },
      membershipTerms: { where: { state: "ACTIVE" }, select: { id: true }, take: 1 },
      snapshots: { orderBy: { guildSnapshot: { capturedAt: "desc" } }, take: 1, select: { memberRole: true } },
    },
  });

  const plan = planOfficerRoleChanges(
    linked.map((player) => ({
      name: player.currentName,
      shouldBeOfficer: player.membershipTerms.length > 0 && OFFICER_RANKS.includes(player.snapshots[0]?.memberRole ?? ""),
      discordUserIds: [player.discordUserId, ...player.extraDiscordAccounts.map((row) => row.discordUserId)].filter((id): id is string => Boolean(id)),
    })),
    members,
    officerRoleId,
  );

  let added = 0;
  let removed = 0;
  let failed = 0;
  const notes: string[] = [];

  for (const change of plan.add.slice(0, MAX_CHANGES_PER_RUN)) {
    if (await addDiscordUserRole(change.discordUserId, officerRoleId)) { added += 1; notes.push(`+${change.playerName}`); } else failed += 1;
  }
  for (const change of plan.remove.slice(0, Math.max(0, MAX_CHANGES_PER_RUN - added - failed))) {
    if (await removeDiscordUserRole(change.discordUserId, officerRoleId)) { removed += 1; notes.push(`-${change.playerName}`); } else failed += 1;
  }

  if (added || removed || failed) {
    await prisma.automationEvent.create({
      data: {
        guildId: latest.guildId,
        kind: "DISCORD_ROLE_SYNC",
        status: failed ? "FAILED" : "SENT",
        summary: `Officer role synced from in-game ranks: ${added} added, ${removed} removed${failed ? `, ${failed} failed (check the bot's role sits above the Officer role)` : ""}.`,
        metadata: { changes: notes },
      },
    });
  }
  return { added, removed, failed };
}
