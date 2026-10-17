import MembersOnly from "@/app/members-only";
import { canViewMembersArea } from "@/lib/member-gate";
import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
import DatacronsInteractive from "./datacrons-interactive";
import { getGuildDatacronVault } from "@/lib/datacrons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Datacrons · Guild Vault & Active Meta Codex · Blues Brothers",
  description:
    "Explore the Blues Brothers guild datacron inventory, active SWGOH seasonal datacron sets, Level 9 character perks, and Territory War squad synergies.",
  openGraph: {
    title: "Datacrons · Guild Vault & Meta Codex",
    description:
      "Full guild datacron inventory, active set abilities, Level 9 character super-weapons, and Territory War defense assignments.",
    images: ["/dataron-header.png"],
  },
};

export default async function DatacronsPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/datacrons" area="The datacron vault" />;
  const data = await getGuildDatacronVault();

  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Datacrons" title="Holocron power. Tactical advantage." intro="Track active SWGOH Datacron sets, review the guild's Level 9 character super-weapons and Level 6 faction boosts, and optimize squad pairings for Territory War victory." />

      <DatacronsInteractive initialData={data} />

      <HubLinks message="Active Datacron intelligence and guild inventory aggregated from player Comlink syncs.">
        <Link href="/territory-war">Open Territory War Command →</Link>
        <Link href="/arsenal">Review Guild Arsenal →</Link>
        <Link href="/">Back to Command Centre →</Link>
      </HubLinks>
    </HubPage>
  );
}
