import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { getDashboardSummary } from "@/lib/dashboard";
import { getDiscordUrl } from "@/lib/discord";
import { getGuildWire } from "@/lib/guild-wire";
import { getMemberContext } from "@/lib/member-context";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getWallOfFame } from "@/lib/wall-of-fame";
import { getWallOfShame } from "@/lib/wall-of-shame";
import { getRosterChanges } from "@/lib/members";
import AccountLink from "./account-link";
import OfficerDesk from "./officer-desk";
import SiteHeader, { APP_VERSION } from "./site-header";
import WallOfFameBoard from "./wall-of-fame-board";

export const dynamic = "force-dynamic";

const eventCards = [
  {
    id: "territory-battles",
    eyebrow: "Territory battle",
    title: "Rise of the Empire",
    status: "Awaiting schedule",
    copy: "Mission loadouts, operations and deployment plans will appear here when event sync is enabled.",
    action: "Preview TB planner",
    href: "/territory-battles",
    tone: "blue",
  },
  {
    id: "territory-war",
    eyebrow: "Territory war",
    title: "The next gig",
    status: "No active war",
    copy: "Registration, defensive assignments and the opponent counter board will share one live plan.",
    action: "Open TW war room",
    href: "/territory-war",
    tone: "amber",
  },
  {
    id: "raids",
    eyebrow: "Raid operations",
    title: "Guild raid",
    status: "Results tracked",
    copy: "See who carried the last completed raid, ranked by member damage contribution.",
    action: "View raid results",
    href: "/raids",
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
  const [guildWire, summary, wallOfShame, wallOfFame, officerStore, memberContext, changes] = await Promise.all([
    getGuildWire(),
    getDashboardSummary(),
    getWallOfShame(),
    getWallOfFame(),
    cookies(),
    getMemberContext(),
    getRosterChanges(),
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
  return (
    <main className="app-shell">
      <section className="workspace" id="top">
        <section className="hero" id="command-centre" aria-labelledby="mission-heading">
          <Image
            className="hero-image"
            src="/bb-title.webp"
            alt="The Blues Brothers outside their cantina in a desert spaceport"
            fill
            priority
            sizes="(max-width: 760px) 100vw, calc(100vw - 246px)"
          />
          <div className="hero-shade" />
          <SiteHeader syncLabel={syncLabel} />
          <div className="hero-copy">
            <div className="hero-status"><span><i /> {heroStatusLabel}</span><time>{heroStatusDate}</time></div>
            <p className="eyebrow">The roster. The plan. The next mission.</p>
            <h1 id="mission-heading">On a mission<br /><em>from the Force.</em></h1>
            <p>Live guild data comes in. Clear officer actions and mission calls go straight out to the band in Discord.</p>
            <div className="hero-actions">
              <a className="primary-action" href="#administration">Review officer actions</a>
              <Link className="secondary-action" href="/members">View guild roster <span>→</span></Link>
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
            <Link href="/operations">Open operations hub <span>→</span></Link>
          </div>
          <div className="event-grid">
            {eventCards.map((event) => (
              <article className={`event-card ${event.tone}`} id={event.id} key={event.eyebrow}>
                <div className="event-top"><span>{event.eyebrow}</span><i>{event.status}</i></div>
                <div className="event-symbol" aria-hidden="true"><span>{event.eyebrow.split(" ").map((word) => word[0]).join("")}</span></div>
                <h3>{event.title}</h3>
                <p>{event.copy}</p>
                {event.href ? (
                  <Link className="event-action" href={event.href}>{event.action}<span>→</span></Link>
                ) : (
                  <button type="button" disabled>{event.action}<span>→</span></button>
                )}
              </article>
            ))}
          </div>
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
                <strong>{wallOfFame[0]?.entries.length ?? 0}<small>per board</small></strong>
              </header>
              <p className="standing-copy">Guild leaderboards across power, tickets and roster depth — pick a board to see who&apos;s leading.</p>
              {wallOfFame.length ? (
                <WallOfFameBoard categories={wallOfFame} />
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
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Roster additions</p>
                <h2>New Crew Welcomes</h2>
              </div>
              <span className="live-pill" style={{ background: "rgba(83, 214, 154, 0.15)", color: "#53d69a" }}>
                Welcome 🎷
              </span>
            </div>
            <p className="panel-intro">Give a warm welcome to the latest players to join the Blues Brothers guild roster.</p>
            
            <div className="activity-list" style={{ maxHeight: "250px", overflowY: "auto", display: "grid", gap: "10px", marginBottom: "20px" }}>
              {changes.newMembers.length ? (
                changes.newMembers.map((member) => {
                  const memberPower = member.galacticPower ? formatPower(member.galacticPower) : null;
                  return (
                    <div className="activity-row" key={member.playerId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="activity-icon activity-welcome" style={{ display: "grid", placeItems: "center", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(83, 214, 154, 0.1)", color: "#53d69a", fontStyle: "normal", fontSize: "14px", fontWeight: "bold" }}>+</span>
                        <div>
                          <strong style={{ display: "block", fontSize: "13px", color: "#fff" }}>{member.name}</strong>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>Joined {formatRelativeTime(new Date(member.joinedAt))}</span>
                        </div>
                      </div>
                      {memberPower && (
                        <span style={{ font: "11px var(--font-geist-mono)", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "#fff" }}>
                          {memberPower.value}{memberPower.unit} GP
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="empty-copy" style={{ color: "var(--muted)", fontSize: "12px", margin: "10px 0" }}>Roster is stable. No new band members checked in this week.</p>
              )}
            </div>

            <div className="officer-desk" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
              <p className="officer-desk-heading">Officer&apos;s desk</p>
              <OfficerDesk signedIn={isOfficer} />
              {isOfficer ? <Link className="officer-roster-link" href="/officer/roster">Open the full roster report →</Link> : null}
            </div>
          </section>
        </div>

        <footer>
          <span>Blues Brothers Droid · Guild command {APP_VERSION}</span>
          <span className="footer-links"><Link href="/operations">Operations</Link><Link href="/members">Members</Link><Link href="/cantina">Cantina</Link><Link href="/credits">Sources &amp; credits</Link></span>
        </footer>
        </div>
      </section>
    </main>
  );
}
