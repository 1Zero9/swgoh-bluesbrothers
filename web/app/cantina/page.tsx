import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import SoulFoodCafe from "@/app/soul-food-cafe";
import { getSoulFoodRecipes } from "@/lib/recipes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Soul Food Cantina · Blues Brothers",
  description: "Galactic sandwich recipes, beer pairings and community submissions.",
};

export default async function CantinaPage() {
  const recipes = await getSoulFoodRecipes();
  return (
    <main className="intel-shell destination-shell cantina-page">
      <PageHero
        image="/cantin-bannera.png"
        imageAlt="The Blues Brothers sampling food at a bustling galactic market cantina"
        eyebrow="Soul Food Cantina"
        title={<>Good food.<br /><em>Across the galaxy.</em></>}
        description="Galactic sandwich recipes, tap-droid beer pairings and community specials from Chicago to the Outer Rim."
        priority
      />
      <SoulFoodCafe recipes={recipes} />
      <footer className="intel-footer"><span>Recipes from the guild cantina databank.</span><Link href="/">Back to guild command →</Link></footer>
    </main>
  );
}
