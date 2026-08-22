import type { Metadata } from "next";
import Link from "next/link";
import MemberDeparture from "@/app/member-departures";
import MemberDirectory from "@/app/member-directory";
import MemberWelcomeTicker from "@/app/member-welcome-ticker";
import PageHero from "@/app/page-hero";
import { getRosterChanges, getRosterMembers } from "@/lib/members";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Guild Members · Blues Brothers",
  description: "Search the Blues Brothers roster and open detailed member cards.",
};

export default async function MembersPage() {
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
    <main className="intel-shell destination-shell">
      <PageHero
        image="/members-banner.webp"
        imageAlt="The Blues Brothers among guild members inside a crowded desert cantina"
        eyebrow="Membership directory"
        title={<>Meet the whole band.<br /><em>One card at a time.</em></>}
        description="Search the live roster, compare the useful numbers and open any member for their detailed guild standing."
        priority
      >
        <div className="intel-summary">
          <div><strong>{members.length || "—"}</strong><small>active members</small></div>
          <div><strong>{newMembers.length || "—"}</strong><small>joined this month</small></div>
        </div>
      </PageHero>
      <MemberWelcomeTicker members={newMembers} />
      <MemberDirectory members={members} />
      <MemberDeparture members={departedMembers} />
      <footer className="intel-footer"><span>Roster data refreshes through the scheduled guild sync.</span><Link href="/territory-war">Open TW room →</Link></footer>
    </main>
  );
}
