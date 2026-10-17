import type { Metadata } from "next";
import MembersOnly from "@/app/members-only";
import HubPage, { HubHeader } from "@/app/hub-page";
import { getViewerAccess } from "@/lib/access-control";
import { getAnnouncement } from "@/lib/announcement-data";
import AnnouncementEditor from "./editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Announcement · Blues Brothers", robots: { index: false } };

export default async function AnnouncementPage() {
  const access = await getViewerAccess();
  if (!access.isOfficer) return <MembersOnly path="/officer/announcement" area="The announcement editor" />;
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Announcement" intro="The pop-up members see on their first visit of a session." />
      <AnnouncementEditor initial={await getAnnouncement()} />
    </HubPage>
  );
}
