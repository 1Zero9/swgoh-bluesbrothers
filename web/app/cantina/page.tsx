import type { Metadata } from "next";
import Link from "next/link";
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
      <header className="intel-header">
        <Link href="/" className="intel-back">← Guild command</Link>
        <nav aria-label="Related destinations"><Link href="/members">Members</Link><Link href="/operations">Operations</Link></nav>
      </header>
      <SoulFoodCafe recipes={recipes} />
      <footer className="intel-footer"><span>Recipes from the guild cantina databank.</span><Link href="/">Back to guild command →</Link></footer>
    </main>
  );
}
