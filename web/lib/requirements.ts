/** What the guild asks of new players (from the in-game guild description). */
export const JOIN_REQUIREMENTS = {
  minGalacticPower: 10_000_000,
  minGalacticLegends: 5,
} as const;

export type RequirementCheck = { label: string; have: string; need: string; ok: boolean };

export type RequirementResult = { meets: boolean; checks: RequirementCheck[] };

function millions(value: number) {
  return `${(value / 1_000_000).toFixed(1)}M`;
}

export function evaluateRequirements(stats: { galacticPower: number; galacticLegends: number }): RequirementResult {
  const checks: RequirementCheck[] = [
    {
      label: "Galactic Power",
      have: millions(stats.galacticPower),
      need: `${millions(JOIN_REQUIREMENTS.minGalacticPower)}+`,
      ok: stats.galacticPower >= JOIN_REQUIREMENTS.minGalacticPower,
    },
    {
      label: "Galactic Legends",
      have: String(stats.galacticLegends),
      need: `${JOIN_REQUIREMENTS.minGalacticLegends}+`,
      ok: stats.galacticLegends >= JOIN_REQUIREMENTS.minGalacticLegends,
    },
  ];
  return { meets: checks.every((check) => check.ok), checks };
}
