import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
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
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Saved squads" title="Know the counter. Know who can run it." intro="Pick an enemy squad's leader and see the counters the guild trusts, whether you can run them, and who can. Anyone can add one." />
      <CountersClient
        aside={(
          <aside className="kb-side kb-ask-side" aria-label="Not on the list?">
            <h3>Not on the list?</h3>
            <p>Ask B-Lue3. He checks what the guild has saved first, then searches the web for current counters and checks them against your roster. He can sometimes get it wrong, so check in game before you commit a squad.</p>
            <Link className="kb-ask-link" href="/ask">Ask B-Lue3 →</Link>
            <Link className="kb-ask-more" href="/knowledge">Browse the counter knowledge base →</Link>
          </aside>
        )}
      />
    </HubPage>
  );
}
