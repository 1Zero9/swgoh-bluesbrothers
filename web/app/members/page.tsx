import type { Metadata } from "next";
import Link from "next/link";
import MemberDirectory from "@/app/member-directory";
import PageHero from "@/app/page-hero";
import { getRosterMembers } from "@/lib/members";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Guild Members · Blues Brothers",
  description: "Search the Blues Brothers roster and open detailed member cards.",
};

export default async function MembersPage() {
  const roster = await getRosterMembers();
  const members = roster.map((member) => ({
    ...member,
    galacticPower: member.galacticPower.toString(),
    characterPower: member.characterPower.toString(),
    shipPower: member.shipPower.toString(),
    lastActivityAt: member.lastActivityAt?.toISOString() ?? null,
    joinedAt: member.joinedAt?.toISOString() ?? null,
    profileSyncedAt: member.profileSyncedAt?.toISOString() ?? null,
  }));

  return (
    <main className="intel-shell destination-shell">
      <header className="intel-header">
        <Link href="/" className="intel-back">← Guild command</Link>
        <nav aria-label="Related destinations"><Link href="/operations">Operations</Link><Link href="/cantina">Cantina</Link></nav>
      </header>
      <PageHero
        image="/members-banner.png"
        imageAlt="The Blues Brothers among guild members inside a crowded desert cantina"
        eyebrow="Membership directory"
        title={<>Meet the whole band.<br /><em>One card at a time.</em></>}
        description="Search the live roster, compare the useful numbers and open any member for their detailed guild standing."
        priority
      >
        <div className="intel-summary"><div><strong>{members.length || "—"}</strong><small>active members</small></div></div>
      </PageHero>
      <MemberDirectory members={members} />
      <footer className="intel-footer"><span>Roster data refreshes through the scheduled guild sync.</span><Link href="/territory-war">Open TW room →</Link></footer>
    </main>
  );
}
