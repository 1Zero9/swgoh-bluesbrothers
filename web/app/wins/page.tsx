import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import { getWinsFeed, type FeedWin } from "@/lib/wins-feed";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "The Wins · Blues Brothers",
  description: "Galactic Legends, ultimates and relics the Blues Brothers have earned, as they happen.",
};

/** Several small wins by one member in a day read better as one line. */
function collapse(wins: FeedWin[]) {
  const headlines = wins.filter((win) => win.tier === "headline");
  const byMember = new Map<string, FeedWin[]>();
  for (const win of wins.filter((item) => item.tier === "standard")) {
    byMember.set(win.who, [...(byMember.get(win.who) ?? []), win]);
  }
  const rolled = [...byMember].map(([who, items]) => ({
    key: `${who}-${items[0].id}`,
    who,
    icon: items[0].icon,
    tag: items.length > 1 ? "Progress" : items[0].tag,
    text: items.length > 1
      ? `made ${items.length} upgrades — ${summarise(items)}`
      : items[0].text,
  }));
  return { headlines, rolled };
}

function summarise(items: FeedWin[]) {
  const relics = items.filter((item) => item.tag === "Relic").length;
  const units = items.filter((item) => item.tag === "New unit").length;
  const parts = [
    relics ? `${relics} relic level-up${relics > 1 ? "s" : ""}` : "",
    units ? `${units} new unit${units > 1 ? "s" : ""}` : "",
    items.some((item) => item.tag === "Datacrons") ? "a datacron" : "",
  ].filter(Boolean);
  return parts.join(", ");
}

export default async function WinsPage() {
  const feed = await getWinsFeed();

  return (
    <main className="intel-shell destination-shell">
      <PageHero
        image="/members-banner.webp"
        imageAlt="The Blues Brothers celebrating"
        eyebrow="The Wins"
        title={<>What the band<br /><em>got done.</em></>}
        description="Every Galactic Legend, ultimate and relic level-up, spotted from real member rosters as the guild sync runs. No fakes, no hand-typed brag lists."
        priority
        syncLabel="The Wins · This week"
      >
        <div className="intel-summary">
          <div><strong>{feed.weekly.galacticLegends}</strong><small>Galactic Legends this week</small></div>
          <div><strong>{feed.weekly.ultimates}</strong><small>Ultimates</small></div>
          <div><strong>{feed.weekly.relics}</strong><small>Relic level-ups</small></div>
          <div><strong>{feed.weekly.members}</strong><small>Members levelled up</small></div>
        </div>
      </PageHero>

      <section className="tw-roster-section">
        <header>
          <div><p className="eyebrow">Last three weeks</p><h2>Win after win</h2></div>
          <p>Wins are spotted when a member&apos;s roster is next refreshed, so a day on this page is the day we noticed it — usually within a day or two of the real thing.</p>
        </header>
        {feed.days.length ? (
          <div className="wins-feed">
            {feed.days.map((day) => {
              const { headlines, rolled } = collapse(day.wins);
              return (
                <section key={day.label} className="wins-day">
                  <h3>{day.label}</h3>
                  {headlines.map((win) => (
                    <article key={win.id} className="win-item win-headline">
                      <span className="win-icon" aria-hidden>{win.icon}</span>
                      <div><p><strong>{win.who}</strong> {win.text}</p><small>{win.tag}</small></div>
                    </article>
                  ))}
                  {rolled.map((win) => (
                    <article key={win.key} className="win-item">
                      <span className="win-icon" aria-hidden>{win.icon}</span>
                      <div><p><strong>{win.who}</strong> {win.text}</p><small>{win.tag}</small></div>
                    </article>
                  ))}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="tw-empty"><strong>No wins spotted yet.</strong><p>This fills in as member rosters refresh during the guild sync.</p></div>
        )}
      </section>

      <IntelFooter message="Spot a win we missed? It shows up the next time that roster refreshes.">
        <Link href="/members">See the roster →</Link>
      </IntelFooter>
    </main>
  );
}
