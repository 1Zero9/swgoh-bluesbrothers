import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { getStoredCard, type StoredCard } from "@/lib/player-card";
import MemberCard from "./member-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Member card · Blues Brothers", robots: { index: false } };

export default async function MemberCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await getViewerAccess();
  if (!access.isOfficer) return <MembersOnly path={`/officer/member/${id}`} area="Member cards" />;
  let stored: StoredCard | null = null;
  try { stored = await getStoredCard(id); } catch { /* shown as not found below */ }
  const card = stored?.card ?? null;
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title={card ? card.name : "Member card"} intro={card ? undefined : "We could not find that member in the current roster."}>
        <Link className="hub-pagehead-link" href="/officer/member">← All members</Link>
      </HubHeader>
      {stored ? <MemberCard card={stored.card} capturedAt={stored.capturedAt} fromCache={stored.fromCache} history={stored.history} /> : null}
    </HubPage>
  );
}
