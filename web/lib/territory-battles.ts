export type RoteZone = {
  id: string;
  name: string;
  type: "character" | "ship";
  faction: "dark" | "light" | "mixed";
  stars: [number, number, number]; // GP for 1*, 2*, 3* in millions
};

export type RotePhase = {
  phase: number;
  zones: RoteZone[];
};

export const ROTE_PLANNER_DATA: RotePhase[] = [
  {
    phase: 1,
    zones: [
      { id: "ds_mustafar", name: "Mustafar (Dark Side)", type: "character", faction: "dark", stars: [100, 180, 265] },
      { id: "ls_coruscant", name: "Coruscant (Light Side)", type: "character", faction: "light", stars: [100, 180, 265] },
      { id: "mix_corellia", name: "Corellia (Mixed)", type: "character", faction: "mixed", stars: [110, 200, 295] },
      { id: "fleet_p1", name: "P1 Fleets", type: "ship", faction: "mixed", stars: [60, 110, 165] },
    ],
  },
  {
    phase: 2,
    zones: [
      { id: "ds_geonosis", name: "Geonosis (Dark Side)", type: "character", faction: "dark", stars: [135, 222, 315] },
      { id: "ls_felucia", name: "Felucia (Light Side)", type: "character", faction: "light", stars: [135, 222, 315] },
      { id: "mix_alderaan", name: "Alderaan (Mixed)", type: "character", faction: "mixed", stars: [150, 245, 345] },
      { id: "fleet_p2", name: "P2 Fleets", type: "ship", faction: "mixed", stars: [80, 140, 205] },
    ],
  },
  {
    phase: 3,
    zones: [
      { id: "ds_haven", name: "Haven Medical Station (DS)", type: "character", faction: "dark", stars: [160, 250, 360] },
      { id: "ls_kashyyyk", name: "Kashyyyk (Light Side)", type: "character", faction: "light", stars: [160, 250, 360] },
      { id: "mix_lothal", name: "Lothal (Mixed)", type: "character", faction: "mixed", stars: [180, 280, 390] },
      { id: "fleet_p3", name: "P3 Fleets", type: "ship", faction: "mixed", stars: [100, 175, 250] },
    ],
  },
  {
    phase: 4,
    zones: [
      { id: "ds_dromund", name: "Dromund Kaas (Dark Side)", type: "character", faction: "dark", stars: [200, 300, 430] },
      { id: "ls_tatooine", name: "Tatooine (Light Side)", type: "character", faction: "light", stars: [200, 300, 430] },
      { id: "mix_kessel", name: "Kessel (Mixed)", type: "character", faction: "mixed", stars: [220, 330, 470] },
      { id: "fleet_p4", name: "P4 Fleets", type: "ship", faction: "mixed", stars: [120, 200, 280] },
    ],
  },
  {
    phase: 5,
    zones: [
      { id: "ds_lothal_orbit", name: "DS Outer Rim", type: "character", faction: "dark", stars: [250, 370, 520] },
      { id: "ls_kessel_orbit", name: "LS Outer Rim", type: "character", faction: "light", stars: [250, 370, 520] },
      { id: "mix_vandor", name: "Vandor (Mixed)", type: "character", faction: "mixed", stars: [270, 400, 560] },
      { id: "fleet_p5", name: "Vandor Fleet", type: "ship", faction: "mixed", stars: [140, 230, 320] },
    ],
  },
  {
    phase: 6,
    zones: [
      { id: "ds_corellia_orbit", name: "DS Inner Rim", type: "character", faction: "dark", stars: [300, 440, 600] },
      { id: "ls_felucia_orbit", name: "LS Inner Rim", type: "character", faction: "light", stars: [300, 440, 600] },
      { id: "mix_hoth", name: "Hoth (Mixed)", type: "character", faction: "mixed", stars: [320, 470, 640] },
      { id: "fleet_p6", name: "Hoth Fleet", type: "ship", faction: "mixed", stars: [160, 260, 360] },
    ],
  },
];
