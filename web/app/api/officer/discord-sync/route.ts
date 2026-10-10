import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import {
  linkPlayerToDiscord,
  linkExtraDiscordAccount,
  unlinkExtraDiscordAccount,
  unlinkPlayerFromDiscord,
  demoteDiscordMemberToPublic,
  fetchDiscordGuildMembers,
  getDiscordSyncReport,
} from "@/lib/discord-sync";
import { selectBulkLinkCandidates } from "@/lib/discord-link-match";
import { addDiscordRole, removeDiscordMemberRole } from "@/lib/discord";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const store = await cookies();
  const isOfficer = verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);

  if (!isOfficer) {
    return NextResponse.json({ ok: false, error: "Unauthorized officer session required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: "link" | "unlink" | "reconcile_roles" | "demote_user" | "bulk_link_exact" | "link_extra" | "unlink_extra";
    playerId?: string;
    discordUserId?: string;
  } | null;

  if (!body?.action) {
    return NextResponse.json({ ok: false, error: "Missing action." }, { status: 400 });
  }

  try {
    if (body.action === "link") {
      if (!body.playerId || !body.discordUserId) {
        return NextResponse.json({ ok: false, error: "playerId and discordUserId are required for linking." }, { status: 400 });
      }
      const success = await linkPlayerToDiscord(body.playerId, body.discordUserId);
      return NextResponse.json({ ok: success });
    }

    if (body.action === "bulk_link_exact") {
      // Recomputed from a fresh report so the client can't link anything we wouldn't suggest.
      const report = await getDiscordSyncReport();
      const candidates = selectBulkLinkCandidates(report.activePlayers);
      let linked = 0;
      for (const candidate of candidates) {
        if (await linkPlayerToDiscord(candidate.playerId, candidate.discordUserId).catch(() => false)) linked += 1;
      }
      return NextResponse.json({ ok: true, linked, attempted: candidates.length });
    }

    if (body.action === "link_extra") {
      if (!body.playerId || !body.discordUserId) {
        return NextResponse.json({ ok: false, error: "playerId and discordUserId are required." }, { status: 400 });
      }
      return NextResponse.json({ ok: await linkExtraDiscordAccount(body.playerId, body.discordUserId) });
    }

    if (body.action === "unlink_extra") {
      if (!body.discordUserId) {
        return NextResponse.json({ ok: false, error: "discordUserId is required." }, { status: 400 });
      }
      return NextResponse.json({ ok: await unlinkExtraDiscordAccount(body.discordUserId) });
    }

    if (body.action === "unlink") {
      if (!body.playerId) {
        return NextResponse.json({ ok: false, error: "playerId is required for unlinking." }, { status: 400 });
      }
      const success = await unlinkPlayerFromDiscord(body.playerId);
      return NextResponse.json({ ok: success });
    }

    if (body.action === "demote_user") {
      if (!body.discordUserId) {
        return NextResponse.json({ ok: false, error: "discordUserId is required." }, { status: 400 });
      }
      const res = await demoteDiscordMemberToPublic(body.discordUserId);
      return NextResponse.json({ ok: true, ...res });
    }

    if (body.action === "reconcile_roles") {
      const report = await getDiscordSyncReport();
      const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;
      const publicRoleId = process.env.DISCORD_PUBLIC_ROLE_ID;

      let demotedCount = 0;
      let promotedCount = 0;

      // 1. Demote departed members who hold member role
      for (const departed of report.departedWithMemberRole) {
        await demoteDiscordMemberToPublic(departed.id);
        demotedCount += 1;
      }

      // 2. Ensure all active linked players have the member role
      if (memberRoleId) {
        for (const player of report.activePlayers) {
          for (const account of [player.linkedDiscordUser, ...player.extraDiscordUsers]) {
            if (account && !account.roles.includes(memberRoleId)) {
              await addDiscordRole(account.id, memberRoleId);
              promotedCount += 1;
            }
          }
        }
      }

      // Record audit event
      const prisma = getPrisma();
      await prisma.automationEvent.create({
        data: {
          guildId: process.env.SWGOH_GUILD_ID || "guild",
          kind: "DISCORD_ROLE_RECONCILE",
          status: "SENT",
          summary: `Reconciled Discord roles: demoted ${demotedCount} ex-members to Public role, verified member roles for active crew.`,
        },
      });

      return NextResponse.json({
        ok: true,
        demotedCount,
        promotedCount,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error executing Discord action.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
