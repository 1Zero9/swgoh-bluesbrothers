import { fetchGuildRoster } from "@/lib/comlink";
import { getDiscordUrl, postDiscordAnnouncement, removeDiscordMemberRole } from "@/lib/discord";
import { getPrisma } from "@/lib/prisma";

type PendingAnnouncement = {
  eventId: string;
  membershipId: string;
  kind: "MEMBER_WELCOME" | "MEMBER_DEPARTURE";
  playerName: string;
  discordUserId: string | null;
};

export async function syncGuildRoster() {
  const roster = await fetchGuildRoster();
  const prisma = getPrisma();
  const capturedAt = new Date();
  const existingSnapshots = await prisma.guildSnapshot.count({ where: { guildId: roster.guildId } });
  const isBaseline = existingSnapshots === 0;

  const announcements = await prisma.$transaction(async (tx) => {
    await tx.guild.upsert({
      where: { id: roster.guildId },
      update: { name: roster.name, discordGuildId: process.env.DISCORD_GUILD_ID || undefined },
      create: { id: roster.guildId, name: roster.name, discordGuildId: process.env.DISCORD_GUILD_ID || undefined },
    });

    const activeTerms = await tx.membershipTerm.findMany({
      where: { guildId: roster.guildId, state: "ACTIVE" },
      include: { player: true },
    });
    const activeByPlayer = new Map(activeTerms.map((term) => [term.playerId, term]));
    const currentIds = new Set(roster.members.map((member) => member.playerId));
    const pending: PendingAnnouncement[] = [];

    for (const member of roster.members) {
      const player = await tx.player.upsert({
        where: { id: member.playerId },
        update: { currentName: member.name },
        create: { id: member.playerId, currentName: member.name },
      });
      const latestName = await tx.playerName.findFirst({
        where: { playerId: member.playerId },
        orderBy: { lastSeen: "desc" },
      });
      if (latestName?.name === member.name) {
        await tx.playerName.update({ where: { id: latestName.id }, data: { lastSeen: capturedAt } });
      } else {
        await tx.playerName.create({
          data: { playerId: member.playerId, name: member.name, firstSeen: capturedAt, lastSeen: capturedAt },
        });
      }

      if (!activeByPlayer.has(member.playerId)) {
        const membership = await tx.membershipTerm.create({
          data: { guildId: roster.guildId, playerId: member.playerId, joinedAt: member.joinedAt },
        });
        if (!isBaseline) {
          const event = await tx.automationEvent.create({
            data: {
              guildId: roster.guildId,
              playerId: member.playerId,
              kind: "MEMBER_WELCOME",
              summary: `${member.name} joined the Blues Brothers. Welcome to the band!`,
            },
          });
          pending.push({ eventId: event.id, membershipId: membership.id, kind: "MEMBER_WELCOME", playerName: member.name, discordUserId: player.discordUserId });
        }
      }
    }

    for (const term of activeTerms) {
      if (currentIds.has(term.playerId)) continue;
      await tx.membershipTerm.update({ where: { id: term.id }, data: { state: "LEFT", leftAt: capturedAt } });
      const event = await tx.automationEvent.create({
        data: {
          guildId: roster.guildId,
          playerId: term.playerId,
          kind: "MEMBER_DEPARTURE",
          summary: `${term.player.currentName} has left the Blues Brothers. Their time with the guild remains in the archive.`,
        },
      });
      pending.push({ eventId: event.id, membershipId: term.id, kind: "MEMBER_DEPARTURE", playerName: term.player.currentName, discordUserId: term.player.discordUserId });
    }

    await tx.guildSnapshot.create({
      data: {
        guildId: roster.guildId,
        capturedAt,
        memberCount: roster.members.length,
        galacticPower: roster.members.reduce((sum, member) => sum + member.galacticPower, BigInt(0)),
        characterPower: roster.members.reduce((sum, member) => sum + member.characterPower, BigInt(0)),
        shipPower: roster.members.reduce((sum, member) => sum + member.shipPower, BigInt(0)),
        raidTickets: roster.members.reduce((sum, member) => sum + member.raidTickets, 0),
        members: {
          create: roster.members.map((member) => ({
            playerId: member.playerId,
            galacticPower: member.galacticPower,
            raidTickets: member.raidTickets,
            lastActivityAt: member.lastActivityAt,
          })),
        },
      },
    });

    if (isBaseline) {
      await tx.automationEvent.create({
        data: {
          guildId: roster.guildId,
          kind: "ROSTER_BASELINE",
          status: "SENT",
          summary: `${roster.members.length} members connected. Future joins and departures will be announced here and in Discord.`,
          sentAt: capturedAt,
        },
      });
    }
    return pending;
  });

  let delivered = 0;
  let accessRemoved = 0;
  for (const announcement of announcements) {
    try {
      const isWelcome = announcement.kind === "MEMBER_WELCOME";
      const posted = await postDiscordAnnouncement({
        title: isWelcome ? "New arrival at the cantina" : "Until the next gig",
        description: isWelcome
          ? `Welcome **${announcement.playerName}** to the Blues Brothers. The band just got stronger.`
          : `**${announcement.playerName}** has left the guild. Their membership history remains on the Guild Wire.`,
        color: isWelcome ? 0x3c83ff : 0xe49b4d,
        websiteUrl: process.env.SITE_URL,
      });
      const removed = !isWelcome && await removeDiscordMemberRole(announcement.discordUserId);
      if (posted) delivered += 1;
      if (removed) accessRemoved += 1;

      await prisma.$transaction([
        prisma.automationEvent.update({
          where: { id: announcement.eventId },
          data: {
            status: posted ? "SENT" : "PENDING",
            sentAt: posted ? new Date() : null,
            metadata: { discordPosted: posted, roleRemoved: removed, discordMapped: Boolean(announcement.discordUserId) },
          },
        }),
        prisma.membershipTerm.update({
          where: { id: announcement.membershipId },
          data: isWelcome
            ? { welcomeSentAt: posted ? new Date() : null }
            : { departureNotifiedAt: posted ? new Date() : null, discordAccessRemovedAt: removed ? new Date() : null },
        }),
      ]);
    } catch {
      await prisma.automationEvent.update({ where: { id: announcement.eventId }, data: { status: "FAILED" } });
    }
  }

  return {
    guild: roster.name,
    members: roster.members.length,
    baseline: isBaseline,
    joins: announcements.filter((item) => item.kind === "MEMBER_WELCOME").length,
    departures: announcements.filter((item) => item.kind === "MEMBER_DEPARTURE").length,
    discordDelivered: delivered,
    discordAccessRemoved: accessRemoved,
    discordUrl: getDiscordUrl(),
    capturedAt: capturedAt.toISOString(),
  };
}
