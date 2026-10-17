import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { getPlayerCard, type PlayerCard } from "@/lib/player-card";
import MemberCard from "./member-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Member card · Blues Brothers", robots: { index: false } };

export default async function MemberCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await getViewerAccess();
  if (!access.isOfficer) return <MembersOnly path={`/officer/member/${id}`} area="Member cards" />;
  let card: PlayerCard | null = null;
  try { card = await getPlayerCard(id); } catch { /* shown as not found below */ }
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title={card ? card.name : "Member card"} intro={card ? undefined : "We could not find that member in the current roster."}>
        <Link className="hub-pagehead-link" href="/officer/member">← All members</Link>
      </HubHeader>
      {card ? <MemberCard card={card} /> : null}
    </HubPage>
  );
}
