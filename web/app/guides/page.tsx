import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import GuidesInteractive from "./guides-interactive";

export const metadata: Metadata = {
  title: "Field Guides & Simple Instructions · Blues Brothers",
  description:
    "Step-by-step field guides for Blues Brothers guild members: account linking, Territory War defence/attack checklists, Datacron optimization, and Dougie's Discs.",
  openGraph: {
    title: "Field Guides & Instructions · Blues Brothers",
    description: "Simple instructions for every mission. Star Wars Galaxy of Heroes guild command deck.",
    images: ["/ops-banner.webp"],
  },
};

export default function GuidesPage() {
  return (
    <main className="intel-shell destination-shell guides-page">
      <PageHero
        image="/ops-banner.webp"
        imageAlt="Holographic tactical data terminals in the Blues Brothers war room"
        eyebrow="Guild Knowledge Base · Field Manuals"
        title={
          <>
            Simple Instructions.<br />
            <em>For Every Mission.</em>
          </>
        }
        description="Clear, step-by-step instructions for linking your Discord account, executing Territory War orders, upgrading datacrons, and controlling cantina jukebox music."
        priority
      >
        <div className="guides-hero-shortcuts">
          <Link href="#account-linking" className="hero-shortcut-chip">⚡ Account Linking</Link>
          <Link href="#territory-war-orders" className="hero-shortcut-chip">⚔️ TW Battle Orders</Link>
          <Link href="#datacron-optimization" className="hero-shortcut-chip">💎 Datacron Upgrades</Link>
          <Link href="#dougies-discs-jukebox" className="hero-shortcut-chip">🎵 Dougie&apos;s Discs</Link>
          <Link href="#officer-discord-sync" className="hero-shortcut-chip">🛡️ Officer Sync</Link>
        </div>
      </PageHero>

      <GuidesInteractive />

      <IntelFooter message="Blues Brothers Guild Operations Field Manuals · Updated for active SWGOH seasons.">
        <Link href="/operations">Open Operations Deck →</Link>
        <Link href="/territory-war">Open Territory War →</Link>
      </IntelFooter>
    </main>
  );
}
