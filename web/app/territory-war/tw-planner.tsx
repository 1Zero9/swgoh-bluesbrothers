"use client";

import React, { useState, useMemo } from "react";
import type { PlayerDefensiveSquad } from "@/lib/territory-war";

type TwPlannerProps = {
  squadsPool: PlayerDefensiveSquad[];
  joinedCount: number;
};

const SQUAD_LABELS = {
  lordVader: "Lord Vader GL",
  jabba: "Jabba the Hutt GL",
  rey: "Rey GL",
  jmk: "Jedi Master Kenobi GL",
  reva: "Reva Inquisitorius",
  malgus: "Darth Malgus",
  gas: "GAS 501st",
  zorii: "Zorii Resistance",
  cere: "Cere & Malicos",
  executor: "Executor Fleet",
  profundity: "Profundity Fleet",
  leviathan: "Leviathan Fleet",
} as const;

type SquadKey = keyof typeof SQUAD_LABELS;

const SQUAD_CODE: Record<SquadKey, string> = {
  lordVader: "LV",
  jabba: "JB",
  rey: "RY",
  jmk: "JMK",
  reva: "RV",
  malgus: "MG",
  gas: "GS",
  zorii: "ZR",
  cere: "CM",
  executor: "EX",
  profundity: "PF",
  leviathan: "LE",
};

const SQUAD_GROUP: Record<SquadKey, "gl" | "elite" | "fleet"> = {
  lordVader: "gl",
  jabba: "gl",
  rey: "gl",
  jmk: "gl",
  reva: "elite",
  malgus: "elite",
  gas: "elite",
  zorii: "elite",
  cere: "elite",
  executor: "fleet",
  profundity: "fleet",
  leviathan: "fleet",
};

function SquadBadge({ squadKey, size = "md" }: { squadKey: SquadKey; size?: "sm" | "md" }) {
  return (
    <i className={`squad-badge squad-${SQUAD_GROUP[squadKey]}${size === "sm" ? " squad-badge-sm" : ""}`} title={SQUAD_LABELS[squadKey]}>
      {SQUAD_CODE[squadKey]}
    </i>
  );
}

const SQUAD_METRICS: Record<SquadKey, { label: string; recommendation: string; defaultRole: "Defense" | "Offense" }> = {
  lordVader: { label: "Lord Vader GL", recommendation: "Excellent defense anchor. Pair with Maul/Royal Guard. Minimum Relic 7.", defaultRole: "Defense" },
  jabba: { label: "Jabba the Hutt GL", recommendation: "Extremely tough defense wall. Heavy hold potential. Target Relic 5+.", defaultRole: "Defense" },
  rey: { label: "Rey GL", recommendation: "Great defensive GL. Pair with Ben Solo to steal banners. Target Relic 5+.", defaultRole: "Defense" },
  jmk: { label: "Jedi Master Kenobi GL", recommendation: "Highly versatile. Best saved for offense sweeps (e.g. Jabba counter).", defaultRole: "Offense" },
  reva: { label: "Reva Inquisitorius", recommendation: "Elite defense block. Place in Zone 1 to block top path. Target Relic 7+.", defaultRole: "Defense" },
  malgus: { label: "Darth Malgus", recommendation: "Premium non-GL defense wall in Mid-Front sectors (Zone 3). Target Relic 5+.", defaultRole: "Defense" },
  gas: { label: "GAS 501st", recommendation: "Solid defense wall or high-tier offensive counter. Target Relic 5+.", defaultRole: "Defense" },
  zorii: { label: "Zorii Resistance", recommendation: "High-hold defense team in Mid-Bottom sectors (Zone 4). Target G12+.", defaultRole: "Defense" },
  cere: { label: "Cere & Malicos", recommendation: "Nasty defense hold. Place in Mid-Bottom sectors (Zone 4). Target G12+.", defaultRole: "Defense" },
  executor: { label: "Executor Fleet", recommendation: "Strong fleet blockade. Place in Fleet Back (Zone 10) to block path. Target 7★.", defaultRole: "Defense" },
  profundity: { label: "Profundity Fleet", recommendation: "Reliable fleet blockade or offensive counter ship. Target 7★.", defaultRole: "Defense" },
  leviathan: { label: "Leviathan Fleet", recommendation: "Elite fleet wall. Place in Fleet Front (Zone 9). Target 7★.", defaultRole: "Defense" },
};

type CounterTeam = {
  name: string;
  successRate: string;
  efficiency: string;
  notes: string;
};

type SquadStrategy = {
  defendingSquad: string;
  vulnerability: "High" | "Medium" | "Low";
  primaryCounter: CounterTeam;
  secondaryCounter: CounterTeam;
  cheaperCounter: CounterTeam;
  killOrder: string;
};

const TW_COUNTER_STRATEGIES: Record<SquadKey, SquadStrategy> = {
  reva: {
    defendingSquad: "Reva Inquisitorius",
    vulnerability: "Medium",
    primaryCounter: { name: "Lord Vader GL", successRate: "95%", efficiency: "High", notes: "Use Lord Vader with Maul. Focus Reva first. Keep dots stacked." },
    secondaryCounter: { name: "Jedi Master Kenobi GL", successRate: "88%", efficiency: "Medium", notes: "CAT stun on Reva. Focus Grand Inquisitor next." },
    cheaperCounter: { name: "Cere Junda + Malicos", successRate: "75%", efficiency: "High (Non-GL)", notes: "Malicos massive burst on Reva. Crucial to have high tenacity." },
    killOrder: "Reva ➔ Grand Inquisitor ➔ Fifth Brother ➔ Seventh Sister",
  },
  lordVader: {
    defendingSquad: "Lord Vader GL",
    vulnerability: "Medium",
    primaryCounter: { name: "Bounty Hunters (Fennec Shan lead)", successRate: "90%", efficiency: "Elite (Non-GL)", notes: "Fennec Shan lead with Greef, Bossk, Zam, and Mando. Get quick contract to disintegrate Lord Vader." },
    secondaryCounter: { name: "JMK + CAT", successRate: "95%", efficiency: "Medium", notes: "CAT instant-kill on Maul or Royal Guard. Stun Lord Vader." },
    cheaperCounter: { name: "Imperial Troopers (Veers lead)", successRate: "65%", efficiency: "High (Budget)", notes: "High speed required to run turn meter train. Fragile." },
    killOrder: "Maul ➔ Royal Guard ➔ Lord Vader",
  },
  jabba: {
    defendingSquad: "Jabba the Hutt GL",
    vulnerability: "Low",
    primaryCounter: { name: "Supreme Leader Kylo Ren (SLKR)", successRate: "92%", efficiency: "High", notes: "Use standard SLKR team with Kru, Hux, Lobster, and FO Officer. Poke Jabba to drain mastery." },
    secondaryCounter: { name: "JMK + CAT", successRate: "88%", efficiency: "Medium", notes: "CAT leap on Krrsantan. Avoid hitting Jabba until ult is ready." },
    cheaperCounter: { name: "Aphra + Droids", successRate: "70%", efficiency: "High (Non-GL)", notes: "Use BT-1 and 0-0-0 to stack debuffs and control turn meter." },
    killOrder: "Boushh (Leia) ➔ Krrsantan ➔ Jabba",
  },
  rey: {
    defendingSquad: "Rey GL",
    vulnerability: "Medium",
    primaryCounter: { name: "Starkiller (Palpatine/Mara lead)", successRate: "94%", efficiency: "Elite (Non-GL)", notes: "Palpatine, Mara Jade, Starkiller, Visas, and light-side tank. Starkiller wipes out Rey with ult." },
    secondaryCounter: { name: "Jedi Knight Luke (JKLS lead)", successRate: "90%", efficiency: "High", notes: "JML lead with JKLS and Revan. Keep Rey ability blocked." },
    cheaperCounter: { name: "GAS 501st", successRate: "60%", efficiency: "Medium", notes: "Keep Rex alive to trigger Aerial Advantage. Trigger Rey's damage immunity carefully." },
    killOrder: "Ben Solo ➔ Rey",
  },
  jmk: {
    defendingSquad: "Jedi Master Kenobi GL",
    vulnerability: "Low",
    primaryCounter: { name: "Jabba the Hutt GL", successRate: "95%", efficiency: "High", notes: "Use standard Jabba team. Thermals bypass Kenobi's protection pools." },
    secondaryCounter: { name: "Rey GL + Ben Solo", successRate: "85%", efficiency: "Medium", notes: "Rey's sudden whirlwind to bypass General Kenobi's taunt." },
    cheaperCounter: { name: "Grand Admiral Thrawn + Magma", successRate: "50%", efficiency: "Low (Very Budget)", notes: "Fracture CAT immediately to prevent instant kill." },
    killOrder: "Commander Ahsoka Tano (CAT) ➔ General Kenobi ➔ JMK",
  },
  malgus: {
    defendingSquad: "Darth Malgus",
    vulnerability: "Medium",
    primaryCounter: { name: "Jedi Knight Luke (JKLS lead)", successRate: "92%", efficiency: "High", notes: "JKLS lead with JKR and Bastila. Speed reduction slow-down strategy is extremely effective." },
    secondaryCounter: { name: "GAS 501st", successRate: "80%", efficiency: "Medium", notes: "Keep Malgus ability blocked. Avoid AoE triggers when Malgus has doubt." },
    cheaperCounter: { name: "Imperial Troopers (Veers lead)", successRate: "70%", efficiency: "High (Budget)", notes: "Requires very fast speed stats to run the turn train before Malgus moves." },
    killOrder: "Darth Revan ➔ Bastila Shan (Fallen) ➔ Malgus",
  },
  gas: {
    defendingSquad: "GAS 501st",
    vulnerability: "High",
    primaryCounter: { name: "Commander Luke Skywalker (CLS)", successRate: "95%", efficiency: "High (Non-GL)", notes: "CLS with Han, Chewie, Threepio & Chewie, C-3PO. Focus Rex immediately at start." },
    secondaryCounter: { name: "Darth Revan + Malak", successRate: "90%", efficiency: "High", notes: "Fear mechanics bypass clone protection blocks." },
    cheaperCounter: { name: "Sith Triumvirate (Traya lead)", successRate: "85%", efficiency: "Elite (Budget)", notes: "Traya lead with Sion and Nihilus. Isolating GAS completely disables his counterattacks." },
    killOrder: "Rex ➔ Fives ➔ Echo ➔ Arc Trooper ➔ General Skywalker",
  },
  zorii: {
    defendingSquad: "Zorii Resistance",
    vulnerability: "High",
    primaryCounter: { name: "Imperial Troopers (Veers lead)", successRate: "96%", efficiency: "High (Non-GL)", notes: "Standard Veers team. Target Rose Tico or Finn first. Clean turn train sweep." },
    secondaryCounter: { name: "Traya + Savage Opress", successRate: "90%", efficiency: "High", notes: "Savage Opress solo or Traya lead. High durability to tank the resistance assists." },
    cheaperCounter: { name: "Bounty Hunters (Aurra lead)", successRate: "75%", efficiency: "Medium", notes: "Aurra Sing lead to get fast disintegrate on Zorii." },
    killOrder: "Zorii Bliss ➔ Finn ➔ Rose Tico",
  },
  cere: {
    defendingSquad: "Cere & Malicos",
    vulnerability: "Medium",
    primaryCounter: { name: "Sith Empire (Darth Revan lead)", successRate: "90%", efficiency: "High (Non-GL)", notes: "DR lead with Malak and Badstila. Shock prevents Malicos from gaining TM." },
    secondaryCounter: { name: "CLS Rebels", successRate: "82%", efficiency: "Medium", notes: "Burst down Malicos before he can trigger heavy lightsaber attacks." },
    cheaperCounter: { name: "Jedi Revan (JKR)", successRate: "70%", efficiency: "Medium", notes: "Mark Malicos immediately. Keep him controlled." },
    killOrder: "Taron Malicos ➔ Cere Junda ➔ Cal Kestis",
  },
  executor: {
    defendingSquad: "Executor Fleet",
    vulnerability: "Medium",
    primaryCounter: { name: "Profundity Fleet", successRate: "94%", efficiency: "High", notes: "Bring Outrider, Falcon, Y-Wing. Target Hound's Tooth or Xanadu Blood." },
    secondaryCounter: { name: "Malevolence Fleet", successRate: "80%", efficiency: "High (Budget)", notes: "Use Hyena Bomber and Vulture Droid to stack buzz droids and control turn meter." },
    cheaperCounter: { name: "Chimera + Tie Defender", successRate: "85%", efficiency: "Elite (Non-GL)", notes: "Use Iden Versio's TIE Defender to stun and dodge Executor's target locks." },
    killOrder: "Xanadu Blood ➔ Razor Crest ➔ Executor",
  },
  profundity: {
    defendingSquad: "Profundity Fleet",
    vulnerability: "Medium",
    primaryCounter: { name: "Leviathan Fleet", successRate: "98%", efficiency: "High", notes: "Use standard Leviathan loadout. Seize hangar control quickly." },
    secondaryCounter: { name: "Executor Fleet", successRate: "85%", efficiency: "Medium", notes: "Hound's Tooth, Razor Crest, Xanadu Blood. Target Outrider first." },
    cheaperCounter: { name: "Malevolence Fleet", successRate: "70%", efficiency: "High (Budget)", notes: "Ion cannon shot on Profundity. Spam droid assists." },
    killOrder: "Outrider ➔ Rebel Y-Wing ➔ Profundity",
  },
  leviathan: {
    defendingSquad: "Leviathan Fleet",
    vulnerability: "Low",
    primaryCounter: { name: "Leviathan Fleet (Mirror)", successRate: "90%", efficiency: "Medium", notes: "Match speed stats. Target Fury-Class Interceptor first." },
    secondaryCounter: { name: "Profundity Fleet", successRate: "75%", efficiency: "High", notes: "High RNG factor. Requires Outrider to avoid getting early target locked." },
    cheaperCounter: { name: "Chimera + Interceptor", successRate: "60%", efficiency: "High (Skill)", notes: "Requires perfect reinforcement timing with TIE Defender and Emperor's Shuttle." },
    killOrder: "Fury-Class Interceptor ➔ Dagger Starfighter ➔ Leviathan",
  },
};

type ZoneAllocation = {
  id: number;
  name: string;
  type: "ground" | "fleet";
  description: string;
  targetCapacity: number;
  allocations: Record<SquadKey, number>;
};

const INITIAL_ZONES: ZoneAllocation[] = [
  { id: 1, name: "Zone 1 (Top Front)", type: "ground", description: "Top front line. Target elite GLs or Inquisitors (Reva/LV).", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 2, name: "Zone 2 (Bottom Front)", type: "ground", description: "Bottom front line. Best for tanky hold squads (Jabba/Rey).", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 3, name: "Zone 3 (Top Mid-Front)", type: "ground", description: "Top mid-front. Best for solid non-GL walls (GAS/Malgus).", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 4, name: "Zone 4 (Bottom Mid-Front)", type: "ground", description: "Bottom mid-front. Best for off-meta holds (Zorii/Cere).", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 5, name: "Zone 5 (Top Mid-Back)", type: "ground", description: "Top mid-back fallback. Secondary hold structures.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 6, name: "Zone 6 (Bottom Mid-Back)", type: "ground", description: "Bottom mid-back fallback. Residual synergy cards.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 7, name: "Zone 7 (Top Back)", type: "ground", description: "Top back wall. Place fallback squads to prevent full clears.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 8, name: "Zone 8 (Bottom Back)", type: "ground", description: "Bottom back wall. Residual holds and general filler squads.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 9, name: "Zone 9 (Fleet Front)", type: "fleet", description: "Front fleet sector. Guard with Leviathan or Profundity blockades.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
  { id: 10, name: "Zone 10 (Fleet Back)", type: "fleet", description: "Back fleet sector. Guard with Executor or Chimaera blockades.", targetCapacity: 25, allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 } },
];

export default function TwPlanner({ squadsPool, joinedCount }: TwPlannerProps) {
  const activePool = useMemo(() => squadsPool.filter((s) => s.joined), [squadsPool]);
  
  // Calculate total available squads in the active pool
  const poolTotals = useMemo(() => {
    const totals: Record<SquadKey, number> = {
      lordVader: 0,
      jabba: 0,
      rey: 0,
      jmk: 0,
      reva: 0,
      malgus: 0,
      gas: 0,
      zorii: 0,
      cere: 0,
      executor: 0,
      profundity: 0,
      leviathan: 0,
    };
    activePool.forEach((p) => {
      Object.keys(totals).forEach((key) => {
        if (p[key as SquadKey]) {
          totals[key as SquadKey]++;
        }
      });
    });
    return totals;
  }, [activePool]);

  const [zones, setZones] = useState<ZoneAllocation[]>(() => {
    const initialCap = Math.ceil(joinedCount / 2) || 25;
    return INITIAL_ZONES.map((z) => ({ ...z, targetCapacity: initialCap }));
  });

  const [selectedZoneId, setSelectedZoneId] = useState<number>(1);
  const [globalCapacity, setGlobalCapacity] = useState<number>(() => Math.ceil(joinedCount / 2) || 25);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedCounterKey, setSelectedCounterKey] = useState<SquadKey | null>(null);

  const selectedZone = useMemo(() => zones.find((z) => z.id === selectedZoneId)!, [zones, selectedZoneId]);

  // Total allocated squads per archetype across all zones
  const totalAllocated = useMemo(() => {
    const totals: Record<SquadKey, number> = {
      lordVader: 0,
      jabba: 0,
      rey: 0,
      jmk: 0,
      reva: 0,
      malgus: 0,
      gas: 0,
      zorii: 0,
      cere: 0,
      executor: 0,
      profundity: 0,
      leviathan: 0,
    };
    zones.forEach((z) => {
      Object.keys(totals).forEach((key) => {
        totals[key as SquadKey] += z.allocations[key as SquadKey];
      });
    });
    return totals;
  }, [zones]);

  // Auto-allocate heuristic engine
  const handleAutoAllocate = () => {
    const nextZones = zones.map((z) => ({
      ...z,
      allocations: { lordVader: 0, jabba: 0, rey: 0, jmk: 0, reva: 0, malgus: 0, gas: 0, zorii: 0, cere: 0, executor: 0, profundity: 0, leviathan: 0 },
    }));

    const playerPlacements = new Map<string, Set<string>>();
    activePool.forEach((p) => playerPlacements.set(p.playerId, new Set<string>()));

    const tryPlace = (zoneIndex: number, squadKey: SquadKey, player: PlayerDefensiveSquad): boolean => {
      const placed = playerPlacements.get(player.playerId)!;
      if (placed.has(squadKey)) return false;
      if (placed.size >= 3) return false;

      nextZones[zoneIndex].allocations[squadKey]++;
      placed.add(squadKey);
      return true;
    };

    // Fleet Path
    // Zone 9: Leviathan + Profundity
    activePool.forEach((player) => {
      const currentCount = nextZones[8].allocations.leviathan + nextZones[8].allocations.profundity;
      if (currentCount >= nextZones[8].targetCapacity) return;
      if (player.leviathan) tryPlace(8, "leviathan", player);
      else if (player.profundity) tryPlace(8, "profundity", player);
    });

    // Zone 10: Executor
    activePool.forEach((player) => {
      const currentCount = nextZones[9].allocations.executor;
      if (currentCount >= nextZones[9].targetCapacity) return;
      if (player.executor) tryPlace(9, "executor", player);
    });

    // Ground Top Path
    // Zone 1: Reva + Lord Vader
    activePool.forEach((player) => {
      const currentCount = nextZones[0].allocations.reva + nextZones[0].allocations.lordVader;
      if (currentCount >= nextZones[0].targetCapacity) return;
      if (player.reva) tryPlace(0, "reva", player);
      else if (player.lordVader) tryPlace(0, "lordVader", player);
    });

    // Zone 2: Jabba + Rey
    activePool.forEach((player) => {
      const currentCount = nextZones[1].allocations.jabba + nextZones[1].allocations.rey;
      if (currentCount >= nextZones[1].targetCapacity) return;
      if (player.jabba) tryPlace(1, "jabba", player);
      else if (player.rey) tryPlace(1, "rey", player);
    });

    // Zone 3: Malgus + GAS
    activePool.forEach((player) => {
      const currentCount = nextZones[2].allocations.malgus + nextZones[2].allocations.gas;
      if (currentCount >= nextZones[2].targetCapacity) return;
      if (player.malgus) tryPlace(2, "malgus", player);
      else if (player.gas) tryPlace(2, "gas", player);
    });

    // Zone 4: Zorii + Cere
    activePool.forEach((player) => {
      const currentCount = nextZones[3].allocations.zorii + nextZones[3].allocations.cere;
      if (currentCount >= nextZones[3].targetCapacity) return;
      if (player.zorii) tryPlace(3, "zorii", player);
      else if (player.cere) tryPlace(3, "cere", player);
    });

    // Zone 5: JMK
    activePool.forEach((player) => {
      const currentCount = nextZones[4].allocations.jmk;
      if (currentCount >= nextZones[4].targetCapacity) return;
      if (player.jmk) tryPlace(4, "jmk", player);
    });

    setZones(nextZones);
  };

  const updateAllocation = (squadKey: SquadKey, increment: boolean) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== selectedZoneId) return z;
        const currentVal = z.allocations[squadKey];
        const nextVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
        return {
          ...z,
          allocations: {
            ...z.allocations,
            [squadKey]: nextVal,
          },
        };
      })
    );
  };

  const handleGlobalCapacityChange = (newVal: number) => {
    setGlobalCapacity(newVal);
    setZones((prev) => prev.map((z) => ({ ...z, targetCapacity: newVal })));
  };

  const compiledDirectives = useMemo(() => {
    let text = `=== BLUES BROTHERS TW STRATEGY DIRECTIVES ===\n`;
    text += `Target Zone Capacity: ${globalCapacity} squads per zone\n\n`;

    zones.forEach((z) => {
      const allocatedList = Object.entries(z.allocations)
        .filter(([, val]) => val > 0)
        .map(([key, val]) => `${val}x ${SQUAD_LABELS[key as SquadKey]}`)
        .join(", ");
      
      const totalAllocatedInZone = Object.values(z.allocations).reduce((a, b) => a + b, 0);
      const fillerCount = Math.max(0, z.targetCapacity - totalAllocatedInZone);

      text += `[${z.name}]\n`;
      text += `└ Squads: ${allocatedList || "None pre-assigned"}\n`;
      if (fillerCount > 0) {
        text += `└ Filler: Deploy ${fillerCount}x general synergy squads\n`;
      }
      text += `\n`;
    });

    text += `=== OFFENSE ORDER ===\n`;
    text += `• Save high-gear JMK, JML, and SLKR counter teams for offensive sweeps.\n`;
    text += `• Check zone target capacity locks before placing residual defenses.`;
    return text;
  }, [zones, globalCapacity]);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledDirectives);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to split zones for visual map rendering
  const topPathZones = useMemo(() => zones.filter((z) => [1, 3, 5, 7].includes(z.id)), [zones]);
  const bottomPathZones = useMemo(() => zones.filter((z) => [2, 4, 6, 8].includes(z.id)), [zones]);
  const fleetPathZones = useMemo(() => zones.filter((z) => [9, 10].includes(z.id)), [zones]);

  return (
    <div className="tw-planner-outer-container">
      {/* Visual Map Section */}
      <section className="tw-visual-map-section panel">
        <header className="panel-heading">
          <h2>Territory War Tactical Map</h2>
          <p className="section-intro">Visual battlefield representation. Click any zone node to allocate squads.</p>
        </header>

        <div className="tw-map-board">
          {[
            { key: "top", label: "Top Path (Ground)", zones: topPathZones, fleet: false, empty: "Filler only" },
            { key: "fleet", label: "Middle Path (Fleets)", zones: fleetPathZones, fleet: true, empty: "No fleets" },
            { key: "bottom", label: "Bottom Path (Ground)", zones: bottomPathZones, fleet: false, empty: "Filler only" },
          ].map((lane) => (
            <div className={`tw-map-lane ${lane.key}-lane`} key={lane.key}>
              <span className="lane-label">{lane.label}</span>
              <div className={`lane-nodes${lane.fleet ? " centered-nodes" : ""}`}>
                {lane.zones.map((z) => {
                  const assigned = Object.values(z.allocations).reduce((a, b) => a + b, 0);
                  const percent = Math.min(100, Math.round((assigned / z.targetCapacity) * 100));
                  const activeSquadKeys = (Object.keys(z.allocations) as SquadKey[]).filter((k) => z.allocations[k] > 0);

                  return (
                    <button
                      key={z.id}
                      className={`map-node-card ${lane.fleet ? "fleet-node" : ""} ${selectedZoneId === z.id ? "active" : ""}`}
                      onClick={() => setSelectedZoneId(z.id)}
                    >
                      <div className={`node-badge${lane.fleet ? " fleet-badge" : ""}`}>Z{z.id}</div>
                      <div className="node-body">
                        <strong>{z.name.split(" ")[0]} {z.name.match(/\((.*?)\)/)?.[0]}</strong>
                        <span className="node-squad-icons">
                          {activeSquadKeys.length
                            ? activeSquadKeys.map((k) => <SquadBadge squadKey={k} size="sm" key={k} />)
                            : <em>{lane.empty}</em>}
                        </span>
                      </div>
                      <div className="node-footer">
                        <span>{assigned}/{z.targetCapacity}</span>
                        <div className="node-progress"><div style={{ width: `${percent}%` }} /></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editor & Roster Dashboard Grid */}
      <div className="tw-planner-grid">
        {/* Editor Controls */}
        <div className="planner-controls-panel panel">
          <header className="panel-heading">
            <h2>Zone Editor</h2>
            <p className="section-intro">Configure details for Zone {selectedZone.id}.</p>
          </header>

          <div className="planner-meta-controls">
            <label className="capacity-slider-label">
              <span>Target Capacity: <strong>{globalCapacity}</strong> squads</span>
              <input
                type="range"
                min="10"
                max="50"
                value={globalCapacity}
                onChange={(e) => handleGlobalCapacityChange(Number(e.target.value))}
              />
            </label>

            <button className="auto-allocate-button account-link-button" onClick={handleAutoAllocate}>
              ⚡ Auto-Allocate defensive walls
            </button>
          </div>

          <div className="squad-tile-grid">
            {Object.keys(SQUAD_LABELS).map((key) => {
              const squadKey = key as SquadKey;
              const isFleetSquad = ["executor", "profundity", "leviathan"].includes(squadKey);

              if (selectedZone.type === "ground" && isFleetSquad) return null;
              if (selectedZone.type === "fleet" && !isFleetSquad) return null;

              const allocatedHere = selectedZone.allocations[squadKey];
              const allocatedGlobal = totalAllocated[squadKey];
              const poolTotal = poolTotals[squadKey];
              const exceedsPool = allocatedGlobal > poolTotal;

              return (
                <div key={squadKey} className={`squad-tile ${allocatedHere > 0 ? "is-filled" : ""} ${exceedsPool ? "exceeds-limit" : ""}`}>
                  <SquadBadge squadKey={squadKey} />
                  <div className="squad-tile-info">
                    <strong>{SQUAD_LABELS[squadKey]}</strong>
                    <span>{allocatedGlobal}/{poolTotal} deployed</span>
                  </div>
                  <div className="counter-controls">
                    <button onClick={() => updateAllocation(squadKey, false)} disabled={allocatedHere <= 0}>-</button>
                    <span className="counter-val">{allocatedHere}</span>
                    <button onClick={() => updateAllocation(squadKey, true)} disabled={allocatedGlobal >= poolTotal}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exporter directives */}
        <div className="planner-detail-panel panel">
          <header className="panel-heading">
            <h2>Command Directives</h2>
            <p className="section-intro">Direct copy paste values for in-game mail or Discord commands.</p>
          </header>
          <textarea className="directives-output" readOnly value={compiledDirectives} />
          <button className="copy-directives-btn account-link-button" onClick={handleCopy}>
            {copied ? "✓ Copied to Clipboard" : "Copy Directives"}
          </button>
        </div>
      </div>

      {/* Roster & Balance Analysis Board */}
      <section className="tw-roster-analysis-section panel">
        <header className="panel-heading">
          <h2>Roster Optimization & Squads Balance</h2>
          <p className="section-intro">Analysis of joined roster, current defensive allocation, and remaining offensive headroom.</p>
        </header>

        <div className="balance-chart">
          {Object.keys(SQUAD_LABELS).map((key) => {
            const squadKey = key as SquadKey;
            const poolTotal = poolTotals[squadKey];
            const onDefense = totalAllocated[squadKey];
            const onOffense = Math.max(0, poolTotal - onDefense);
            const metric = SQUAD_METRICS[squadKey];
            const defensePct = poolTotal > 0 ? Math.min(100, Math.round((onDefense / poolTotal) * 100)) : 0;
            const offensePct = poolTotal > 0 ? Math.max(0, 100 - defensePct) : 0;

            return (
              <div className="balance-row" key={squadKey}>
                <div className="balance-row-label">
                  <SquadBadge squadKey={squadKey} />
                  <div className="balance-row-info">
                    <strong>{metric.label}</strong>
                    <small>{metric.recommendation}</small>
                  </div>
                </div>
                <div className="balance-row-figures">
                  <span className="balance-total">{poolTotal}<small>joined</small></span>
                  <div className="balance-bar-track" title={`${onDefense} on defense · ${onOffense} offense headroom`}>
                    {poolTotal > 0 ? (
                      <>
                        <div className="balance-bar-segment defense" style={{ width: `${defensePct}%` }} />
                        <div className="balance-bar-segment offense" style={{ width: `${offensePct}%` }} />
                      </>
                    ) : (
                      <div className="balance-bar-empty" />
                    )}
                  </div>
                  <div className="balance-legend">
                    <span className="balance-pill defense"><i />{onDefense} defense</span>
                    <span className="balance-pill offense"><i />{onOffense} headroom</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Meta Counters lookup board */}
      <section className="tw-counters-guide-section panel">
        <header className="panel-heading">
          <h2>Tactical Battle Counters & Win-Rate Guides</h2>
          <p className="section-intro">Emulates community counter engines. Click on any squad to inspect its best counters, success ratings, and optimal kill orders.</p>
        </header>

        <div className="counters-selector-grid">
          {Object.entries(SQUAD_LABELS).map(([key, label]) => {
            const squadKey = key as SquadKey;
            const strategy = TW_COUNTER_STRATEGIES[squadKey];
            const isSelected = selectedCounterKey === squadKey;

            return (
              <button
                key={squadKey}
                className={`counter-tab-btn ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedCounterKey(isSelected ? null : squadKey)}
              >
                <SquadBadge squadKey={squadKey} size="sm" />
                <span className="counter-tab-info">
                  <span>{label}</span>
                  <small className={`vulnerability-badge ${strategy.vulnerability.toLowerCase()}`}>
                    Vulnerability: {strategy.vulnerability}
                  </small>
                </span>
              </button>
            );
          })}
        </div>

        {selectedCounterKey && (
          <div className="counter-strategy-details-card">
            <header className="details-header">
              <h3>Defeating {SQUAD_LABELS[selectedCounterKey]}</h3>
              <p>Kill Order Priority: <strong className="kill-order-route">{TW_COUNTER_STRATEGIES[selectedCounterKey].killOrder}</strong></p>
            </header>

            <div className="counter-options-grid">
              <div className="counter-option-panel primary-option">
                <div className="option-header">
                  <strong>Primary Counter</strong>
                  <span className="success-tag">Success: {TW_COUNTER_STRATEGIES[selectedCounterKey].primaryCounter.successRate}</span>
                </div>
                <div className="option-body">
                  <h4>{TW_COUNTER_STRATEGIES[selectedCounterKey].primaryCounter.name}</h4>
                  <p>{TW_COUNTER_STRATEGIES[selectedCounterKey].primaryCounter.notes}</p>
                </div>
              </div>

              <div className="counter-option-panel secondary-option">
                <div className="option-header">
                  <strong>Secondary Counter</strong>
                  <span className="success-tag">Success: {TW_COUNTER_STRATEGIES[selectedCounterKey].secondaryCounter.successRate}</span>
                </div>
                <div className="option-body">
                  <h4>{TW_COUNTER_STRATEGIES[selectedCounterKey].secondaryCounter.name}</h4>
                  <p>{TW_COUNTER_STRATEGIES[selectedCounterKey].secondaryCounter.notes}</p>
                </div>
              </div>

              <div className="counter-option-panel budget-option">
                <div className="option-header">
                  <strong>Budget / Non-GL Counter</strong>
                  <span className="success-tag warning-success">Success: {TW_COUNTER_STRATEGIES[selectedCounterKey].cheaperCounter.successRate}</span>
                </div>
                <div className="option-body">
                  <h4>{TW_COUNTER_STRATEGIES[selectedCounterKey].cheaperCounter.name}</h4>
                  <p>{TW_COUNTER_STRATEGIES[selectedCounterKey].cheaperCounter.notes}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
