import { cookies } from "next/headers";
import {
  LINK_COOKIE_NAME,
  MEMBER_COOKIE_NAME,
  verifyLinkCookieValue,
  verifyMemberCookieValue,
} from "@/lib/member-auth";
import { getPrisma } from "@/lib/prisma";
import { getWallOfShameStatus } from "@/lib/wall-of-shame";

export type MemberContext =
  | { status: "signed-out" }
  | { status: "linking"; discordUsername: string }
  | {
      status: "linked";
      player: {
        name: string;
        galacticPower: bigint;
        raidTickets: number;
        lastActivityAt: Date | null;
        onWallOfShame: boolean;
        reasons: string[];
      };
    };

export async function getMemberContext(): Promise<MemberContext> {
  const store = await cookies();

  const playerId = verifyMemberCookieValue(store.get(MEMBER_COOKIE_NAME)?.value);
  if (playerId) {
    try {
      const player = await getPrisma().player.findUnique({
        where: { id: playerId },
        include: { snapshots: { orderBy: { guildSnapshot: { capturedAt: "desc" } }, take: 1 } },
      });
      if (player) {
        const latest = player.snapshots[0];
        const reasons = await getWallOfShameStatus(playerId);
        return {
          status: "linked",
          player: {
            name: player.currentName,
            galacticPower: latest?.galacticPower ?? BigInt(0),
            raidTickets: latest?.raidTickets ?? 0,
            lastActivityAt: latest?.lastActivityAt ?? null,
            onWallOfShame: reasons.length > 0,
            reasons,
          },
        };
      }
    } catch {
      // fall through to signed-out
    }
  }

  const link = verifyLinkCookieValue(store.get(LINK_COOKIE_NAME)?.value);
  if (link) {
    return { status: "linking", discordUsername: link.username };
  }

  return { status: "signed-out" };
}
