import Image from "next/image";
import packageInfo from "../package.json";
import { getDiscordUrl } from "@/lib/discord";
import { getGuildWire } from "@/lib/guild-wire";
import MobileMenu from "./mobile-menu";
import ThemeToggle from "./theme-toggle";

const APP_VERSION = `v${packageInfo.version}`;
export const dynamic = "force-dynamic";

const navigation = [
  ["Guild Wire", "GW"],
  ["Operations", "OP"],
  ["Members", "MB"],
];

const eventCards = [
  {
    id: "territory-battles",
    eyebrow: "Territory battle",
    title: "Rise of the Empire",
    status: "Awaiting schedule",
    copy: "Mission loadouts, operations and deployment plans will appear here when event sync is enabled.",
    action: "Preview TB planner",
    tone: "blue",
  },
  {
    id: "territory-war",
    eyebrow: "Territory war",
    title: "The next gig",
    status: "No active war",
    copy: "Registration, defensive assignments and the opponent counter board will share one live plan.",
    action: "Preview TW board",
    tone: "amber",
  },
  {
    id: "raids",
    eyebrow: "Raid operations",
    title: "Guild raid",
    status: "Ready to track",
    copy: "Roster readiness, attempts and personal score history will be collected after database setup.",
    action: "View raid readiness",
    tone: "red",
  },
];

const activity = [
  ["Daily officer report delivered", "Discord", "23:00"],
  ["49-member baseline captured", "Comlink", "22:00"],
  ["Membership ledger prepared", "System", "Ready"],
];

function Mark({ label }: { label: string }) {
  return <span className="nav-mark" aria-hidden="true">{label}</span>;
}

export default async function Home() {
  const guildWire = await getGuildWire();
  const discordUrl = getDiscordUrl();
  const discordGuildId = process.env.DISCORD_GUILD_ID;
  const showDiscordWidget = process.env.DISCORD_WIDGET_ENABLED === "true" && Boolean(discordGuildId);

  return (
    <main className="app-shell">
      <section className="workspace" id="top">
        <section className="hero" id="command-centre" aria-labelledby="mission-heading">
          <Image
            className="hero-image"
            src="/bb-title.png"
            alt="The Blues Brothers outside their cantina in a desert spaceport"
            fill
            priority
            sizes="(max-width: 760px) 100vw, calc(100vw - 246px)"
          />
          <div className="hero-shade" />
          <header className="site-header">
            <a className="brand" href="#top" aria-label="Blues Brothers guild command centre">
              <Image className="brand-logo" src="/bb-logo.png" alt="" width={136} height={136} priority />
              <span><strong>Blues Brothers</strong><small>Guild command</small></span>
            </a>
            <nav className="main-nav" aria-label="Primary navigation">
              {navigation.map(([label, mark]) => (
                <a className="nav-link" href={`#${label.toLowerCase().replaceAll(" ", "-")}`} key={label}>
                  <Mark label={mark} />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
            <div className="header-controls">
              <span className="version-label">{APP_VERSION}</span>
              <ThemeToggle />
              <a className="discord-button" href={discordUrl} target="_blank" rel="noreferrer" aria-label="Open Blues Brothers Discord">
                <span aria-hidden="true">◈</span><b>Open Discord</b>
              </a>
            </div>
            <MobileMenu items={navigation} version={APP_VERSION} discordUrl={discordUrl} />
          </header>
          <div className="hero-copy">
            <div className="hero-status"><span><i /> Comlink connected</span><time>Wednesday, 19 August</time></div>
            <p className="eyebrow">The roster. The plan. The next mission.</p>
            <h1 id="mission-heading">On a mission<br /><em>from the Force.</em></h1>
            <p>Live guild data comes in. Clear officer actions and mission calls go straight out to the band in Discord.</p>
            <div className="hero-actions">
              <a className="primary-action" href="#administration">Review officer actions</a>
              <a className="secondary-action" href="#members">View guild roster <span>→</span></a>
            </div>
          </div>
        </section>

        <div className="dashboard-content">
        <section className="metric-grid" aria-label="Guild health">
          <article className="metric-card">
            <div className="metric-head"><span>Active members</span><Mark label="MB" /></div>
            <strong>49<span>/50</span></strong>
            <p><b className="good">●</b> One place available</p>
          </article>
          <article className="metric-card">
            <div className="metric-head"><span>Guild power</span><Mark label="GP" /></div>
            <strong>571.7<span>M</span></strong>
            <p>Baseline ready for trends</p>
          </article>
          <article className="metric-card">
            <div className="metric-head"><span>Daily tickets</span><Mark label="TK" /></div>
            <strong>25,936</strong>
            <div className="progress-track"><i style={{ width: "88.2%" }} /></div>
            <p>88.2% of 29,400 target</p>
          </article>
          <article className="metric-card attention">
            <div className="metric-head"><span>Needs attention</span><Mark label="!" /></div>
            <strong>1</strong>
            <p>Member inactive over 24h</p>
          </article>
        </section>

        <section className="guild-wire" id="guild-wire" aria-labelledby="guild-wire-heading">
          <div className="wire-feed">
            <div className="section-heading wire-heading">
              <div><p className="eyebrow">Guild communications</p><h2 id="guild-wire-heading">The Guild Wire</h2></div>
              <span className="wire-sync"><i /> Website + Discord</span>
            </div>
            <p className="wire-intro">Guild news lives here. The same membership announcements are sent into Discord, where the conversation continues.</p>
            <div className="wire-list">
              {guildWire.map((item) => (
                <article className={`wire-item wire-${item.kind}`} key={item.id}>
                  <span className="wire-icon" aria-hidden="true">{item.kind === "welcome" ? "+" : item.kind === "departure" ? "↗" : "↻"}</span>
                  <div>
                    <div className="wire-meta"><span>{item.title}</span><time dateTime={item.occurredAt.toISOString()}>{item.occurredAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time></div>
                    <p>{item.summary}</p>
                  </div>
                  <span className={`wire-state state-${item.status}`}>{item.status}</span>
                </article>
              ))}
            </div>
          </div>

          <aside className="discord-handoff" aria-label="Discord conversation">
            <div className="discord-handoff-head"><span className="discord-glyph">◈</span><div><p>Conversation layer</p><strong>Discord stays live</strong></div></div>
            {showDiscordWidget ? (
              <iframe
                className="discord-widget"
                src={`https://discord.com/widget?id=${discordGuildId}&theme=dark`}
                title="Blues Brothers Discord server presence"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              />
            ) : (
              <div className="widget-placeholder">
                <span><i /> Discord connected</span>
                <p>Enable the Discord server widget to show live presence here. Messages remain private inside Discord.</p>
              </div>
            )}
            <a className="discord-open" href={discordUrl} target="_blank" rel="noreferrer">Open the conversation in Discord <span>→</span></a>
            <small>Replies, reactions and officer discussion happen securely in the Discord app.</small>
          </aside>
        </section>

        <section className="section-block" id="operations">
          <div className="section-heading">
            <div><p className="eyebrow">Operations board</p><h2>Upcoming missions</h2></div>
            <a href="#playbook">Open guild playbook <span>→</span></a>
          </div>
          <div className="event-grid">
            {eventCards.map((event) => (
              <article className={`event-card ${event.tone}`} id={event.id} key={event.eyebrow}>
                <div className="event-top"><span>{event.eyebrow}</span><i>{event.status}</i></div>
                <div className="event-symbol" aria-hidden="true"><span>{event.eyebrow.split(" ").map((word) => word[0]).join("")}</span></div>
                <h3>{event.title}</h3>
                <p>{event.copy}</p>
                <button type="button" disabled>{event.action}<span>→</span></button>
              </article>
            ))}
          </div>
        </section>

        <div className="lower-grid">
          <section className="panel" id="members">
            <div className="panel-heading"><div><p className="eyebrow">Membership</p><h2>The band</h2></div><a href="#administration">View ledger</a></div>
            <div className="member-summary">
              <div className="avatar-stack" aria-hidden="true"><i>J</i><i>K</i><i>L</i><i>+46</i></div>
              <div><strong>49 active members</strong><p>Tracking starts with the first database sync.</p></div>
            </div>
            <div className="welcome-flow">
              <span className="flow-icon">+</span>
              <div><strong>New joiner automation</strong><p>Detect → record tenure → welcome in Discord → open officer checklist</p></div>
              <span className="ready-pill">Ready to wire</span>
            </div>
            <div className="welcome-flow muted-flow">
              <span className="flow-icon">↗</span>
              <div><strong>Departure history</strong><p>Close tenure → preserve snapshots → remove assignments → notify officers</p></div>
              <span className="ready-pill">Ready to wire</span>
            </div>
          </section>

          <section className="panel" id="administration">
            <div className="panel-heading"><div><p className="eyebrow">Automation feed</p><h2>What the droid did</h2></div><span className="live-pill"><i /> Live</span></div>
            <div className="activity-list">
              {activity.map(([title, source, time], index) => (
                <div className="activity-row" key={title}>
                  <span className={`activity-icon activity-${index}`}>{index === 0 ? "◈" : index === 1 ? "↻" : "✓"}</span>
                  <div><strong>{title}</strong><p>{source}</p></div>
                  <time>{time}</time>
                </div>
              ))}
            </div>
            <button className="feed-button" type="button" disabled>Open full administration log <span>→</span></button>
          </section>
        </div>

        <footer>
          <span>Blues Brothers Droid · Guild command {APP_VERSION}</span>
          <span>On a mission from the Force.</span>
        </footer>
        </div>
      </section>
    </main>
  );
}
