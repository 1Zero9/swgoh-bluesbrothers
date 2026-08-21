import { getPrisma } from "@/lib/prisma";

export type BeerPreference = "crisp" | "hoppy" | "malty" | "alcohol-free";

export type BeerPairing = {
  preference: BeerPreference;
  beer: string;
  style: string;
  reason: string;
};

export type SoulFoodRecipe = {
  id: string;
  slug: string;
  name: string;
  origin: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  beerPairings: BeerPairing[];
  tone: string;
};

const FALLBACK_RECIPES: SoulFoodRecipe[] = [
  {
    id: "recipe-pork-sandwich",
    slug: "pork-sandwich",
    name: "The Pork Sandwich",
    origin: "Maxwell Street · Chicago",
    description: "Juicy roast pork, melted provolone and sharp giardiniera on a jus-soaked roll.",
    ingredients: ["700g boneless pork shoulder", "4 soft sub rolls", "8 slices provolone", "120g hot giardiniera", "250ml light chicken stock", "2 garlic cloves", "1 tsp dried oregano", "Salt and black pepper"],
    instructions: ["Season the pork with garlic, oregano, salt and pepper, then roast at 160°C until tender enough to pull, about 3 hours.", "Rest the pork, slice or pull it, then warm it in the roasting juices loosened with the stock.", "Split and lightly toast the rolls. Layer in pork and provolone, then return to the oven just until the cheese softens.", "Spoon over a little jus, finish with giardiniera and serve immediately."],
    beerPairings: [
      { preference: "crisp", beer: "Chicago-style lager", style: "American lager", reason: "Cold, clean carbonation cuts through pork jus and melted provolone." },
      { preference: "hoppy", beer: "Citrus pale ale", style: "American pale ale", reason: "Citrus hops meet the heat and acidity of the giardiniera." },
      { preference: "malty", beer: "Vienna lager", style: "Amber lager", reason: "Toasty malt echoes the roast pork without making the sandwich feel heavier." },
      { preference: "alcohol-free", beer: "Alcohol-free pilsner", style: "0.0% pilsner", reason: "A dry, sparkling finish keeps the rich sandwich lively." },
    ],
    tone: "rust",
  },
  {
    id: "recipe-italian-beef",
    slug: "italian-beef",
    name: "Italian Beef",
    origin: "Chicago · USA",
    description: "Thinly sliced seasoned beef, sweet peppers and giardiniera in a dipped Italian roll.",
    ingredients: ["700g beef sirloin or topside", "4 Italian rolls", "2 green peppers", "120g giardiniera", "500ml beef stock", "1 tsp dried oregano", "1 tsp garlic powder", "Black pepper"],
    instructions: ["Rub the beef with oregano, garlic powder and pepper. Roast at 180°C to medium, then cool completely for thin slicing.", "Simmer the stock with the roasting juices. Add the sliced beef and warm gently without boiling.", "Sauté sliced peppers until soft and lightly browned.", "Dip each roll quickly in the jus, then pack with beef, peppers and giardiniera."],
    beerPairings: [
      { preference: "crisp", beer: "Helles lager", style: "Helles", reason: "Soft malt and brisk carbonation settle the peppery beef and jus." },
      { preference: "hoppy", beer: "West Coast pale ale", style: "Pale ale", reason: "Firm bitterness stands up to beef while citrus lifts the peppers." },
      { preference: "malty", beer: "American amber ale", style: "Amber ale", reason: "Caramel malt complements browned beef and sweet peppers." },
      { preference: "alcohol-free", beer: "Alcohol-free amber lager", style: "0.5% amber lager", reason: "Malt character supports the beef while staying refreshing." },
    ],
    tone: "amber",
  },
  {
    id: "recipe-cubano",
    slug: "cubano",
    name: "Cubano",
    origin: "Cuba · Miami",
    description: "A hot pressed sandwich of roast pork, ham, Swiss cheese, pickles and mustard.",
    ingredients: ["4 Cuban-style or soft white rolls", "300g sliced roast pork", "200g sliced ham", "8 slices Swiss cheese", "2 large dill pickles", "Yellow mustard", "Softened butter"],
    instructions: ["Split the rolls and spread mustard across both cut sides.", "Layer pork, ham, Swiss and thinly sliced pickles. Close and butter the outside of each roll.", "Press in a sandwich grill, or under a weighted frying pan, over medium heat.", "Cook until deeply crisp outside and the cheese has melted, then cut diagonally."],
    beerPairings: [
      { preference: "crisp", beer: "Cuban-style lager", style: "Pale lager", reason: "A light lager cools the mustard and pickle tang between rich bites." },
      { preference: "hoppy", beer: "Session IPA", style: "Session IPA", reason: "Aromatic hops brighten pork and ham without overpowering the pressed sandwich." },
      { preference: "malty", beer: "Vienna lager", style: "Vienna lager", reason: "Toasted malt mirrors the crisp pressed bread and roast pork." },
      { preference: "alcohol-free", beer: "Alcohol-free lager with lime", style: "0.0% pale lager", reason: "Bright citrus and carbonation balance the cheese and cured meats." },
    ],
    tone: "gold",
  },
  {
    id: "recipe-reuben",
    slug: "reuben",
    name: "Reuben",
    origin: "New York · USA",
    description: "Pastrami, Swiss cheese, sauerkraut and dressing griddled between slices of rye.",
    ingredients: ["8 slices rye bread", "400g sliced pastrami", "8 slices Swiss cheese", "200g sauerkraut", "4 tbsp Russian dressing", "Softened butter"],
    instructions: ["Drain and squeeze the sauerkraut so the sandwich stays crisp.", "Spread dressing on the inside of each bread slice. Layer Swiss, pastrami, sauerkraut and a second slice of Swiss.", "Butter the outside of the bread and griddle over medium-low heat.", "Turn once and cook until both sides are crisp and the cheese is fully melted."],
    beerPairings: [
      { preference: "crisp", beer: "Czech pilsner", style: "Pilsner", reason: "Snappy bitterness and carbonation cut pastrami, Swiss and dressing." },
      { preference: "hoppy", beer: "Rye IPA", style: "Rye IPA", reason: "Peppery rye malt joins the bread while hops reset the palate." },
      { preference: "malty", beer: "Dunkel", style: "Munich dunkel", reason: "Dark bread-like malt fits the rye and cured beef without stout-level weight." },
      { preference: "alcohol-free", beer: "Alcohol-free dark lager", style: "0.5% dark lager", reason: "Roasty malt complements rye while a dry finish handles the sauerkraut." },
    ],
    tone: "red",
  },
  {
    id: "recipe-banh-mi",
    slug: "banh-mi",
    name: "Bánh Mì",
    origin: "Vietnam",
    description: "A crisp baguette filled with savoury pork, pâté, quick pickles, cucumber and herbs.",
    ingredients: ["2 small crisp baguettes", "300g cooked pork belly or roast pork", "80g smooth pâté", "1 carrot", "100g daikon", "1 cucumber", "Rice vinegar and sugar", "Fresh coriander", "Mayonnaise and sliced chilli"],
    instructions: ["Julienne the carrot and daikon, then toss with rice vinegar, sugar and salt. Leave for at least 30 minutes.", "Warm and slice the pork. Split the baguettes and remove a little crumb if they are very dense.", "Spread with pâté and mayonnaise, then add pork, drained pickles and cucumber batons.", "Finish with coriander and chilli, keeping the baguette crisp."],
    beerPairings: [
      { preference: "crisp", beer: "Dry rice lager", style: "Rice lager", reason: "A very dry lager respects the herbs and pickles while refreshing after pork and pâté." },
      { preference: "hoppy", beer: "Session pale ale", style: "Session pale ale", reason: "Citrus hops work with coriander, chilli and bright pickles." },
      { preference: "malty", beer: "Saison", style: "Farmhouse ale", reason: "Peppery yeast and gentle grain bridge the baguette, herbs and savoury pork." },
      { preference: "alcohol-free", beer: "Alcohol-free wheat beer", style: "0.0% wheat beer", reason: "Soft citrus and lively bubbles complement the herbs and quick pickles." },
    ],
    tone: "green",
  },
  {
    id: "recipe-katsu-sando",
    slug: "katsu-sando",
    name: "Katsu Sando",
    origin: "Japan",
    description: "Crisp pork cutlet, shredded cabbage and tonkatsu sauce in soft milk bread.",
    ingredients: ["4 thick slices Japanese milk bread", "2 pork loin cutlets", "50g plain flour", "1 beaten egg", "100g panko crumbs", "Finely shredded cabbage", "Tonkatsu sauce", "Neutral oil and salt"],
    instructions: ["Flatten the cutlets evenly and season. Coat in flour, egg and then panko.", "Shallow-fry at 175°C until crisp and cooked through, then drain and rest briefly.", "Spread tonkatsu sauce on the bread and add a thin layer of cabbage.", "Add the cutlet, close, trim the crusts if desired and cut into neat fingers."],
    beerPairings: [
      { preference: "crisp", beer: "Japanese rice lager", style: "Rice lager", reason: "Clean, high carbonation keeps fried panko and sweet sauce in balance." },
      { preference: "hoppy", beer: "Japanese-style pale ale", style: "Pale ale", reason: "Gentle citrus hops sharpen cabbage and rich fried pork." },
      { preference: "malty", beer: "Kölsch", style: "Kölsch", reason: "Soft grain and a dry finish echo milk bread without competing with the katsu." },
      { preference: "alcohol-free", beer: "Alcohol-free Japanese lager", style: "0.0% rice lager", reason: "Light grain and crisp bubbles are ideal beside the fried cutlet." },
    ],
    tone: "rose",
  },
];

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

function beerPairings(value: unknown): BeerPairing[] | null {
  if (!Array.isArray(value)) return null;
  const valid = value.filter((item): item is BeerPairing => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const pairing = item as Partial<BeerPairing>;
    return ["crisp", "hoppy", "malty", "alcohol-free"].includes(String(pairing.preference))
      && typeof pairing.beer === "string"
      && typeof pairing.style === "string"
      && typeof pairing.reason === "string";
  });
  return valid.length ? valid : null;
}

export async function getSoulFoodRecipes(): Promise<SoulFoodRecipe[]> {
  if (!process.env.DATABASE_URL) return FALLBACK_RECIPES;

  try {
    const recipes = await getPrisma().recipe.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    const parsed = recipes.flatMap((recipe) => {
      const ingredients = stringArray(recipe.ingredients);
      const instructions = stringArray(recipe.instructions);
      const pairings = beerPairings(recipe.beerPairings);
      if (!ingredients || !instructions || !pairings) return [];
      return [{
        id: recipe.id,
        slug: recipe.slug,
        name: recipe.name,
        origin: recipe.origin,
        description: recipe.description,
        ingredients,
        instructions,
        beerPairings: pairings,
        tone: recipe.tone,
      }];
    });
    return parsed.length ? parsed : FALLBACK_RECIPES;
  } catch {
    return FALLBACK_RECIPES;
  }
}
