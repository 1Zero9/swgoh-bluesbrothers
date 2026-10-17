import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
import DougiesJukebox from "./dougies-jukebox";
import { getDiscsCatalog } from "@/lib/discs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Dougie's Discs · Galactic Blues Jukebox · Blues Brothers",
  description:
    "An Outer Rim speakeasy jukebox loaded with Blues Brothers showstoppers, Chicago blues legends, Stax soul anthems, and member submissions.",
  openGraph: {
    title: "Dougie's Discs · Blues Brothers Jukebox",
    description:
      "Drop a credit and spin authentic Chicago blues, soul classics, and Blues Brothers anthems on the interactive galactic jukebox.",
    images: ["/dougies-discs.png"],
  },
};

export default async function DougiesDiscsPage() {
  const discs = await getDiscsCatalog();

  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Dougie's Discs · Galactic Jukebox" title="Chicago soul. Outer Rim rhythm." intro="The mission has music. Drop a credit into Dougie's Jukebox, spin timeless Blues Brothers classics and Chicago blues legends, or queue your own favourite YouTube record." />

      <DougiesJukebox initialDiscs={discs} />

      <HubLinks message="Curated vinyl and transmissions from Dougie's Speakeasy databank.">
        <Link href="/cantina">Visit Soul Food Cantina →</Link>
        <Link href="/">Back to Home →</Link>
      </HubLinks>
    </HubPage>
  );
}
