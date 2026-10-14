/** The three status cards on Home: war, battles, raids. Plain words from what the game data really gives us. */

export type StatusCard = { key: "tw" | "tb" | "raids"; label: string; headline: string; detail: string; href: string; tone: "good" | "warn" | "plain"; bar: number | null };

type TwResult = { opponent: string; score: number; opponentScore: number; won: boolean; endedAt: Date | null };

export type StatusInput = {
  tw: { wins: number; losses: number; recent: TwResult[] };
  openCallouts: number | null;
  tickets: { today: number; target: number } | null;
  lastRaid: { label: string; outcomeLabel: string } | null;
};

const when = (date: Date | null) => (date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }) : "");

export function buildStatusRow(input: StatusInput): StatusCard[] {
  const last = input.tw.recent[0];
  const played = input.tw.wins + input.tw.losses;
  // The game does not show a war in progress to outsiders, so this is the last finished war, not a live score.
  const tw: StatusCard = last
    ? {
        key: "tw", label: "Territory War", href: "/territory-war", tone: last.won ? "good" : "warn", bar: played ? Math.round((input.tw.wins / played) * 100) : null,
        headline: `${last.won ? "Won" : "Lost"} vs ${last.opponent}`,
        detail: `${last.score.toLocaleString("en-GB")} to ${last.opponentScore.toLocaleString("en-GB")}${last.endedAt ? ` · ${when(last.endedAt)}` : ""} · ${input.tw.wins} wins in the last ${played}`,
      }
    : { key: "tw", label: "Territory War", href: "/territory-war", tone: "plain", bar: null, headline: "No wars recorded yet", detail: "The last finished war shows here." };

  const open = input.openCallouts;
  const tb: StatusCard = {
    key: "tb", label: "Territory Battles", href: "/territory-battles", bar: null,
    tone: open ? "warn" : "plain",
    headline: open === null ? "See the planets" : open === 0 ? "No callouts open" : `${open} callout${open === 1 ? "" : "s"} open`,
    detail: open ? "Officers need specific units. Check if you can help." : "Planets, platoons and the star plan are on the page.",
  };

  const pct = input.tickets && input.tickets.target > 0 ? Math.min(100, Math.round((input.tickets.today / input.tickets.target) * 100)) : null;
  const raids: StatusCard = {
    key: "raids", label: "Raids", href: "/raids", bar: pct, tone: pct !== null && pct >= 90 ? "good" : "plain",
    headline: input.tickets ? `${input.tickets.today.toLocaleString("en-GB")} of ${input.tickets.target.toLocaleString("en-GB")} tickets` : "Tickets and results",
    detail: input.lastRaid ? `Last raid: ${input.lastRaid.label}, ${input.lastRaid.outcomeLabel.toLowerCase()}` : "Guild tickets today and the latest raid.",
  };
  return [tw, tb, raids];
}
