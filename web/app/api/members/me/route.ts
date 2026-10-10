import { getViewerAccess } from "@/lib/access-control";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Who is looking? Lets statically cached pages (like the header) show the right sign-in state on the client. */
export async function GET() {
  const access = await getViewerAccess();
  const signedIn = access.isMember || access.isOfficer;
  return Response.json(
    {
      linked: access.isMember,
      signedIn,
      role: access.isOfficer ? "OFFICER" : access.isMember ? "MEMBER" : "PUBLIC",
      name: access.playerName ?? null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
