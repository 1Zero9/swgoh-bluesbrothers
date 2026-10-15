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
  const shownWins = wins.slice(0, 4);
  const shownRequests = requests.slice(0, 2);
  const shownCallouts = callouts.slice(0, 2);
  const shownNew = newMembers.slice(0, 3);
  const hero = (
    <section className="hub-hero" aria-label="Welcome">
      <div className="hub-hero-copy">
        <div>
          <p className="hub-eyebrow">{name ? `Welcome, ${name}` : "Welcome"}</p>
          <h1>Ask B-Lue3. Add what you know.</h1>
        </div>
      <section className="hub-askbox" aria-label="Ask B-Lue3">
        <form action="/ask" method="get" className="hub-askform">
          <input name="q" aria-label="Ask B-Lue3" placeholder="How do I beat Lord Vader in TW?" maxLength={500} autoComplete="off" enterKeyHint="send" />
          <button type="submit">Ask</button>
        </form>
        <div className="hub-chips">
          <span>Try:</span>
          {STARTERS.map((starter) => <Link key={starter.q} href={`/ask?q=${encodeURIComponent(starter.q)}`}>{starter.label}</Link>)}
        </div>
        <details className="hub-ask-how">
          <summary>How B-Lue3 answers, and what it costs</summary>
          <AnswerLadder left={questions} compact />
        </details>
      </section>
        {stats ? (
          <ul className="hub-stats" aria-label="The guild now">
            <li><strong>{stats.members}</strong><small>members</small></li>
            <li><strong>{stats.power}</strong><small>guild power</small></li>
            {stats.tickets ? <li><strong>{stats.tickets}</strong><small>tickets today</small></li> : null}
            {stats.legends ? <li><strong>{stats.legends}</strong><small>Galactic Legends</small></li> : null}
          </ul>
        ) : null}
      </div>
      <div className="hub-banner-side" aria-label="You">
        {standing ? (
          <Link className={`hub-standing${checkIn ? " needs-checkin" : ""}`} href="/me">
            <strong>{name}</strong>
            <small>{standing}</small>
            <span>{checkIn ?? "All good. Open my page"}</span>
          </Link>
        ) : null}
        <GetStarted linked={linked} steps={STEPS} compact />
      </div>
    </section>
  );

  return (
    <HubPage backdrop="/bb-title.webp">
      {hero}
      <div className="hub-home-grid">
        <div className="hub-home-top">
        <section className={`hub-card hub-act ${hasWork ? "is-urgent" : "is-clear"}`} aria-labelledby="hub-act-title">
          <p className={`hub-eyebrow${hasWork ? " is-amber" : ""}`}>Act now</p>
          <h2 id="hub-act-title">{hasWork ? "Where the guild needs you" : "Nothing needs you right now"}</h2>

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

          {!hasWork ? (
            <>
              <p className="hub-quiet">The guild is covered. Know a counter or a tip?</p>
              <Link className="hub-how" href="/knowledge">Add what you know</Link>
            </>
          ) : null}
        </section>
      </div>

      <div className="hub-home-cols">
        <section className="hub-card is-new" aria-labelledby="hub-new-title">
          <p className="hub-eyebrow">New members</p>
          <h2 id="hub-new-title">Welcome to the band</h2>
          {shownNew.length ? <ul className="hub-feed">{shownNew.map((member) => <li key={member.id}><strong>{member.name}</strong><small>Joined {member.when}{member.power ? ` · ${member.power} GP` : ""}</small></li>)}</ul> : <p className="hub-quiet">No one new this month.</p>}
          {wire.length ? <Link className="hub-how" href="/overview">More from the Guild Wire</Link> : null}
        </section>

        <section className="hub-card is-wins" aria-labelledby="hub-wins-title">
          <p className="hub-eyebrow">Achievements</p>
          <h2 id="hub-wins-title">The Wins this week</h2>
          {shownWins.length ? <ul className="hub-feed">{shownWins.map((win) => <li key={win.id}><strong>{win.who}</strong><small>{win.text} · {win.when}</small></li>)}</ul> : <p className="hub-quiet">Level a unit and it shows up here.</p>}
          <Link className="hub-how" href="/wins">All the wins</Link>
        </section>

        <section className="hub-card hub-chatcard" aria-labelledby="hub-chat-title">
          <p className="hub-eyebrow">Guild chat</p>
          <h2 id="hub-chat-title">Talk to the band</h2>
          {chat ? <HomeChat channelKey={chat.channelKey} channelLabel={chat.label} signedInAsMember={chat.signedInAsMember} /> : <p className="hub-quiet">Chat is switched off.</p>}
          <div className="hub-chat-links">
            <Link className="hub-how" href="/chat">Open the full chat</Link>
            <a className="hub-button" href={discordUrl} target="_blank" rel="noreferrer">Open Discord</a>
          </div>
        </section>
      </div>

      <div className="hub-status" aria-label="War room">
        {status.map((card) => (
          <Link key={card.key} href={card.href} className={`hub-card hub-status-card is-${card.tone}`}>
            <p className="hub-eyebrow">{card.label}</p>
            <strong>{card.headline}</strong>
            <small>{card.detail}</small>
            {card.bar !== null ? <i className="hub-bar" aria-hidden="true"><b style={{ width: `${card.bar}%` }} /></i> : null}
          </Link>
        ))}
      </div>
      </div>
    </HubPage>
  );
}
