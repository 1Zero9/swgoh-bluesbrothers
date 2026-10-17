import MembersOnly from "@/app/members-only";
import { canViewMembersArea } from "@/lib/member-gate";
import type { Metadata } from "next";
import Link from "next/link";
import MemberDeparture from "@/app/member-departures";
import MemberDirectory from "@/app/member-directory";
import MemberWelcomeTicker from "@/app/member-welcome-ticker";
import HubPage, { HubHeader } from "@/app/hub-page";
import WhoHas from "./who-has";
import { getRosterChanges, getRosterMembers } from "@/lib/members";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Guild Members · Blues Brothers",
  description: "Search the Blues Brothers roster and open detailed member cards.",
};

export default async function MembersPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/members" area="The member roster" />;
  const [roster, changes] = await Promise.all([getRosterMembers(), getRosterChanges()]);
  const members = roster.map((member) => ({
    ...member,
    galacticPower: member.galacticPower.toString(),
    characterPower: member.characterPower.toString(),
    shipPower: member.shipPower.toString(),
    lastActivityAt: member.lastActivityAt?.toISOString() ?? null,
    joinedAt: member.joinedAt?.toISOString() ?? null,
    profileSyncedAt: member.profileSyncedAt?.toISOString() ?? null,
  }));
  const newMembers = changes.newMembers.map((member) => ({
    ...member,
    joinedAt: member.joinedAt.toISOString(),
    galacticPower: member.galacticPower?.toString() ?? null,
  }));
  const departedMembers = changes.departedMembers.map((member) => ({
    ...member,
    joinedAt: member.joinedAt.toISOString(),
    leftAt: member.leftAt.toISOString(),
  }));

  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Roster" title="Meet the whole band" intro="Search the live roster, find who has a unit, and open any member for their guild standing.">
        <span className="hub-pagehead-stat"><strong>{members.length || "—"}</strong> active</span>
        <span className="hub-pagehead-stat"><strong>{newMembers.length || "0"}</strong> joined this month</span>
        <Link className="hub-pagehead-link" href="/territory-war">TW room →</Link>
      </HubHeader>
      <WhoHas />
      <MemberWelcomeTicker members={newMembers} />
      <MemberDirectory members={members} />
      <MemberDeparture members={departedMembers} />
    </HubPage>
  );
}
