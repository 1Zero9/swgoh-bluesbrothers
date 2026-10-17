import type { Metadata } from "next";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { listMembersForCards, type MemberListing } from "@/lib/player-card";
import MemberPicker from "./member-picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Member cards · Blues Brothers", robots: { index: false } };

export default async function MemberCardsPage() {
  const access = await getViewerAccess();
  if (!access.isOfficer) return <MembersOnly path="/officer/member" area="Member cards" />;
  let members: MemberListing[] = [];
  try { members = await listMembersForCards(); } catch { /* no roster yet */ }
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Member cards" intro="Pick a member to see everything about them on one card: how they are doing, and what they bring to the guild." />
      <MemberPicker members={members} />
    </HubPage>
  );
}
