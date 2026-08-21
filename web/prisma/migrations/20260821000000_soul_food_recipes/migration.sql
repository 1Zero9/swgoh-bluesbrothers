CREATE TYPE "RecipeSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "Recipe" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ingredients" JSONB NOT NULL,
  "instructions" JSONB NOT NULL,
  "beerPairings" JSONB NOT NULL,
  "tone" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecipeSubmission" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "origin" TEXT,
  "bread" TEXT NOT NULL,
  "filling" TEXT NOT NULL,
  "toppings" TEXT NOT NULL,
  "instructions" TEXT NOT NULL,
  "beerSuggestion" TEXT,
  "submitterName" TEXT,
  "notes" TEXT,
  "status" "RecipeSubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecipeSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");
CREATE INDEX "Recipe_isPublished_sortOrder_idx" ON "Recipe"("isPublished", "sortOrder");
CREATE INDEX "RecipeSubmission_status_createdAt_idx" ON "RecipeSubmission"("status", "createdAt");

INSERT INTO "Recipe" ("id", "slug", "name", "origin", "description", "ingredients", "instructions", "beerPairings", "tone", "sortOrder") VALUES
(
  'recipe-pork-sandwich', 'pork-sandwich', 'The Pork Sandwich', 'Maxwell Street · Chicago',
  'Juicy roast pork, melted provolone and sharp giardiniera on a jus-soaked roll.',
  '["700g boneless pork shoulder", "4 soft sub rolls", "8 slices provolone", "120g hot giardiniera", "250ml light chicken stock", "2 garlic cloves", "1 tsp dried oregano", "Salt and black pepper"]'::jsonb,
  '["Season the pork with garlic, oregano, salt and pepper, then roast at 160°C until tender enough to pull, about 3 hours.", "Rest the pork, slice or pull it, then warm it in the roasting juices loosened with the stock.", "Split and lightly toast the rolls. Layer in pork and provolone, then return to the oven just until the cheese softens.", "Spoon over a little jus, finish with giardiniera and serve immediately."]'::jsonb,
  '[{"preference":"crisp","beer":"Chicago-style lager","style":"American lager","reason":"Cold, clean carbonation cuts through pork jus and melted provolone."},{"preference":"hoppy","beer":"Citrus pale ale","style":"American pale ale","reason":"Citrus hops meet the heat and acidity of the giardiniera."},{"preference":"malty","beer":"Vienna lager","style":"Amber lager","reason":"Toasty malt echoes the roast pork without making the sandwich feel heavier."},{"preference":"alcohol-free","beer":"Alcohol-free pilsner","style":"0.0% pilsner","reason":"A dry, sparkling finish keeps the rich sandwich lively."}]'::jsonb,
  'rust', 1
),
(
  'recipe-italian-beef', 'italian-beef', 'Italian Beef', 'Chicago · USA',
  'Thinly sliced seasoned beef, sweet peppers and giardiniera in a dipped Italian roll.',
  '["700g beef sirloin or topside", "4 Italian rolls", "2 green peppers", "120g giardiniera", "500ml beef stock", "1 tsp dried oregano", "1 tsp garlic powder", "Black pepper"]'::jsonb,
  '["Rub the beef with oregano, garlic powder and pepper. Roast at 180°C to medium, then cool completely for thin slicing.", "Simmer the stock with the roasting juices. Add the sliced beef and warm gently without boiling.", "Sauté sliced peppers until soft and lightly browned.", "Dip each roll quickly in the jus, then pack with beef, peppers and giardiniera."]'::jsonb,
  '[{"preference":"crisp","beer":"Helles lager","style":"Helles","reason":"Soft malt and brisk carbonation settle the peppery beef and jus."},{"preference":"hoppy","beer":"West Coast pale ale","style":"Pale ale","reason":"Firm bitterness stands up to beef while citrus lifts the peppers."},{"preference":"malty","beer":"American amber ale","style":"Amber ale","reason":"Caramel malt complements browned beef and sweet peppers."},{"preference":"alcohol-free","beer":"Alcohol-free amber lager","style":"0.5% amber lager","reason":"Malt character supports the beef while staying refreshing."}]'::jsonb,
  'amber', 2
),
(
  'recipe-cubano', 'cubano', 'Cubano', 'Cuba · Miami',
  'A hot pressed sandwich of roast pork, ham, Swiss cheese, pickles and mustard.',
  '["4 Cuban-style or soft white rolls", "300g sliced roast pork", "200g sliced ham", "8 slices Swiss cheese", "2 large dill pickles", "Yellow mustard", "Softened butter"]'::jsonb,
  '["Split the rolls and spread mustard across both cut sides.", "Layer pork, ham, Swiss and thinly sliced pickles. Close and butter the outside of each roll.", "Press in a sandwich grill, or under a weighted frying pan, over medium heat.", "Cook until deeply crisp outside and the cheese has melted, then cut diagonally."]'::jsonb,
  '[{"preference":"crisp","beer":"Cuban-style lager","style":"Pale lager","reason":"A light lager cools the mustard and pickle tang between rich bites."},{"preference":"hoppy","beer":"Session IPA","style":"Session IPA","reason":"Aromatic hops brighten pork and ham without overpowering the pressed sandwich."},{"preference":"malty","beer":"Vienna lager","style":"Vienna lager","reason":"Toasted malt mirrors the crisp pressed bread and roast pork."},{"preference":"alcohol-free","beer":"Alcohol-free lager with lime","style":"0.0% pale lager","reason":"Bright citrus and carbonation balance the cheese and cured meats."}]'::jsonb,
  'gold', 3
),
(
  'recipe-reuben', 'reuben', 'Reuben', 'New York · USA',
  'Pastrami, Swiss cheese, sauerkraut and dressing griddled between slices of rye.',
  '["8 slices rye bread", "400g sliced pastrami", "8 slices Swiss cheese", "200g sauerkraut", "4 tbsp Russian dressing", "Softened butter"]'::jsonb,
  '["Drain and squeeze the sauerkraut so the sandwich stays crisp.", "Spread dressing on the inside of each bread slice. Layer Swiss, pastrami, sauerkraut and a second slice of Swiss.", "Butter the outside of the bread and griddle over medium-low heat.", "Turn once and cook until both sides are crisp and the cheese is fully melted."]'::jsonb,
  '[{"preference":"crisp","beer":"Czech pilsner","style":"Pilsner","reason":"Snappy bitterness and carbonation cut pastrami, Swiss and dressing."},{"preference":"hoppy","beer":"Rye IPA","style":"Rye IPA","reason":"Peppery rye malt joins the bread while hops reset the palate."},{"preference":"malty","beer":"Dunkel","style":"Munich dunkel","reason":"Dark bread-like malt fits the rye and cured beef without stout-level weight."},{"preference":"alcohol-free","beer":"Alcohol-free dark lager","style":"0.5% dark lager","reason":"Roasty malt complements rye while a dry finish handles the sauerkraut."}]'::jsonb,
  'red', 4
),
(
  'recipe-banh-mi', 'banh-mi', 'Bánh Mì', 'Vietnam',
  'A crisp baguette filled with savoury pork, pâté, quick pickles, cucumber and herbs.',
  '["2 small crisp baguettes", "300g cooked pork belly or roast pork", "80g smooth pâté", "1 carrot", "100g daikon", "1 cucumber", "Rice vinegar and sugar", "Fresh coriander", "Mayonnaise and sliced chilli"]'::jsonb,
  '["Julienne the carrot and daikon, then toss with rice vinegar, sugar and salt. Leave for at least 30 minutes.", "Warm and slice the pork. Split the baguettes and remove a little crumb if they are very dense.", "Spread with pâté and mayonnaise, then add pork, drained pickles and cucumber batons.", "Finish with coriander and chilli, keeping the baguette crisp."]'::jsonb,
  '[{"preference":"crisp","beer":"Dry rice lager","style":"Rice lager","reason":"A very dry lager respects the herbs and pickles while refreshing after pork and pâté."},{"preference":"hoppy","beer":"Session pale ale","style":"Session pale ale","reason":"Citrus hops work with coriander, chilli and bright pickles."},{"preference":"malty","beer":"Saison","style":"Farmhouse ale","reason":"Peppery yeast and gentle grain bridge the baguette, herbs and savoury pork."},{"preference":"alcohol-free","beer":"Alcohol-free wheat beer","style":"0.0% wheat beer","reason":"Soft citrus and lively bubbles complement the herbs and quick pickles."}]'::jsonb,
  'green', 5
),
(
  'recipe-katsu-sando', 'katsu-sando', 'Katsu Sando', 'Japan',
  'Crisp pork cutlet, shredded cabbage and tonkatsu sauce in soft milk bread.',
  '["4 thick slices Japanese milk bread", "2 pork loin cutlets", "50g plain flour", "1 beaten egg", "100g panko crumbs", "Finely shredded cabbage", "Tonkatsu sauce", "Neutral oil and salt"]'::jsonb,
  '["Flatten the cutlets evenly and season. Coat in flour, egg and then panko.", "Shallow-fry at 175°C until crisp and cooked through, then drain and rest briefly.", "Spread tonkatsu sauce on the bread and add a thin layer of cabbage.", "Add the cutlet, close, trim the crusts if desired and cut into neat fingers."]'::jsonb,
  '[{"preference":"crisp","beer":"Japanese rice lager","style":"Rice lager","reason":"Clean, high carbonation keeps fried panko and sweet sauce in balance."},{"preference":"hoppy","beer":"Japanese-style pale ale","style":"Pale ale","reason":"Gentle citrus hops sharpen cabbage and rich fried pork."},{"preference":"malty","beer":"Kölsch","style":"Kölsch","reason":"Soft grain and a dry finish echo milk bread without competing with the katsu."},{"preference":"alcohol-free","beer":"Alcohol-free Japanese lager","style":"0.0% rice lager","reason":"Light grain and crisp bubbles are ideal beside the fried cutlet."}]'::jsonb,
  'rose', 6
);
