import type { Metadata } from "next";
import IntelFooter from "@/app/intel-footer";
import MembersOnly from "@/app/members-only";
import PageHero from "@/app/page-hero";
import { canViewMembersArea } from "@/lib/member-gate";
import CountersClient from "./counters-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Counters · Blues Brothers",
  description: "Counter squads the guild has found for Territory War and GAC, and who can run them.",
};

export default async function CountersPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/counters" area="The counters library" />;
  return (
    <main className="intel-shell destination-shell">
      <PageHero
        image="/tw-banner.webp"
        imageAlt="The Blues Brothers planning a Territory War"
        eyebrow="Territory War and GAC"
        title={<>Know the counter.<br /><em>Know who can run it.</em></>}
        description="Pick an enemy squad's leader and see the counters the guild trusts, whether you can run them, and who can. Anyone can add one."
        priority
      />
      <section className="public-block">
        <CountersClient />
      </section>
      <IntelFooter message="Counters are added by guild members. Try one before you rely on it." />
    </main>
  );
}
