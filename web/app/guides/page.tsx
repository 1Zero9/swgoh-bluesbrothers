import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader } from "@/app/hub-page";
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
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Knowledge · Field guides" title="Simple instructions for every mission" intro="Step by step: linking your Discord account, Territory War orders, datacron upgrades and Dougie's Discs.">
        <Link className="hub-pagehead-link" href="/operations">Operations →</Link>
      </HubHeader>
      <GuidesInteractive />
    </HubPage>
  );
}
