import type { DiscordGuildMember, PlayerDiscordStatus } from "@/lib/discord-sync";

export type BulkLinkCandidate = {
  playerId: string;
  playerName: string;
  discordUserId: string;
  discordLabel: string;
};

/**
 * Picks players that can safely be linked in one go: unlinked, with an EXACT
 * name match whose Discord member is not claimed by another player, not already
 * linked elsewhere, and not an exact match for a second player.
 */
export function selectBulkLinkCandidates(players: PlayerDiscordStatus[]): BulkLinkCandidate[] {
  const alreadyLinked = new Set(players.flatMap((p) => (p.linkedDiscordUser ? [p.linkedDiscordUser.id] : [])));

  const exactFor = (player: PlayerDiscordStatus): DiscordGuildMember | null => {
    if (player.linkedDiscordUser) return null;
    const exact = player.suggestedMatches.filter((match) => match.confidence === "EXACT");
    return exact.length === 1 ? exact[0].discordMember : null;
  };

  const claims = new Map<string, number>();
  for (const player of players) {
    const member = exactFor(player);
    if (member) claims.set(member.id, (claims.get(member.id) ?? 0) + 1);
  }

  return players.flatMap((player) => {
    const member = exactFor(player);
    if (!member || alreadyLinked.has(member.id) || claims.get(member.id) !== 1) return [];
    return [{
      playerId: player.playerId,
      playerName: player.playerName,
      discordUserId: member.id,
      discordLabel: member.nickname || member.globalName || member.username,
    }];
  });
}
