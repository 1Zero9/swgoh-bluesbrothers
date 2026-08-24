import { cookies } from "next/headers";
import { MEMBER_COOKIE_NAME, verifyMemberCookieValue } from "@/lib/member-auth";
import { getPrisma } from "@/lib/prisma";

/**
 * Best-effort officer attribution for the Territory War command tool.
 *
 * The officer area is gated by a single shared site password (lib/officer-auth.ts)
 * with no per-officer identity of its own. If the visiting officer also has a
 * linked member session (lib/member-auth.ts, from the Discord account-link flow)
 * we resolve their real player name and use that for `createdBy`/`updatedBy`
 * attribution. Otherwise we fall back to a generic label so plan writes are
 * never blocked on attribution being available.
 */
export async function getOfficerIdentity(): Promise<string> {
  try {
    const store = await cookies();
    const playerId = verifyMemberCookieValue(store.get(MEMBER_COOKIE_NAME)?.value);
    if (!playerId) return "Officer";

    const player = await getPrisma().player.findUnique({
      where: { id: playerId },
      select: { currentName: true },
    });
    return player?.currentName ?? "Officer";
  } catch {
    return "Officer";
  }
}
