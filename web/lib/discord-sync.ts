import { getPrisma } from "@/lib/prisma";

export type DiscordGuildMember = {
  id: string;
  username: string;
  globalName: string | null;
  nickname: string | null;
  roles: string[];
  avatarUrl: string | null;
  joinedAt: Date | null;
};

export type MatchConfidence = "EXACT" | "HIGH" | "MEDIUM" | "LOW";

export type MatchSuggestion = {
  discordMember: DiscordGuildMember;
  score: number; // 0 - 100
  confidence: MatchConfidence;
  matchReason: string;
};

export type PlayerDiscordStatus = {
  playerId: string;
  playerName: string;
  playerLevel: number | null;
  galacticPower: bigint | null;
  allyCode: string | null;
  state: "ACTIVE" | "LEFT";
  linkedDiscordUser: DiscordGuildMember | null;
  suggestedMatches: MatchSuggestion[];
};

export type DiscordSyncSummary = {
  activeGameMembers: number;
  totalDiscordMembers: number;
  linkedMembersCount: number;
  unlinkedMembersCount: number;
  exMembersWithMemberRoleCount: number;
  botConfigured: boolean;
  memberRoleIdConfigured: boolean;
  publicRoleIdConfigured: boolean;
};

export type DiscordSyncReport = {
  summary: DiscordSyncSummary;
  activePlayers: PlayerDiscordStatus[];
  departedWithMemberRole: DiscordGuildMember[];
  recentAuditEvents: Array<{
    id: string;
    kind: string;
    summary: string;
    occurredAt: Date;
    status: string;
  }>;
};

// Common guild prefixes/tags to strip when matching
const GUILD_TAG_REGEX = /^(\[BB\]|\(BB\)|\{BB\}|BB\s*[-|:_]\s*|BB\s+|\[BLUES\s*BROTHERS\])\s*/i;
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;

/**
 * Normalizes a player name or Discord handle for robust matching:
 * - Strips guild tags ([BB], BB |, etc.)
 * - Strips emojis and special symbols
 * - Normalizes whitespace and converts to lower case
 */
export function normalizeName(raw: string): string {
  if (!raw) return "";
  let clean = raw.replace(EMOJI_REGEX, " ").trim();
  clean = clean.replace(GUILD_TAG_REGEX, "").trim();
  // Replace underscores, dashes, dots, and brackets with spaces
  clean = clean.replace(/[_.\-()[\]{}]/g, " ");
  // Remove non-alphanumeric except space
  clean = clean.replace(/[^a-z0-9\s]/gi, "");
  clean = clean.trim().toLowerCase().replace(/\s+/g, " ");
  // Also strip leading standalone 'bb' or 'blues brothers' if any
  clean = clean.replace(/^(bb|blues brothers)\s+/i, "").trim();
  return clean;
}

/**
 * Computes the Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= an; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bn; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[an][bn];
}

/**
 * Calculates a match score (0 - 100) between a SWGOH in-game player name and a Discord user.
 */
export function calculateMatchScore(
  inGameName: string,
  discordUser: { username: string; globalName: string | null; nickname: string | null },
): { score: number; confidence: MatchConfidence; reason: string } {
  const normGame = normalizeName(inGameName);
  if (!normGame) return { score: 0, confidence: "LOW", reason: "Empty game name" };

  const candidates = [
    { type: "Server Nickname", raw: discordUser.nickname, norm: normalizeName(discordUser.nickname ?? "") },
    { type: "Global Display Name", raw: discordUser.globalName, norm: normalizeName(discordUser.globalName ?? "") },
    { type: "Discord Handle", raw: discordUser.username, norm: normalizeName(discordUser.username ?? "") },
  ].filter((c) => Boolean(c.norm));

  let bestScore = 0;
  let bestReason = "No match";

  for (const c of candidates) {
    if (c.norm === normGame) {
      return { score: 100, confidence: "EXACT", reason: `Exact match with ${c.type} ("${c.raw}")` };
    }

    // Direct substring match (e.g. "Elwood" in "Elwood Blues")
    if (c.norm.includes(normGame) || normGame.includes(c.norm)) {
      const shorter = Math.min(c.norm.length, normGame.length);
      const longer = Math.max(c.norm.length, normGame.length);
      const subScore = Math.round(85 + (shorter / longer) * 10);
      if (subScore > bestScore) {
        bestScore = subScore;
        bestReason = `Name contained within ${c.type} ("${c.raw}")`;
      }
    }

    // Levenshtein similarity
    const maxLen = Math.max(c.norm.length, normGame.length);
    if (maxLen > 0) {
      const dist = levenshteinDistance(normGame, c.norm);
      const sim = (1 - dist / maxLen);
      const levScore = Math.round(sim * 100);
      if (levScore > bestScore) {
        bestScore = levScore;
        bestReason = `Fuzzy match with ${c.type} ("${c.raw}") [${levScore}%]`;
      }
    }
  }

  let confidence: MatchConfidence = "LOW";
  if (bestScore >= 95) confidence = "EXACT";
  else if (bestScore >= 80) confidence = "HIGH";
  else if (bestScore >= 60) confidence = "MEDIUM";

  return { score: bestScore, confidence, reason: bestReason };
}

/**
 * Fetch all members of the configured Discord guild via the Discord Bot REST API.
 */
export async function fetchDiscordGuildMembers(): Promise<DiscordGuildMember[]> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) return [];

  try {
    const members: DiscordGuildMember[] = [];
    let after = "0";
    let hasMore = true;

    while (hasMore && members.length < 1000) {
      const url = `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000&after=${after}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bot ${token}` },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        break;
      }

      const data = (await response.json()) as Array<{
        user?: { id: string; username: string; global_name?: string | null; avatar?: string | null };
        nick?: string | null;
        roles?: string[];
        joined_at?: string | null;
      }>;

      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      for (const item of data) {
        if (!item.user?.id) continue;
        members.push({
          id: item.user.id,
          username: item.user.username,
          globalName: item.user.global_name ?? null,
          nickname: item.nick ?? null,
          roles: item.roles ?? [],
          avatarUrl: item.user.avatar
            ? `https://cdn.discordapp.com/avatars/${item.user.id}/${item.user.avatar}.png`
            : null,
          joinedAt: item.joined_at ? new Date(item.joined_at) : null,
        });
      }

      if (data.length < 1000) {
        hasMore = false;
      } else {
        after = data[data.length - 1].user?.id || "0";
      }
    }

    return members;
  } catch {
    return [];
  }
}

/**
 * Add a role to a Discord user.
 */
export async function addDiscordUserRole(discordUserId: string, roleId: string): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId || !discordUserId || !roleId) return false;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${token}`,
          "X-Audit-Log-Reason": "Blues Brothers site role sync",
        },
        signal: AbortSignal.timeout(15_000),
      },
    );
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

/**
 * Remove a role from a Discord user.
 */
export async function removeDiscordUserRole(discordUserId: string, roleId: string): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId || !discordUserId || !roleId) return false;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${token}`,
          "X-Audit-Log-Reason": "Blues Brothers site role sync",
        },
        signal: AbortSignal.timeout(15_000),
      },
    );
    return response.ok || response.status === 204 || response.status === 404;
  } catch {
    return false;
  }
}

/**
 * Demotes a departed guild member to the Public/Guest role in Discord.
 */
export async function demoteDiscordMemberToPublic(discordUserId: string): Promise<{
  memberRoleRemoved: boolean;
  publicRoleAdded: boolean;
}> {
  const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;
  const publicRoleId = process.env.DISCORD_PUBLIC_ROLE_ID;

  let memberRoleRemoved = false;
  let publicRoleAdded = false;

  if (memberRoleId) {
    memberRoleRemoved = await removeDiscordUserRole(discordUserId, memberRoleId);
  }
  if (publicRoleId) {
    publicRoleAdded = await addDiscordUserRole(discordUserId, publicRoleId);
  }

  return { memberRoleRemoved, publicRoleAdded };
}

/**
 * Generates the full Discord Sync Report for officers.
 */
export async function getDiscordSyncReport(): Promise<DiscordSyncReport> {
  const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;
  const publicRoleId = process.env.DISCORD_PUBLIC_ROLE_ID;

  if (!process.env.DATABASE_URL) {
    const discordMembers = await fetchDiscordGuildMembers();
    // Provide sample active players for development preview
    const samplePlayers: PlayerDiscordStatus[] = [
      {
        playerId: "sample-1",
        playerName: "Elwood Blues",
        playerLevel: 85,
        galacticPower: BigInt(11500000),
        allyCode: "123-456-789",
        state: "ACTIVE",
        linkedDiscordUser: discordMembers[0] || null,
        suggestedMatches: [],
      },
      {
        playerId: "sample-2",
        playerName: "Joliet Jake",
        playerLevel: 85,
        galacticPower: BigInt(10800000),
        allyCode: "987-654-321",
        state: "ACTIVE",
        linkedDiscordUser: null,
        suggestedMatches: discordMembers.slice(0, 2).map((dm) => ({
          discordMember: dm,
          score: 88,
          confidence: "HIGH" as const,
          matchReason: "Nickname similarity with Joliet Jake",
        })),
      },
      {
        playerId: "sample-3",
        playerName: "Darth Dougie",
        playerLevel: 85,
        galacticPower: BigInt(11200000),
        allyCode: "555-123-456",
        state: "ACTIVE",
        linkedDiscordUser: null,
        suggestedMatches: [],
      },
    ];

    return {
      summary: {
        activeGameMembers: samplePlayers.length,
        totalDiscordMembers: discordMembers.length || 45,
        linkedMembersCount: samplePlayers.filter((p) => p.linkedDiscordUser).length,
        unlinkedMembersCount: samplePlayers.filter((p) => !p.linkedDiscordUser).length,
        exMembersWithMemberRoleCount: 0,
        botConfigured: Boolean(process.env.DISCORD_BOT_TOKEN),
        memberRoleIdConfigured: Boolean(memberRoleId),
        publicRoleIdConfigured: Boolean(publicRoleId),
      },
      activePlayers: samplePlayers,
      departedWithMemberRole: [],
      recentAuditEvents: [
        {
          id: "evt-1",
          kind: "DISCORD_ROLE_RECONCILE",
          summary: "Development mode preview: verified Discord governance engine readiness.",
          occurredAt: new Date(),
          status: "SENT",
        },
      ],
    };
  }

  const prisma = getPrisma();

  // 1. Fetch DB players with latest membership term
  const activeTerms = await prisma.membershipTerm.findMany({
    where: { state: "ACTIVE" },
    include: {
      player: {
        include: {
          snapshots: {
            orderBy: { guildSnapshot: { capturedAt: "desc" } },
            take: 1,
            select: { galacticPower: true, playerLevel: true },
          },
        },
      },
    },
  });

  // 2. Fetch Discord members
  const discordMembers = await fetchDiscordGuildMembers();
  const discordMemberMap = new Map(discordMembers.map((m) => [m.id, m]));

  const linkedDiscordUserIds = new Set<string>();
  const activePlayers: PlayerDiscordStatus[] = [];

  for (const term of activeTerms) {
    const player = term.player;
    const latestSnapshot = player.snapshots[0];
    const linkedUser = player.discordUserId ? discordMemberMap.get(player.discordUserId) ?? null : null;

    if (linkedUser) {
      linkedDiscordUserIds.add(linkedUser.id);
    }

    // Compute suggested matches for unlinked players
    let suggestedMatches: MatchSuggestion[] = [];
    if (!linkedUser && discordMembers.length > 0) {
      suggestedMatches = discordMembers
        .filter((dm) => !linkedDiscordUserIds.has(dm.id))
        .map((dm) => {
          const match = calculateMatchScore(player.currentName, dm);
          return {
            discordMember: dm,
            score: match.score,
            confidence: match.confidence,
            matchReason: match.reason,
          };
        })
        .filter((s) => s.score >= 50)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    }

    activePlayers.push({
      playerId: player.id,
      playerName: player.currentName,
      playerLevel: latestSnapshot?.playerLevel ?? player.level ?? null,
      galacticPower: latestSnapshot?.galacticPower ?? null,
      allyCode: player.allyCode ?? null,
      state: "ACTIVE",
      linkedDiscordUser: linkedUser,
      suggestedMatches,
    });
  }

  // Sort: Unlinked first (by GP desc), then linked (by GP desc)
  activePlayers.sort((a, b) => {
    if (!a.linkedDiscordUser && b.linkedDiscordUser) return -1;
    if (a.linkedDiscordUser && !b.linkedDiscordUser) return 1;
    return Number((b.galacticPower ?? BigInt(0)) - (a.galacticPower ?? BigInt(0)));
  });

  // Find Discord members who hold the member role but are NOT active in game
  const activeLinkedDiscordIds = new Set(
    activePlayers.filter((p) => p.linkedDiscordUser).map((p) => p.linkedDiscordUser!.id),
  );

  const departedWithMemberRole = memberRoleId
    ? discordMembers.filter((dm) => dm.roles.includes(memberRoleId) && !activeLinkedDiscordIds.has(dm.id))
    : [];

  // Fetch recent audit events
  const auditEvents = await prisma.automationEvent.findMany({
    where: {
      kind: {
        in: [
          "MEMBER_WELCOME",
          "MEMBER_DEPARTURE",
          "DISCORD_MANUAL_LINK",
          "DISCORD_ROLE_RECONCILE",
          "DISCORD_ROLE_DEMOTE",
        ],
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 10,
    select: { id: true, kind: true, summary: true, occurredAt: true, status: true },
  });

  return {
    summary: {
      activeGameMembers: activePlayers.length,
      totalDiscordMembers: discordMembers.length,
      linkedMembersCount: activePlayers.filter((p) => p.linkedDiscordUser).length,
      unlinkedMembersCount: activePlayers.filter((p) => !p.linkedDiscordUser).length,
      exMembersWithMemberRoleCount: departedWithMemberRole.length,
      botConfigured: Boolean(process.env.DISCORD_BOT_TOKEN),
      memberRoleIdConfigured: Boolean(memberRoleId),
      publicRoleIdConfigured: Boolean(publicRoleId),
    },
    activePlayers,
    departedWithMemberRole,
    recentAuditEvents: auditEvents,
  };
}

/**
 * Links an in-game SWGOH player to a Discord User ID.
 */
export async function linkPlayerToDiscord(playerId: string, discordUserId: string): Promise<boolean> {
  const prisma = getPrisma();
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return false;

  await prisma.player.update({
    where: { id: playerId },
    data: { discordUserId },
  });

  // Grant member role in Discord if configured
  const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;
  if (memberRoleId) {
    await addDiscordUserRole(discordUserId, memberRoleId);
  }

  // Record audit event
  await prisma.automationEvent.create({
    data: {
      guildId: process.env.SWGOH_GUILD_ID || "guild",
      playerId: player.id,
      kind: "DISCORD_MANUAL_LINK",
      status: "SENT",
      summary: `Linked SWGOH member ${player.currentName} to Discord ID ${discordUserId}.`,
    },
  });

  return true;
}

/**
 * Unlinks an in-game SWGOH player from Discord.
 */
export async function unlinkPlayerFromDiscord(playerId: string): Promise<boolean> {
  const prisma = getPrisma();
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || !player.discordUserId) return false;

  const oldDiscordId = player.discordUserId;

  await prisma.player.update({
    where: { id: playerId },
    data: { discordUserId: null },
  });

  await prisma.automationEvent.create({
    data: {
      guildId: process.env.SWGOH_GUILD_ID || "guild",
      playerId: player.id,
      kind: "DISCORD_MANUAL_LINK",
      status: "SENT",
      summary: `Unlinked SWGOH member ${player.currentName} from Discord ID ${oldDiscordId}.`,
    },
  });

  return true;
}
