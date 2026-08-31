import { simulateBatch, type SimulationAgent } from "../lib/game/simulation";

const requestedRuns = Number(process.argv[2] ?? 2_000);
if (!Number.isSafeInteger(requestedRuns) || requestedRuns <= 0) {
  throw new Error("Usage: npm run game:simulate -- [positive run count]");
}

const agents: SimulationAgent[] = ["random", "conservative", "optimised"];
const results = agents.map((agent) => simulateBatch(agent, requestedRuns));

console.table(results.map((result) => ({
  agent: result.agent,
  runs: result.runs,
  wins: result.wins,
  winRate: `${(result.winRate * 100).toFixed(2)}%`,
  averageFinalCredits: result.averageFinalCredits.toLocaleString("en-GB"),
  averageProfit: result.averageProfit.toLocaleString("en-GB"),
})));
