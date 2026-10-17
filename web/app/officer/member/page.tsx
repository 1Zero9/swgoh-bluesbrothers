import type { Metadata } from "next";
import { after } from "next/server";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { cardsAreStale, listMembersForCards, refreshAllCards, type MemberListing } from "@/lib/player-card";
import MemberPicker from "./member-picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Member cards · Blues Brothers", robots: { index: false } };

export default async function MemberCardsPage() {
  const access = await getViewerAccess();
  if (!access.isOfficer) return <MembersOnly path="/officer/member" area="Member cards" />;
  let members: MemberListing[] = [];
  let newest: string | null = null;
  try {
    ({ members, newest } = await listMembersForCards());
    // Cards are kept in the database. When the newest is old (or there are none), rebuild them all after this page has been sent.
    if (members.length && cardsAreStale(newest)) after(() => refreshAllCards().catch(() => undefined));
  } catch { /* no roster yet */ }
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Member cards" intro="Pick a member to see everything about them on one card: how they are doing, and what they bring to the guild." />
      <MemberPicker members={members} newest={newest} />
    </HubPage>
  );
}
