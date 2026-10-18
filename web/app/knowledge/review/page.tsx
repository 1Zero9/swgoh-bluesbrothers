import type { Metadata } from "next";
import Link from "next/link";
import MembersOnly from "@/app/members-only";
import HubPage, { HubHeader } from "@/app/hub-page";
import { getViewerAccess } from "@/lib/access-control";
import { canReview } from "@/lib/knowledge/permissions";
import { allUnitNames } from "@/lib/wins";
import ImportSavedButton from "./import-saved-button";
import ImportStarterButton from "./import-starter-button";
import ReviewClient from "./review-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review counters · Blues Brothers", robots: { index: false } };

export default async function ReviewPage() {
  const access = await getViewerAccess();
  if (!canReview(access)) return <MembersOnly path="/knowledge/review" area="The counter review queue" />;
  const names = Object.fromEntries(allUnitNames().map((unit) => [unit.id, unit.name]));
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Check it. Then publish it." intro="Counters from members and B-Lue3 wait here. Read the sources, then publish, reject or flag. Nothing goes live without you.">
        <Link className="hub-pagehead-link" href="/knowledge">← Knowledge</Link>
      </HubHeader>
      <ImportSavedButton />
      <ImportStarterButton />
      <ReviewClient names={names} />
    </HubPage>
  );
}
