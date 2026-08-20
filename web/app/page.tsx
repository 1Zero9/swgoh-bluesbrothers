import { cookies } from "next/headers";
import Image from "next/image";
import packageInfo from "../package.json";
import { getDashboardSummary } from "@/lib/dashboard";
import { getDiscordUrl } from "@/lib/discord";
import { getGuildWire } from "@/lib/guild-wire";
import { getMemberContext } from "@/lib/member-context";
import { getRosterMembers } from "@/lib/members";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getWallOfFame } from "@/lib/wall-of-fame";
import { getWallOfShame } from "@/lib/wall-of-shame";
import AccountLink from "./account-link";
import MemberDirectory from "./member-directory";
import MobileMenu from "./mobile-menu";
import OfficerDesk from "./officer-desk";
import ThemeToggle from "./theme-toggle";

const APP_VERSION = `v${packageInfo.version}`;
export const dynamic = "force-dynamic";

const navigation = [
  ["Guild Wire", "GW"],
  ["Operations", "OP"],
  ["Members", "MB"],
  ["Wall of Fame", "WF"],
  ["Wall of Shame", "WS"],
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

function Mark({ label }: { label: string }) {
  return <span className="nav-mark" aria-hidden="true">{label}</span>;
}

function formatPower(value: bigint) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return { value: "0", unit: "" };
  if (num >= 1_000_000_000) return { value: (num / 1_000_000_000).toFixed(2), unit: "B" };
  if (num >= 1_000_000) return { value: (num / 1_000_000).toFixed(1), unit: "M" };
  if (num >= 1_000) return { value: (num / 1_000).toFixed(1), unit: "K" };
  return { value: num.toLocaleString("en-GB"), unit: "" };
}

function formatRelativeTime(date: Date) {
  const diffHours = (Date.now() - date.getTime()) / 3_600_000;
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  const diffDays = diffHours / 24;
  if (diffDays < 7) return `${Math.round(diffDays)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function wireIcon(kind: string) {
  if (kind === "welcome") return "+";
  if (kind === "departure") return "↗";
  if (kind === "notice") return "\u270E";
  return "↻";
}

export default async function Home() {
  const [guildWire, summary, wallOfShame, wallOfFame, rosterMembers, officerStore, memberContext] = await Promise.all([
    getGuildWire(),
    getDashboardSummary(),
    getWallOfShame(),
    getWallOfFame(),
    getRosterMembers(),
    cookies(),
    getMemberContext(),
  ]);
  const isOfficer = verifyOfficerSessionValue(officerStore.get(OFFICER_COOKIE_NAME)?.value);
  const discordUrl = getDiscordUrl();
  const discordGuildId = process.env.DISCORD_GUILD_ID;
  const showDiscordWidget = process.env.DISCORD_WIDGET_ENABLED === "true" && Boolean(discordGuildId);

  const power = formatPower(summary.guildPower);
  const openSeats = summary.capacity - summary.memberCount;
  const ticketPct = summary.live && summary.ticketTarget > 0
    ? Math.min(100, Math.round((summary.dailyTickets / summary.ticketTarget) * 1000) / 10)
    : 0;

  const heroStatusLabel = summary.live ? "Comlink connected" : "Awaiting first sync";
  const heroStatusDate = summary.capturedAt
    ? summary.capturedAt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const syncLabel = summary.capturedAt
    ? `Comlink connected · Last capture ${formatRelativeTime(summary.capturedAt)}`
    : "Awaiting first Comlink sync";

  const activityRows = guildWire.slice(0, 4);
  const memberDirectoryEntries = rosterMembers.map((member) => ({
    ...member,
    galacticPower: member.galacticPower.toString(),
    lastActivityAt: member.lastActivityAt?.toISOString() ?? null,
    joinedAt: member.joinedAt?.toISOString() ?? null,
  }));

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
            <MobileMenu items={navigation} version={APP_VERSION} discordUrl={discordUrl} syncLabel={syncLabel} />
          </header>
          <div className="hero-copy">
            <div className="hero-status"><span><i /> {heroStatusLabel}</span><time>{heroStatusDate}</time></div>
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
            <strong>{summary.live ? summary.memberCount : "—"}<span>/{summary.capacity}</span></strong>
            <p>
              {summary.live
                ? openSeats > 0
                  ? <><b className="good">●</b> {openSeats} place{openSeats === 1 ? "" : "s"} available</>
                  : "Cantina's full up tonight"
                : "Awaiting first roster sync"}
            </p>
          </article>
          <article className="metric-card">
            <div className="metric-head"><span>Guild power</span><Mark label="GP" /></div>
            <strong>{summary.live ? power.value : "—"}<span>{summary.live ? power.unit : ""}</span></strong>
            <p>{summary.live ? "Live from the latest Comlink sync" : "Baseline appears after first sync"}</p>
          </article>
          <article className="metric-card">
            <div className="metric-head"><span>Daily tickets</span><Mark label="TK" /></div>
            <strong>{summary.live ? summary.dailyTickets.toLocaleString("en-GB") : "—"}</strong>
            <div className="progress-track"><i style={{ width: `${summary.live ? ticketPct : 0}%` }} /></div>
            <p>{summary.live ? `${ticketPct}% of ${summary.ticketTarget.toLocaleString("en-GB")} target` : "Tracking starts with the first sync"}</p>
          </article>
          <article className={`metric-card${wallOfShame.length ? " attention" : ""}`}>
            <div className="metric-head"><span>Needs attention</span><Mark label="!" /></div>
            <strong>{wallOfShame.length}</strong>
            <p>
              {wallOfShame.length
                ? "On the Wall of Shame right now"
                : summary.live
                  ? "Everyone is pulling their weight"
                  : "Awaiting first roster sync"}
            </p>
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
                  <span className="wire-icon" aria-hidden="true">{wireIcon(item.kind)}</span>
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

        <section className="section-block roster-section" id="members" aria-labelledby="members-heading">
          <div className="section-heading roster-heading">
            <div><p className="eyebrow">Membership directory</p><h2 id="members-heading">Meet the band</h2></div>
            <div className="roster-count"><strong>{rosterMembers.length || "—"}</strong><span>active crew</span></div>
          </div>
          <p className="section-intro">Search the full roster, compare the live numbers, and open any member for a clearer view of their standing.</p>
          <MemberDirectory members={memberDirectoryEntries} />
        </section>

        <section className="section-block standings-section" aria-labelledby="standings-heading">
          <div className="section-heading standings-heading">
            <div><p className="eyebrow">Guild standings</p><h2 id="standings-heading">Legends &amp; watchlist</h2></div>
            <span>One board to celebrate. One board to act on.</span>
          </div>
          <div className="standings-grid">
            <section className="standing-panel fame-panel" id="wall-of-fame" aria-labelledby="wof-heading">
              <header className="standing-panel-head">
                <div><span className="standing-symbol">★</span><p>Cantina legends</p><h3 id="wof-heading">Wall of Fame</h3></div>
                <strong>{wallOfFame.length}<small>top crew</small></strong>
              </header>
              <p className="standing-copy">The strongest members in the latest guild snapshot, ranked by galactic power.</p>
              {wallOfFame.length ? (
                <ol className="standing-list fame-list">
                  {wallOfFame.map((entry) => (
                    <li key={entry.playerId}>
                      <a href={`#member-${entry.playerId}`}>
                        <span className="standing-rank">{entry.rank}</span>
                        <span className="standing-avatar" aria-hidden="true">{entry.name.charAt(0).toUpperCase()}</span>
                        <span className="standing-member"><strong>{entry.name}</strong><small>{entry.badges[0] || "Top five guild power"}</small></span>
                        <span className="standing-value"><strong>{formatPower(entry.galacticPower).value}{formatPower(entry.galacticPower).unit}</strong><small>GP</small></span>
                        <span className="standing-arrow">→</span>
                      </a>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="standing-empty"><strong>No legends crowned yet</strong><p>{summary.live ? "Power rankings appear once enough members are tracked." : "The board opens after the first roster sync."}</p></div>
              )}
            </section>

            <section className="standing-panel watch-panel" id="wall-of-shame" aria-labelledby="wos-heading">
              <header className="standing-panel-head">
                <div><span className="standing-symbol">!</span><p>Officer watchlist</p><h3 id="wos-heading">Needs a check-in</h3></div>
                <strong>{wallOfShame.length}<small>flagged</small></strong>
              </header>
              <p className="standing-copy">A practical shortlist for activity and roster follow-up—not a permanent label.</p>
              {wallOfShame.length ? (
                <ul className="standing-list watch-list">
                  {wallOfShame.map((entry) => (
                    <li key={entry.playerId}>
                      <a href={`#member-${entry.playerId}`}>
                        <span className="standing-avatar" aria-hidden="true">{entry.name.charAt(0).toUpperCase()}</span>
                        <span className="standing-member"><strong>{entry.name}</strong><small>{entry.reasons.join(" · ")}</small></span>
                        <span className="standing-value"><strong>{entry.raidTickets}</strong><small>tickets</small></span>
                        <span className="standing-arrow">→</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="standing-empty standing-clear"><strong>All clear tonight</strong><p>{summary.live ? "No members currently need an officer check-in." : "The watchlist opens after the first roster sync."}</p></div>
              )}
            </section>
          </div>
        </section>

        <div className="lower-grid">
          <section className="panel member-account-panel">
            <div className="panel-heading"><div><p className="eyebrow">Personal view</p><h2>Your cantina card</h2></div><span className="private-pill">Private</span></div>
            <p className="panel-intro">Link Discord once to see your own live standing and keep your guild identity connected.</p>
            <AccountLink context={memberContext} />
          </section>

          <section className="panel" id="administration">
            <div className="panel-heading"><div><p className="eyebrow">Automation feed</p><h2>What the droid did</h2></div><span className="live-pill"><i /> Live</span></div>
            <div className="activity-list">
              {activityRows.length ? activityRows.map((item) => (
                <div className="activity-row" key={item.id}>
                  <span className={`activity-icon activity-${item.kind}`}>{wireIcon(item.kind)}</span>
                  <div><strong>{item.title}</strong><p>{item.kind === "notice" ? "Officer" : item.kind === "system" ? "System" : "Discord"}</p></div>
                  <time>{formatRelativeTime(item.occurredAt)}</time>
                </div>
              )) : (
                <p className="empty-copy">No automation activity recorded yet.</p>
              )}
            </div>

            <div className="officer-desk">
              <p className="officer-desk-heading">Officer&apos;s desk</p>
              <OfficerDesk signedIn={isOfficer} />
            </div>
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
