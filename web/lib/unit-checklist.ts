// Adapted from jmiln/SWGoHBot's data/unitChecklist.json (MIT).
// See /credits and THIRD_PARTY_NOTICES.md for attribution and licence details.
export type ArsenalCategory = "Galactic Legends" | "Light Side" | "Dark Side" | "Capital Ships";

export type ArsenalUnit = {
  definitionId: string;
  name: string;
};

export const UNIT_CHECKLIST: Record<ArsenalCategory, ArsenalUnit[]> = {
  "Galactic Legends": [
    { definitionId: "GLAHSOKATANO", name: "Ahsoka Tano" },
    { definitionId: "JABBATHEHUTT", name: "Jabba" },
    { definitionId: "JEDIMASTERKENOBI", name: "Jedi Master Kenobi" },
    { definitionId: "GRANDMASTERLUKE", name: "Jedi Master Luke" },
    { definitionId: "GLLEIA", name: "Leia Organa" },
    { definitionId: "LORDVADER", name: "Lord Vader" },
    { definitionId: "GLHONDO", name: "Pirate King Hondo Ohnaka" },
    { definitionId: "GLREY", name: "Rey" },
    { definitionId: "SITHPALPATINE", name: "Sith Eternal Emperor" },
    { definitionId: "SUPREMELEADERKYLOREN", name: "Supreme Leader Kylo Ren" },
  ],
  "Light Side": [
    { definitionId: "C3POLEGENDARY", name: "C-3PO" },
    { definitionId: "C3POCHEWBACCA", name: "Threepio & Chewie" },
    { definitionId: "COMMANDERAHSOKA", name: "Commander Ahsoka Tano" },
    { definitionId: "COMMANDERLUKESKYWALKER", name: "Commander Luke Skywalker" },
    { definitionId: "ENFYSNEST", name: "Enfys Nest" },
    { definitionId: "GENERALKENOBI", name: "General Kenobi" },
    { definitionId: "GENERALSKYWALKER", name: "General Skywalker" },
    { definitionId: "GRANDMASTERYODA", name: "Grand Master Yoda" },
    { definitionId: "HANSOLO", name: "Han Solo" },
    { definitionId: "HERMITYODA", name: "Hermit Yoda" },
    { definitionId: "JEDIKNIGHTLUKE", name: "Jedi Knight Luke" },
    { definitionId: "JEDIKNIGHTREVAN", name: "Jedi Knight Revan" },
    { definitionId: "MONMOTHMA", name: "Mon Mothma" },
    { definitionId: "PADMEAMIDALA", name: "Padmé Amidala" },
    { definitionId: "REYJEDITRAINING", name: "Rey (Jedi Training)" },
  ],
  "Dark Side": [
    { definitionId: "ADMIRALPIETT", name: "Admiral Piett" },
    { definitionId: "BOSSK", name: "Bossk" },
    { definitionId: "DARKTROOPER", name: "Dark Trooper" },
    { definitionId: "VADER", name: "Darth Vader" },
    { definitionId: "DARTHMALAK", name: "Darth Malak" },
    { definitionId: "DARTHREVAN", name: "Darth Revan" },
    { definitionId: "DARTHTRAYA", name: "Darth Traya" },
    { definitionId: "GRIEVOUS", name: "General Grievous" },
    { definitionId: "GEONOSIANBROODALPHA", name: "Geonosian Brood Alpha" },
    { definitionId: "KYLORENUNMASKED", name: "Kylo Ren (Unmasked)" },
    { definitionId: "MAULS7", name: "Maul" },
    { definitionId: "EMPERORPALPATINE", name: "Emperor Palpatine" },
    { definitionId: "MOTHERTALZIN", name: "Mother Talzin" },
    { definitionId: "GRANDADMIRALTHRAWN", name: "Grand Admiral Thrawn" },
    { definitionId: "WATTAMBOR", name: "Wat Tambor" },
  ],
  "Capital Ships": [
    { definitionId: "CAPITALCHIMAERA", name: "Chimaera" },
    { definitionId: "CAPITALJEDICRUISER", name: "Endurance" },
    { definitionId: "CAPITALEXECUTOR", name: "Executor" },
    { definitionId: "CAPITALSTARDESTROYER", name: "Executrix" },
    { definitionId: "CAPITALFINALIZER", name: "Finalizer" },
    { definitionId: "CAPITALMONCALAMARICRUISER", name: "Home One" },
    { definitionId: "CAPITALLEVIATHAN", name: "Leviathan" },
    { definitionId: "CAPITALMALEVOLENCE", name: "Malevolence" },
    { definitionId: "CAPITALNEGOTIATOR", name: "Negotiator" },
    { definitionId: "CAPITALPROFUNDITY", name: "Profundity" },
    { definitionId: "CAPITALRADDUS", name: "Raddus" },
  ],
};

export const ARSENAL_CATEGORIES = Object.keys(UNIT_CHECKLIST) as ArsenalCategory[];
