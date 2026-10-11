import { cache } from "react";
import { cookies } from "next/headers";
import {
  LINK_COOKIE_NAME,
  MEMBER_COOKIE_NAME,
  verifyLinkCookieValue,
  verifyMemberCookieValue,
} from "@/lib/member-auth";
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
  discordUsername?: string;
  membershipState?: "ACTIVE" | "LEFT";
};

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

    const playerLookup = playerId
      ? getPrisma().player.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          currentName: true,
          discordUserId: true,
          membershipTerms: {
            orderBy: { joinedAt: "desc" },
            take: 1,
            select: { state: true, guildId: true },
          },
        },
      })
      : Promise.resolve(null);
    const [isOfficer, player] = await Promise.all([officerCheck, playerLookup]);

    {
      if (player && player.membershipTerms.length > 0) {
        const latestTerm = player.membershipTerms[0];
        const isActiveMember = latestTerm.state === "ACTIVE";

        if (isActiveMember) {
          return {
            role: isOfficer ? "OFFICER" : "MEMBER",
            isAuthorized: true,
            isOfficer,
            isMember: true,
            playerId: player.id,
            playerName: player.currentName,
            discordUserId: player.discordUserId ?? undefined,
            membershipState: "ACTIVE",
          };
        } else {
          // Member has LEFT the guild -> Revoked access
          return {
            role: isOfficer ? "OFFICER" : "PUBLIC",
            isAuthorized: isOfficer,
            isOfficer,
            isMember: false,
            playerId: player.id,
            playerName: player.currentName,
            discordUserId: player.discordUserId ?? undefined,
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
  } catch {
    return {
      role: "PUBLIC",
      isAuthorized: false,
      isOfficer: false,
      isMember: false,
    };
  }
});
