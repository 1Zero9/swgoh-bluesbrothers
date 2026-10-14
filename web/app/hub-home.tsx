import Image from "next/image";
import Link from "next/link";
import GetStarted from "./get-started";
import HubPage from "./hub-page";

export type HomeWireItem = { id: string; title: string; summary: string; when: string };
export type HomeRequest = { id: string; leaderName: string; modeLabel: string };

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

export default function HubHome({ name, linked, standing, checkIn, requests, wire, isOfficer, reviewCount }: HubHomeProps) {
  return (
    <HubPage>
      <section className="hub-welcome">
        <Image src="/bb-title.webp" alt="The Blues Brothers outside their cantina in a desert spaceport" fill priority sizes="(max-width: 1023px) 100vw, 880px" />
        <div>
          <p className="hub-eyebrow">{name ? `Welcome, ${name}` : "Welcome"}</p>
          <h1>This is where the guild keeps what it knows.</h1>
        </div>
      </section>

      <div className="hub-home-grid">
        <div className="hub-home-main">
          <section className="hub-askbox" aria-labelledby="hub-ask-title">
            <div className="hub-askbox-head">
              <Image src="/blue.png" alt="" width={56} height={56} />
              <h2 id="hub-ask-title">Ask B-Lue3 anything about the game</h2>
            </div>
            <p>He checks what the guild already knows first. That costs you nothing.</p>
            <form action="/ask" method="get" className="hub-askform">
              <input name="q" aria-label="Ask B-Lue3" placeholder="How do I beat Lord Vader in TW?" maxLength={500} autoComplete="off" enterKeyHint="send" />
              <button type="submit">Ask</button>
            </form>
            <div className="hub-chips">
              {STARTERS.map((starter) => <Link key={starter.q} href={`/ask?q=${encodeURIComponent(starter.q)}`}>{starter.label}</Link>)}
            </div>
            <Link className="hub-how" href="/ask">How B-Lue3 answers, and what it costs</Link>
          </section>

          {requests.length ? (
            <section className="hub-card hub-needs" aria-labelledby="hub-needs-title">
              <p className="hub-eyebrow is-amber">The guild needs you</p>
              <h2 id="hub-needs-title">{requests.length === 1 ? "Someone needs a counter" : `${requests.length} squads need a counter`}</h2>
              <ul>
                {requests.map((request) => <li key={request.id}><strong>{request.leaderName}</strong><small>{request.modeLabel}</small></li>)}
              </ul>
              <Link className="hub-button" href="/knowledge">I have one, add it</Link>
            </section>
          ) : null}

          {isOfficer && reviewCount > 0 ? (
            <Link className="hub-card hub-officer-note" href="/knowledge/review">
              <strong>{reviewCount} item{reviewCount === 1 ? "" : "s"} waiting for your check</strong>
              <small>Open the review queue</small>
            </Link>
          ) : null}
        </div>

        <div className="hub-home-side">
          {standing ? (
            <Link className={`hub-card hub-standing${checkIn ? " needs-checkin" : ""}`} href="/me">
              <strong>{name}</strong>
              <small>{standing}</small>
              <span>{checkIn ?? "All good. Open my page"}</span>
            </Link>
          ) : null}
          <GetStarted linked={linked} steps={STEPS} />
          {wire.length ? (
            <section className="hub-section" aria-labelledby="hub-new-title">
              <h2 id="hub-new-title" className="hub-section-title">New from the guild</h2>
              <ul className="hub-wire">
                {wire.map((item) => <li key={item.id}><strong>{item.title}</strong><small>{item.summary} · {item.when}</small></li>)}
              </ul>
              <Link className="hub-how" href="/overview">See the full guild overview</Link>
            </section>
          ) : null}
        </div>
      </div>
    </HubPage>
  );
}
