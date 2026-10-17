import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
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
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Soul Food Cantina" title="Good food. Across the galaxy." intro="Galactic sandwich recipes, tap-droid beer pairings and community specials from Chicago to the Outer Rim." />
      <SoulFoodCafe recipes={recipes} />
      <HubLinks message="Recipes from the guild cantina databank.">
        <Link href="/dougies-discs">Drop in at Dougie&apos;s Discs Jukebox →</Link>
        <Link href="/">Back to Home →</Link>
      </HubLinks>
    </HubPage>
  );
}
