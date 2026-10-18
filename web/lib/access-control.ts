import { cache } from "react";
import { cookies } from "next/headers";
import {
  LINK_COOKIE_NAME,
  MEMBER_COOKIE_NAME,
  verifyLinkCookieValue,
  verifyMemberCookieValue,
} from "@/lib/member-auth";
import { whenDatabaseDown, type Remembered } from "@/lib/access-fallback";
import { isOfficerRequest } from "@/lib/officer-session";
import { getPrisma } from "@/lib/prisma";

export type ViewerRole = "LEADER" | "OFFICER" | "MEMBER" | "PUBLIC";

export type ViewerAccess = {
  role: ViewerRole;
  isAuthorized: boolean;
  isOfficer: boolean;
  isMember: boolean;
  playerId?: string;
  playerName?: string;
  discordUserId?: string;
  /** Every Discord account linked to this member (the main one and any extra ones). */
  discordUserIds?: string[];
  discordUsername?: string;
  membershipState?: "ACTIVE" | "LEFT";
};

/** The last good lookup per member, so a database hiccup can't sign a member out. Lives only in this server instance's memory. */
const remembered = new Map<string, Remembered>();
const DOWN = Symbol("database down");
/** A member looked up in the last 30 seconds is not looked up again: every page and heartbeat asks "who is this?", and the database has a low connection limit. */
const FRESH_MS = 30_000;

/** Looks a member up, trying twice, and says DOWN (not "nobody") when the database can't be reached. */
async function lookupPlayer(playerId: string) {
  const find = () => getPrisma().player.findUnique({
    where: { id: playerId },
    select: { id: true, currentName: true, discordUserId: true, extraDiscordAccounts: { select: { discordUserId: true } }, membershipTerms: { orderBy: { joinedAt: "desc" }, take: 1, select: { state: true, guildId: true } } },
  });
  try {
    return await find();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      return await find();
    } catch (error) {
      console.error("access: member lookup failed, keeping the member signed in", error instanceof Error ? error.message : "unknown");
      return DOWN;
    }
  }
}

/**
 * Resolves the viewer's current access level across the site.
 *
 * - LEADER / OFFICER: Has verified officer session (cookie) or officer-level access.
 * - MEMBER: Has verified member session linked to an ACTIVE SWGOH guild membership.
 * - PUBLIC: Unauthenticated visitor, unlinked Discord user, or ex-member whose membership is LEFT.
 */
export const getViewerAccess = cache(async (): Promise<ViewerAccess> => {
  try {
    const store = await cookies();

    // 1. Officer status (starts now, so it runs alongside the member lookup)
    const officerCheck = isOfficerRequest();

    // 2. Check Member status
    const memberCookie = store.get(MEMBER_COOKIE_NAME)?.value;
    const playerId = verifyMemberCookieValue(memberCookie);

    const recent = playerId ? remembered.get(playerId) : undefined;
    if (playerId && recent && Date.now() - recent.at < FRESH_MS) {
      const officer = await officerCheck;
      return { ...recent.access, role: officer ? "OFFICER" : "MEMBER", isAuthorized: true, isOfficer: officer, isMember: true };
    }
    const playerLookup = playerId ? lookupPlayer(playerId) : Promise.resolve(null);
    const [isOfficer, player] = await Promise.all([officerCheck, playerLookup]);

    // The database could not be reached: stay signed in as the member the cookie says they are.
    if (player === DOWN && playerId) return whenDatabaseDown(playerId, isOfficer, remembered.get(playerId));
    const found = player === DOWN ? null : player;

    {
      if (found && found.membershipTerms.length > 0) {
        const latestTerm = found.membershipTerms[0];
        const isActiveMember = latestTerm.state === "ACTIVE";

        if (isActiveMember) {
          const result: ViewerAccess = {
            role: isOfficer ? "OFFICER" : "MEMBER",
            isAuthorized: true,
            isOfficer,
            isMember: true,
            playerId: found.id,
            playerName: found.currentName,
            discordUserId: found.discordUserId ?? undefined,
            discordUserIds: [found.discordUserId, ...found.extraDiscordAccounts.map((account) => account.discordUserId)].filter((id): id is string => Boolean(id)),
            membershipState: "ACTIVE",
          };
          remembered.set(found.id, { access: result, at: Date.now() });
          return result;
        } else {
          // Member has LEFT the guild -> Revoked access
          return {
            role: isOfficer ? "OFFICER" : "PUBLIC",
            isAuthorized: isOfficer,
            isOfficer,
            isMember: false,
            playerId: found.id,
            playerName: found.currentName,
            discordUserId: found.discordUserId ?? undefined,
            membershipState: "LEFT",
          };
        }
      }
    }

    // 3. Check Discord linking cookie (pending ally code verification)
    const linkCookie = store.get(LINK_COOKIE_NAME)?.value;
    const link = verifyLinkCookieValue(linkCookie);

    if (isOfficer) {
      return {
        role: "OFFICER",
        isAuthorized: true,
        isOfficer: true,
        isMember: false,
        discordUsername: link?.username,
        discordUserId: link?.discordUserId,
      };
    }

    return {
      role: "PUBLIC",
      isAuthorized: false,
      isOfficer: false,
      isMember: false,
      discordUsername: link?.username,
      discordUserId: link?.discordUserId,
    };
  } catch (error) {
    console.error("access: could not work out who is looking", error instanceof Error ? error.message : "unknown");
    return {
      role: "PUBLIC",
      isAuthorized: false,
      isOfficer: false,
      isMember: false,
    };
  }
});
