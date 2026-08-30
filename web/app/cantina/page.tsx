import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import SoulFoodCafe from "@/app/soul-food-cafe";
import { getSoulFoodRecipes } from "@/lib/recipes";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Soul Food Cantina · Blues Brothers",
  description: "Galactic sandwich recipes, beer pairings and community submissions.",
};

export default async function CantinaPage() {
  const recipes = await getSoulFoodRecipes();
  return (
    <main className="intel-shell destination-shell cantina-page">
      <PageHero
        image="/cantin-bannera.webp"
        imageAlt="The Blues Brothers sampling food at a bustling galactic market cantina"
        eyebrow="Soul Food Cantina"
        title={<>Good food.<br /><em>Across the galaxy.</em></>}
        description="Galactic sandwich recipes, tap-droid beer pairings and community specials from Chicago to the Outer Rim."
        priority
      />
      <SoulFoodCafe recipes={recipes} />
      <IntelFooter message="Recipes from the guild cantina databank.">
        <Link href="/dougies-discs">Drop in at Dougie&apos;s Discs Jukebox →</Link>
        <Link href="/">Back to guild command →</Link>
      </IntelFooter>
    </main>
  );
}
