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

export type WeeklyPublicStats = {
  members: number;
  capacity: number;
  week: { galacticLegends: number; ultimates: number; relicLevels: number; newRelicNine: number };
  totals: { galacticLegends: number; relicNine: number; relicSevenPlus: number };
  lastWar: { won: boolean; score: number; opponentScore: number } | null;
  requirements: { minGalacticPower: number; minGalacticLegends: number };
  siteUrl: string;
};

function plural(count: number, one: string, many = `${one}s`) {
  return `${count.toLocaleString("en-GB")} ${count === 1 ? one : many}`;
}

/** The weekly post for the public channel: numbers only, never a member's name. */
export function weeklyPublicPost(stats: WeeklyPublicStats): CuratedPost {
  const spaces = Math.max(0, stats.capacity - stats.members);
  const lines: string[] = [];

  lines.push(
    spaces === 0
      ? `**Members:** ${stats.members}/${stats.capacity}. Full house. Stay tuned for open slots.`
      : `**Members:** ${stats.members}/${stats.capacity}. ${plural(spaces, "seat")} open on the stage.`,
  );

  const done = [
    stats.week.galacticLegends ? plural(stats.week.galacticLegends, "new Galactic Legend") : "",
    stats.week.ultimates ? plural(stats.week.ultimates, "new ultimate") : "",
    stats.week.newRelicNine ? plural(stats.week.newRelicNine, "new Relic 9 unit") : "",
    stats.week.relicLevels ? plural(stats.week.relicLevels, "relic level-up") : "",
  ].filter(Boolean);
  lines.push(
    done.length
      ? `**This week the band added:** ${done.join(" · ")}.`
      : "**This week:** a quiet one on the roster. The band's regrouping.",
  );

  lines.push(
    `**Across the guild:** ${plural(stats.totals.galacticLegends, "Galactic Legend")} · ${plural(stats.totals.relicNine, "Relic 9 unit")} · ${plural(stats.totals.relicSevenPlus, "unit")} at Relic 7+.`,
  );

  if (stats.lastWar) {
    const score = `${stats.lastWar.score.toLocaleString("en-GB")}–${stats.lastWar.opponentScore.toLocaleString("en-GB")}`;
    lines.push(`**Territory War:** ${stats.lastWar.won ? "victory" : "a tough one"} last time out, ${score}.`);
  }

  lines.push(
    `Want in? We ask ${stats.requirements.minGalacticPower / 1_000_000}M GP and ${stats.requirements.minGalacticLegends}+ Galactic Legends. Check yours: ${stats.siteUrl}/#check-stats`,
  );

  return { title: "This week in the Blues Brothers", description: lines.join("\n\n"), color: 0xfbbf24 };
}

/** Posted when a seat opens up. */
export function slotsOpenPost(input: {
  spaces: number;
  requirements: { minGalacticPower: number; minGalacticLegends: number };
  siteUrl: string;
}): CuratedPost {
  const seats = input.spaces === 1 ? "A seat has" : `${input.spaces} seats have`;
  return {
    title: "We're putting the band back together",
    description:
      `${seats} just opened on the stage. If you've got ${input.requirements.minGalacticPower / 1_000_000}M GP and ${input.requirements.minGalacticLegends}+ Galactic Legends, and you're ready to turn up and have fun, you're on a mission from the Force.\n\n` +
      `Check you fit: ${input.siteUrl}/#check-stats\nThen say hello in here, or search for **Blues Brothers** in-game.`,
    color: BLUE,
  };
}

export function promptPost(prompt: { text: string }): CuratedPost {
  return {
    title: "Question of the week",
    description: `${prompt.text}\n\nAnswer in here. One line is plenty.`,
    color: BLUE,
  };
}

export function milestonePost(input: { name: string; mention?: string; kind: "FIRST_R9" | "GL_5" | "GL_10"; unitName?: string | null }): CuratedPost {
  const who = input.mention ?? `**${input.name}**`;
  if (input.kind === "FIRST_R9") {
    return {
      title: "A first Relic 9",
      description: `${who} just took ${input.unitName ?? "a unit"} to **Relic 9**, their first ever. Take a bow.\n\nWhat's the next one on the list?`,
      color: GREEN,
    };
  }
  if (input.kind === "GL_5") {
    return {
      title: "Five Galactic Legends",
      description: `${who} has unlocked their **5th Galactic Legend**${input.unitName ? `: ${input.unitName}` : ""}. That's the entry bar for new recruits, cleared.\n\nWhich one are they chasing next?`,
      color: GREEN,
    };
  }
  return {
    title: "Ten Galactic Legends",
    description: `${who} has unlocked their **10th Galactic Legend**${input.unitName ? `: ${input.unitName}` : ""}. Double figures. Absolute legend.`,
    color: GREEN,
  };
}

export function anniversaryPost(input: { name: string; mention?: string; years: number }): CuratedPost {
  const who = input.mention ?? `**${input.name}**`;
  return {
    title: input.years === 1 ? "One year with the band" : `${input.years} years with the band`,
    description: `${who} joined the Blues Brothers ${input.years === 1 ? "a year" : `${input.years} years`} ago today. Thanks for turning up.\n\nWhat's your best memory from the guild?`,
    color: BLUE,
  };
}
