export type RoleSyncPlayer = {
  name: string;
  /** The in-game rank says this player should hold the Discord officer role. */
  shouldBeOfficer: boolean;
  discordUserIds: string[];
};

export type RoleChange = { discordUserId: string; playerName: string };

export type RoleChangePlan = { add: RoleChange[]; remove: RoleChange[] };

/**
 * Works out which linked Discord accounts need the officer role added or removed.
 * Only accounts that are linked to a player AND present in the Discord server are touched,
 * so Discord-only moderators and people who aren't in the server are never affected.
 */
export function planOfficerRoleChanges(
  players: RoleSyncPlayer[],
  discordMembers: { id: string; roles: string[] }[],
  officerRoleId: string,
): RoleChangePlan {
  const byId = new Map(discordMembers.map((member) => [member.id, member]));
  const plan: RoleChangePlan = { add: [], remove: [] };

  for (const player of players) {
    for (const discordUserId of player.discordUserIds) {
      const member = byId.get(discordUserId);
      if (!member) continue;
      const hasRole = member.roles.includes(officerRoleId);
      if (player.shouldBeOfficer && !hasRole) plan.add.push({ discordUserId, playerName: player.name });
      if (!player.shouldBeOfficer && hasRole) plan.remove.push({ discordUserId, playerName: player.name });
    }
  }
  return plan;
}
