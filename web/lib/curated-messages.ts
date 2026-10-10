/** Wording for the automatic posts. Pure functions, so the tone is easy to read and test. */

export type CuratedPost = { title: string; description: string; color: number };

const BLUE = 0x3c83ff;
const AMBER = 0xe49b4d;
const GREEN = 0x34d399;

function pick<T>(options: T[], seed: string): T {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
}

function million(value: number) {
  return `${(value / 1_000_000).toFixed(1)}M`;
}

export function formatTenure(days: number) {
  if (days >= 700) return `${(days / 365).toFixed(1)} years`;
  if (days >= 365) return "a year";
  if (days >= 60) return `${Math.round(days / 30)} months`;
  if (days >= 14) return `${Math.round(days / 7)} weeks`;
  return days <= 1 ? "a day" : `${days} days`;
}

export function twResultPost(result: { opponent: string; score: number; opponentScore: number }, seed: string): CuratedPost {
  const { opponent, score, opponentScore } = result;
  const won = score > opponentScore;
  const margin = Math.abs(score - opponentScore) / Math.max(score, opponentScore, 1);
  const line = `**${score.toLocaleString("en-GB")} – ${opponentScore.toLocaleString("en-GB")}** against **${opponent}**.`;

  if (won) {
    const feel = margin < 0.05
      ? pick(["That was close, and we held our nerve.", "A nail-biter, and we got over the line."], seed)
      : margin > 0.2
        ? pick(["A comfortable one. Well played.", "Dominant. Take a bow."], seed)
        : pick(["A solid win.", "Good work everyone."], seed);
    return {
      title: "Territory War: victory",
      description: `${line} ${feel}\n\nWhat was your best moment of the war?`,
      color: GREEN,
    };
  }
  const feel = margin < 0.05
    ? pick(["So close. A handful of points either way.", "Heartbreakingly close."], seed)
    : pick(["Not our day.", "They had the better of it this time."], seed);
  return {
    title: "Territory War: result",
    description: `${line} ${feel}\n\nWhat would you change next time? Tell us in #tw.`,
    color: AMBER,
  };
}

export function welcomePost(member: { name: string; galacticPower: number }): CuratedPost {
  const power = member.galacticPower >= 1_000_000 ? `, ${million(member.galacticPower)} GP` : "";
  return {
    title: "New arrival at the cantina",
    description: `Welcome **${member.name}** to the Blues Brothers${power}. The band just got stronger.\n\nTell us your best squad and what you're working on.`,
    color: BLUE,
  };
}

export function farewellPost(member: { name: string; tenureDays: number }): CuratedPost {
  return {
    title: "Gone, but not forgotten",
    description: `**${member.name}** has moved on after ${formatTenure(member.tenureDays)} with the band. Thanks for the battles. The door's always open.`,
    color: AMBER,
  };
}
