import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
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
    <main className="intel-shell destination-shell dougies-discs-page">
      <PageHero
        image="/dougies-discs.png"
        imageAlt="Dougie's Discs tavern and vinyl speakeasy with aliens and live blues band"
        eyebrow="Dougie's Discs · Galactic Jukebox"
        title={
          <>
            Chicago Soul.<br />
            <em>Outer Rim Rhythm.</em>
          </>
        }
        description="The mission has music. Drop a credit into Dougie's Jukebox, spin timeless Blues Brothers classics and Chicago blues legends, or queue your own favourite YouTube record."
        priority
      />

      <DougiesJukebox initialDiscs={discs} />

      <footer className="intel-footer">
        <span>Curated vinyl and transmissions from Dougie&apos;s Speakeasy databank.</span>
        <div className="intel-footer-nav">
          <Link href="/cantina">Visit Soul Food Cantina →</Link>
          <Link href="/">Back to guild command →</Link>
        </div>
      </footer>
    </main>
  );
}
