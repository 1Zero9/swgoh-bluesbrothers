import { cookies } from "next/headers";
import { MEMBER_COOKIE_NAME, verifyMemberCookieValue } from "@/lib/member-auth";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getPrisma } from "@/lib/prisma";

const OFFICER_ROLES = new Set(["Officer", "Leader"]);

/**
 * True when the player is an active guild member whose latest in-game rank is
 * Officer or Leader. The game is the source of truth, so promoting or demoting
 * someone in-game changes their site access at the next guild sync.
 */
export async function isInGameOfficer(playerId: string) {
  try {
    const player = await getPrisma().player.findFirst({
      where: { id: playerId, membershipTerms: { some: { state: "ACTIVE" } } },
      select: {
        snapshots: {
          orderBy: { guildSnapshot: { capturedAt: "desc" } },
          take: 1,
          select: { memberRole: true },
        },
      },
    });
    return OFFICER_ROLES.has(player?.snapshots[0]?.memberRole ?? "");
  } catch {
    return false;
  }
}

/** Officer access: a signed-in member who is an in-game officer, or the legacy shared password session. */
export async function isOfficerRequest() {
  const store = await cookies();
  if (verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value)) return true;

  const playerId = verifyMemberCookieValue(store.get(MEMBER_COOKIE_NAME)?.value);
  return playerId ? isInGameOfficer(playerId) : false;
}
