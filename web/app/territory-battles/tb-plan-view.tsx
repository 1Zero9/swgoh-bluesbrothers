import type { PersistedPlanetPlan } from "./tb-workspace";

const STRATEGY_WORDS: Record<string, { label: string; tone: string }> = {
  PRELOAD: { label: "Pre-load", tone: "is-preload" },
  THREE_STAR: { label: "Go for 3★", tone: "is-three-star" },
  HOLD: { label: "Hold", tone: "is-hold" },
  SKIP: { label: "Skip", tone: "is-skip" },
};

/** The officers' plan as members need it: per phase, which planets and what to do there. */
export default function TbPlanView({ name, planets }: { name: string; planets: PersistedPlanetPlan[] }) {
  const phases = [...new Set(planets.map((planet) => planet.phase))].sort((a, b) => a - b);
  return (
    <div className="tb-plan-view" aria-label={name}>
      {phases.map((phase) => (
        <section key={phase} className="tb-plan-phase">
          <h3>Phase {phase}</h3>
          <ul>
            {planets.filter((planet) => planet.phase === phase).map((planet) => {
              const words = STRATEGY_WORDS[planet.strategy] ?? STRATEGY_WORDS.SKIP;
              return (
                <li key={planet.id}>
                  <span className={`tb-plan-badge ${words.tone}`}>{words.label}</span>
                  <strong>{planet.planetName}</strong>
                  {planet.command ? <small>Squad: {planet.command.name}</small> : null}
                  {planet.note ? <p>{planet.note}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
