UPDATE "Recipe"
SET
  "name" = 'The Pork Awakens',
  "origin" = 'Maxwell Street · Corellian route',
  "description" = 'A Chicago roast-pork legend with provolone, sharp giardiniera and enough jus to wake the Force.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'recipe-pork-sandwich';

UPDATE "Recipe"
SET
  "name" = 'The Beef Strikes Back',
  "origin" = 'Chicago · Bespin branch',
  "description" = 'Thin-sliced Chicago beef, sweet peppers and giardiniera return in a properly dipped Italian roll.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'recipe-italian-beef';

UPDATE "Recipe"
SET
  "name" = 'The Kessel Run Cubano',
  "origin" = 'Cuba · Miami · 12 parsecs',
  "description" = 'Roast pork, ham, Swiss, pickles and mustard pressed faster than any sandwich in the sector.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'recipe-cubano';

UPDATE "Recipe"
SET
  "name" = 'Reuben One',
  "origin" = 'New York · Rebel base',
  "description" = 'Pastrami, Swiss, sauerkraut and dressing lead the lunch rebellion between griddled rye.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'recipe-reuben';

UPDATE "Recipe"
SET
  "name" = 'Bánh Mì Kenobi',
  "origin" = 'Vietnam · The high ground',
  "description" = 'The sandwich you are looking for: crisp baguette, savoury pork, pâté, quick pickles and herbs.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'recipe-banh-mi';

UPDATE "Recipe"
SET
  "name" = 'Katsu Solo',
  "origin" = 'Japan · Smuggler''s cut',
  "description" = 'A lone crisp pork cutlet with cabbage and tonkatsu sauce, flying between soft milk bread.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'recipe-katsu-sando';
