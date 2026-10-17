import type { Metadata } from "next";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { listFeedback, type FeedbackListing } from "@/lib/feedback-data";
import { canViewMembersArea } from "@/lib/member-gate";
import FeedbackBoard from "./feedback-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Feedback · Blues Brothers", description: "Ask for features, report problems and see what is done.", robots: { index: false } };

export default async function FeedbackPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/feedback" area="The guild feedback board" />;
  const access = await getViewerAccess();
  let items: FeedbackListing[] = [];
  try { items = await listFeedback(access.playerId ?? null); } catch { /* table not ready yet: show an empty board */ }
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Feedback" title="What we want next" intro="Ask for a feature, say what you think, or report something broken. Everyone in the guild can see this list, tap +1 on what you want too, and an officer ticks things off as they are done." />
      <FeedbackBoard initial={items} isOfficer={access.isOfficer} canPost={Boolean(access.playerId)} />
    </HubPage>
  );
}
