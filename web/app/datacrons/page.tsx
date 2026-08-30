import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import DatacronsInteractive from "./datacrons-interactive";
import { getGuildDatacronVault } from "@/lib/datacrons";

export const revalidate = 300;

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
  const data = await getGuildDatacronVault();

  return (
    <main className="intel-shell destination-shell datacrons-page">
      <PageHero
        image="/dataron-header.png"
        imageAlt="The Blues Brothers examining glowing holographic datacrons with a technician in a galactic workshop"
        eyebrow="Datacrons · Guild Vault &amp; Active Meta Codex"
        title={
          <>
            Holocron Power.<br />
            <em>Tactical Advantage.</em>
          </>
        }
        description="Track active SWGOH Datacron sets, review the guild's Level 9 character super-weapons and Level 6 faction boosts, and optimize squad pairings for Territory War victory."
        priority
      />

      <DatacronsInteractive initialData={data} />

      <IntelFooter message="Active Datacron intelligence and guild inventory aggregated from player Comlink syncs.">
        <Link href="/territory-war">Open Territory War Command →</Link>
        <Link href="/arsenal">Review Guild Arsenal →</Link>
        <Link href="/">Back to Command Centre →</Link>
      </IntelFooter>
    </main>
  );
}
