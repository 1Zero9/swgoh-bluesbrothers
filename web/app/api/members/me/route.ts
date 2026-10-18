import { getViewerAccess } from "@/lib/access-control";
import { countNotesAwaitingReview } from "@/lib/knowledge/notes-data";
import { getPrisma } from "@/lib/prisma";
import { isSiteAdmin } from "@/lib/site-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Who is looking? Lets statically cached pages (like the header) show the right sign-in state on the client. */
export async function GET() {
  const access = await getViewerAccess();
  const signedIn = access.isMember || access.isOfficer;
  // Officers see how many counters and tips are waiting for a check, as a badge in the menu.
  let reviewCount = 0;
  if (access.isOfficer) {
    try {
      const [counters, notes] = await Promise.all([getPrisma().kbMatchup.count({ where: { status: { in: ["CANDIDATE", "DISPUTED"] } } }), countNotesAwaitingReview()]);
      reviewCount = counters + notes;
    } catch { /* no badge if the count can't be read */ }
  }
  return Response.json(
    {
      linked: access.isMember,
      signedIn,
      role: access.isOfficer ? "OFFICER" : access.isMember ? "MEMBER" : "PUBLIC",
      name: access.playerName ?? null,
      reviewCount,
      isAdmin: isSiteAdmin(access),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
