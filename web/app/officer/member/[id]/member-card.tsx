import type { PlayerCard } from "@/lib/player-card";

const power = (value: string | number) => { const n = Number(value); return n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n.toLocaleString("en-GB"); };
const day = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "unknown");
const ago = (value: string | null) => {
  if (!value) return "no sign yet";
  const hours = (Date.now() - new Date(value).getTime()) / 3_600_000;
  return hours < 1 ? "just now" : hours < 48 ? `${Math.round(hours)}h ago` : `${Math.round(hours / 24)}d ago`;
};
const num = (value: number | null) => (value === null ? "?" : String(value));

function Spark({ values }: { values: number[] }) {
  if (values.length < 3) return null;
  const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${28 - ((value - min) / span) * 24}`).join(" ");
  return <svg className="mc-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-label="Power over time" role="img"><polyline points={points} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

/** One member, everything in one place: verdict first, then power, roster, raids and war, contribution. */
export default function MemberCard({ card }: { card: PlayerCard }) {
  const { assessment: a } = card;
  const ticketPct = Math.min(100, Math.round((card.tickets.now / card.tickets.target) * 100));
  return (
    <div className="mc">
      <section className={`mc-verdict is-${a.headline === "Needs a nudge" ? "nudge" : a.headline === "Pillar of the band" ? "pillar" : "steady"}`}>
        <div className="mc-who">
          <span className="mc-avatar" aria-hidden="true">{card.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <h2>{a.headline}</h2>
            <p>{card.role ? `${card.role.toLowerCase()} · ` : ""}level {card.level ?? "?"} · joined {day(card.joinedAt)} ({card.tenureDays} days) · last active {ago(card.lastActivityAt)}{card.discordLinked ? " · Discord linked" : " · no Discord link"}</p>
          </div>
        </div>
        <div className="mc-lists">
          <div><h3>What they bring</h3>{a.strengths.length ? <ul>{a.strengths.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mc-none">Nothing stands out yet.</p>}</div>
          <div className="is-watch"><h3>Keep an eye on</h3>{a.watch.length ? <ul>{a.watch.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mc-none">Nothing to worry about.</p>}</div>
        </div>
      </section>

      <div className="mc-grid">
        <section className="mc-box">
          <h3>Power</h3>
          <p className="mc-big">{power(card.power.galacticPower)} <small>GP</small></p>
          <p className="mc-line">#{card.power.rank} of {card.power.members} · guild average {power(card.power.averageGp)}</p>
          <p className="mc-line">Characters {power(card.power.characterPower)} · ships {power(card.power.shipPower)}</p>
          {card.power.changePct !== null ? <p className={`mc-line ${card.power.changePct >= 0 ? "is-up" : "is-down"}`}>{card.power.changePct >= 0 ? "▲" : "▼"} {Math.abs(card.power.changePct)}% over the history we have</p> : <p className="mc-line">Not enough history for a trend yet.</p>}
          <Spark values={card.power.history} />
        </section>

        <section className="mc-box">
          <h3>Roster</h3>
          <dl className="mc-stats">
            <div><dt>Galactic Legends</dt><dd>{num(card.roster.galacticLegends)}</dd></div>
            <div><dt>Relic units</dt><dd>{num(card.roster.relicUnits)}</dd></div>
            <div><dt>Relic 9</dt><dd>{num(card.roster.relic9)}</dd></div>
            <div><dt>7★ units</dt><dd>{num(card.roster.sevenStars)}</dd></div>
            <div><dt>Ultimates</dt><dd>{num(card.roster.ultimates)}</dd></div>
            <div><dt>Datacrons</dt><dd>{num(card.roster.datacrons)}</dd></div>
          </dl>
          <p className="mc-line">Roster detail checked {ago(card.profileSyncedAt)}</p>
        </section>

        <section className="mc-box">
          <h3>Raids and war</h3>
          <p className="mc-line">Raid tickets {card.tickets.now} of {card.tickets.target}{card.tickets.average !== null ? ` · average ${card.tickets.average}` : ""}</p>
          <i className="mc-bar" aria-hidden="true"><b style={{ width: `${ticketPct}%` }} /></i>
          {card.raids.length ? (
            <ul className="mc-raids">
              {card.raids.map((raid, index) => <li key={index} className={raid.joined ? "is-in" : "is-out"}><span>{raid.label}</span><span>{raid.joined ? `#${raid.rank} of ${raid.of}${raid.damage ? ` · ${power(raid.damage)}` : ""}` : "sat out"}</span></li>)}
            </ul>
          ) : <p className="mc-line">No raid history yet.</p>}
          <p className="mc-line">War: {card.war.joined === null ? "no war running" : card.war.joined ? `joined ${card.war.label ?? ""}` : `did not join ${card.war.label ?? ""}`}</p>
        </section>

        <section className="mc-box">
          <h3>Contribution</h3>
          <dl className="mc-stats">
            <div><dt>Counters added</dt><dd>{card.contribution.countersAdded}</dd></div>
            <div><dt>Counters they use</dt><dd>{card.contribution.countersUsed}</dd></div>
            <div><dt>Tips</dt><dd>{card.contribution.tipsPublished}</dd></div>
            <div><dt>Ideas</dt><dd>{card.contribution.ideasPublished}</dd></div>
            <div><dt>Feedback posts</dt><dd>{card.contribution.feedbackPosts}</dd></div>
            <div><dt>Upgrades, 30 days</dt><dd>{card.contribution.wins30d}</dd></div>
          </dl>
        </section>

        <section className="mc-box mc-wide">
          <h3>Recent activity</h3>
          {card.recent.length ? <ul className="mc-recent">{card.recent.map((item) => <li key={item.at + item.text}><span>{item.text}</span><time dateTime={item.at}>{ago(item.at)}</time></li>)}</ul> : <p className="mc-line">Nothing recorded in the last 30 days.</p>}
        </section>
      </div>
      {card.flags.length ? <p className="mc-flags">On the attention list: {card.flags.join(" · ")}</p> : null}
    </div>
  );
}
