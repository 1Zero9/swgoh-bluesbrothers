import { getViewerAccess } from "@/lib/access-control";
import { countNotesAwaitingReview } from "@/lib/knowledge/notes-data";
import { getPrisma } from "@/lib/prisma";
import { isSiteAdmin } from "@/lib/site-admin";
import { BUILD_ID, SITE_VERSION } from "@/lib/version";

const countCache: { at: number; value: number } = { at: 0, value: 0 };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Who is looking? Lets statically cached pages (like the header) show the right sign-in state on the client. */
export async function GET() {
  const access = await getViewerAccess();
  const signedIn = access.isMember || access.isOfficer;
  // Officers see how many counters and tips are waiting for a check, as a badge in the menu.
  let reviewCount = 0;
  if (access.isOfficer) {
    // Counted at most once a minute per server instance, because every page an officer opens asks for it.
    if (Date.now() - countCache.at < 60_000) reviewCount = countCache.value;
    else {
      try {
        const [counters, notes] = await Promise.all([getPrisma().kbMatchup.count({ where: { status: { in: ["CANDIDATE", "DISPUTED"] } } }), countNotesAwaitingReview()]);
        reviewCount = counters + notes;
        countCache.at = Date.now();
        countCache.value = reviewCount;
      } catch { /* no badge if the count can't be read */ }
    }
  }
  return Response.json(
    {
      linked: access.isMember,
      signedIn,
      role: access.isOfficer ? "OFFICER" : access.isMember ? "MEMBER" : "PUBLIC",
      name: access.playerName ?? null,
      reviewCount,
      isAdmin: isSiteAdmin(access),
      // An officer who came in with the shared password has no player, so no My page and no admin tools until they sign in with Discord.
      needsDiscord: access.isOfficer && !access.playerId,
      ...(isSiteAdmin(access) ? { version: SITE_VERSION, build: BUILD_ID } : {}),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
