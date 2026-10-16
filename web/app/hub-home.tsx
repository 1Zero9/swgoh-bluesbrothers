import Link from "next/link";
import AnswerLadder from "./answer-ladder";
import GetStarted from "./get-started";
import HomeChat from "./home-chat";
import HubPage from "./hub-page";
import type { StatusCard } from "@/lib/home-status";

export type HomeWireItem = { id: string; title: string; summary: string; when: string };
export type HomeRequest = { id: string; leaderName: string; modeLabel: string };
export type HomeNewcomer = { id: string; name: string; when: string; power: string | null };
export type HomeCallout = { id: string; unit: string; need: string; where: string | null };
export type HomeWin = { id: string; who: string; text: string; when: string };

export type HubHomeProps = {
  name: string | null;
  linked: boolean;
  /** "1.2B GP · 6 raid tickets", when the member is linked */
  standing: string | null;
  checkIn: string | null;
  requests: HomeRequest[];
  wire: HomeWireItem[];
  isOfficer: boolean;
  reviewCount: number;
  stats: { members: string; power: string; tickets: string | null; legends: string | null } | null;
  wins: HomeWin[];
  newMembers: HomeNewcomer[];
  callouts: HomeCallout[];
  chat: { channelKey: string; label: string; signedInAsMember: boolean } | null;
  discordUrl: string;
  status: StatusCard[];
  /** B-Lue3 allowance this week, when his AI is switched on. */
  questions: { left: number; limit: number; resetsLabel: string } | null;
};

const STARTERS = [
  { label: "Beat a squad", q: "How do I beat Lord Vader in Territory War?" },
  { label: "Who has a unit?", q: "Who has Jabba?" },
  { label: "What to farm", q: "What should I farm next?" },
];

const STEPS = [
  { key: "ask", title: "Ask B-Lue3 your first question", hint: "Takes ten seconds", href: "/ask" },
  { key: "share", title: "Add one thing you know", hint: "A counter, a tip or an idea", href: "/knowledge" },
];

export default function HubHome({ name, linked, standing, checkIn, requests, wire, isOfficer, reviewCount, questions, stats, wins, status, newMembers, callouts, chat, discordUrl }: HubHomeProps) {
  const hasWork = requests.length > 0 || callouts.length > 0 || (isOfficer && reviewCount > 0);
  const shownWins = wins.slice(0, 3);
  const shownRequests = requests.slice(0, 2);
  const shownCallouts = callouts.slice(0, 2);
  const shownNew = newMembers.slice(0, 3);
  const glance = stats ? [
    { value: stats.members, label: "members" },
    { value: stats.power, label: "guild power" },
    ...(stats.tickets ? [{ value: stats.tickets, label: "tickets today" }] : []),
    ...(stats.legends ? [{ value: stats.legends, label: "Galactic Legends" }] : []),
  ] : [];

  return (
    <HubPage backdrop="/bb-title.webp">
      <GetStarted
        linked={linked}
        steps={STEPS}
        compact
        name={name}
        aside={standing ? (
          <Link className={`hub-standing${checkIn ? " needs-checkin" : ""}`} href="/me">
            <small>{standing}</small>
            <span>{checkIn ?? "My page"}</span>
          </Link>
        ) : null}
      />
      <section className="hub-hero" aria-label="Welcome">
        <div className="hub-hero-copy">
          <div>
            <h1>Ask B-Lue3. Add what you know.</h1>
            <p className="hub-hero-sub">B-Lue3 is the guild&apos;s droid. Ask him about squads, counters and who has what, then teach him something he doesn&apos;t know yet.</p>
          </div>
          <div className="hub-askbox" role="search" aria-label="Ask B-Lue3">
            <form action="/ask" method="get" className="hub-askform">
              <input name="q" aria-label="Ask B-Lue3" placeholder="How do I beat Lord Vader in TW?" maxLength={500} autoComplete="off" enterKeyHint="send" />
              <button type="submit">Ask</button>
            </form>
            <div className="hub-chips">
              {STARTERS.map((starter) => <Link key={starter.q} href={`/ask?q=${encodeURIComponent(starter.q)}`}>{starter.label}</Link>)}
            </div>
            <details className="hub-ask-how">
              <summary>How B-Lue3 answers, and what it costs</summary>
              <AnswerLadder left={questions} compact />
            </details>
          </div>
          {glance.length ? (
            <ul className="hub-glance" aria-label="The guild now">
              {glance.map((item) => <li key={item.label}><strong>{item.value}</strong> {item.label}</li>)}
            </ul>
          ) : null}
          <div className="hub-strip" aria-label="War room">
            {status.map((card) => (
              <Link key={card.key} href={card.href} className={`hub-strip-item is-${card.tone}`}>
                <p className="hub-eyebrow">{card.label}</p>
                <strong>{card.headline}</strong>
                <small>{card.detail}</small>
                {card.bar !== null ? <i className="hub-bar" aria-hidden="true"><b style={{ width: `${card.bar}%` }} /></i> : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="hub-home-calm">

        <div className={`hub-feeds${hasWork ? " has-act" : ""}`}>
          {hasWork ? (
            <section className="hub-card hub-act is-urgent" aria-labelledby="hub-act-title">
              <p className="hub-eyebrow is-amber">Act now</p>
              <h2 id="hub-act-title">Where the guild needs you</h2>
              {requests.length ? (
                <>
                  <h3>Counters wanted</h3>
                  <ul className="hub-feed">{shownRequests.map((request) => <li key={request.id}><strong>{request.leaderName}</strong><small>{request.modeLabel}</small></li>)}</ul>
                  <Link className="hub-button" href="/knowledge">I have one, add it</Link>
                </>
              ) : null}
              {callouts.length ? (
                <>
                  <h3>Territory Battle callouts</h3>
                  <ul className="hub-feed">{shownCallouts.map((callout) => <li key={callout.id}><strong>{callout.unit}</strong><small>{callout.need}{callout.where ? ` · ${callout.where}` : ""}</small></li>)}</ul>
                  <Link className="hub-how" href="/territory-battles">See all callouts</Link>
                </>
              ) : null}
              {isOfficer && reviewCount > 0 ? <Link className="hub-officer-note" href="/knowledge/review"><strong>{reviewCount} waiting for your check</strong><small>Open the review queue</small></Link> : null}
            </section>
          ) : null}

          <section className="hub-card is-wins" aria-labelledby="hub-wins-title">
            <p className="hub-eyebrow">Achievements</p>
            <h2 id="hub-wins-title">The Wins this week</h2>
            {shownWins.length ? <ul className="hub-feed">{shownWins.map((win) => <li key={win.id}><strong>{win.who}</strong><small>{win.text} · {win.when}</small></li>)}</ul> : <p className="hub-quiet">Level a unit and it shows up here.</p>}
            <Link className="hub-how" href="/wins">All the wins</Link>
          </section>

          <section className="hub-card is-new" aria-labelledby="hub-new-title">
            <p className="hub-eyebrow">New members</p>
            <h2 id="hub-new-title">Welcome to the band</h2>
            {shownNew.length ? <ul className="hub-feed">{shownNew.map((member) => <li key={member.id}><strong>{member.name}</strong><small>Joined {member.when}{member.power ? ` · ${member.power} GP` : ""}</small></li>)}</ul> : <p className="hub-quiet">No one new this month.</p>}
            {wire.length ? <Link className="hub-how" href="/overview">More from the Guild Wire</Link> : null}
          </section>
        </div>

        {chat ? (
          <details className="hub-card hub-chatcard is-folded">
            <summary><span className="hub-eyebrow">Guild chat</span><span>Talk to the band</span></summary>
            <HomeChat channelKey={chat.channelKey} channelLabel={chat.label} signedInAsMember={chat.signedInAsMember} />
          </details>
        ) : null}

        <p className="hub-home-foot">
          <Link href="/chat">Guild chat</Link>
          <a href={discordUrl} target="_blank" rel="noreferrer">Open Discord</a>
        </p>
      </div>
    </HubPage>
  );
}
