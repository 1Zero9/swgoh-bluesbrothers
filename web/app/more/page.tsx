import type { Metadata } from "next";
import { MoreView } from "@/app/hub-views";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { getDiscordUrl } from "@/lib/discord";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "More · Blues Brothers",
  description: "Your account, notifications and the off-duty corner.",
};

export default async function MorePage() {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return <MembersOnly path="/more" area="This page" />;
  return <MoreView isOfficer={access.isOfficer} discordUrl={getDiscordUrl()} />;
}
