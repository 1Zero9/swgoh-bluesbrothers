import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import IntelFooter from "@/app/intel-footer";
import MembersOnly from "@/app/members-only";
import BlueChat from "@/app/blue-chat";
import BlueIntro from "@/app/blue-intro";
import NavIcon from "@/app/nav-icon";
import PageHero from "@/app/page-hero";
import PushSettings from "@/app/push-settings";
import { getViewerAccess } from "@/lib/access-control";
import { blueAnswer, blueBriefing, counterOptions, type BlueQuestion } from "@/lib/blue/advice";
import { blueEnabled } from "@/lib/blue/ask";
import { listCounters } from "@/lib/counters-data";
import { getMyPage } from "@/lib/my-page";
import { getSquadAdvice } from "@/lib/roster-advice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My Page · Blues Brothers",
  description: "Your own standing, wins and callouts in the Blues Brothers guild.",
};

function power(value: bigint) {
  const amount = Number(value);
  return amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(1)}M` : amount.toLocaleString("en-GB");
}

function change(value: number) {
  return value > 0 ? `+${value} in 30 days` : "no change in 30 days";
}

export default async function MyPage({ searchParams }: { searchParams: Promise<{ blue?: string | string[] }> }) {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return <MembersOnly path="/me" area="Your page" />;

  const [data, advice, counters] = access.playerId
    ? await Promise.all([getMyPage(access.playerId), getSquadAdvice(access.playerId), listCounters({ youPlayerId: access.playerId })])
    : [null, null, []];

  if (!data) {
    return (
      <main className="intel-shell destination-shell">
        <PageHero
          image="/members-banner.webp"
          imageAlt="The Blues Brothers"
          eyebrow="My page"
          title={<>Sign in with Discord<br /><em>to see your page.</em></>}
          description="This page is built from your own in-game account, so it needs a Discord sign-in linked to your player. The shared officer password doesn't carry one."
        />
        <section className="members-only-card">
          <a className="btn-discord-gate" href="/api/auth/discord?next=/me">Sign in with Discord</a>
        </section>
      </main>
    );
  }

  const lastSeen = data.lastActivityAt
    ? data.lastActivityAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" })
    : "—";
  const aiOn = blueEnabled();
  const briefing = blueBriefing(data, advice);
  const query = await searchParams;
  const requested = typeof query.blue === "string" && ["farm", "team", "help"].includes(query.blue) ? query.blue as BlueQuestion : null;
  const answer = requested ? blueAnswer(requested, data, advice, counters) : null;
  const personalCounters = counterOptions(counters);

  return (
    <main className="intel-shell destination-shell">
      <PageHero
        image="/members-banner.webp"
        imageAlt="The Blues Brothers"
        eyebrow={`${data.rank} · Level ${data.level ?? "—"}`}
        title={<>{data.name}<br /><em>your page.</em></>}
        description="Where you stand, what you've earned lately, and where the guild could use you."
        priority
        syncLabel="My page"
      >
        <div className="intel-summary">
          <div><strong>{power(data.galacticPower)}</strong><small>galactic power</small></div>
          <div><strong>{data.galacticLegends}</strong><small>Galactic Legends · {change(data.glChange30d)}</small></div>
          <div><strong>{data.relicUnits}</strong><small>relic units · {change(data.relicChange30d)}</small></div>
          <div><strong>{data.datacrons}</strong><small>datacrons</small></div>
        </div>
      </PageHero>

      <section className="blue-briefing public-block" aria-labelledby="blue-briefing-title">
        <BlueIntro />
        <div className="blue-briefing-copy">
          <p className="eyebrow">B-Lue3 · Briefing</p>
          <h2 id="blue-briefing-title">{briefing.title}</h2>
          <p>{briefing.message}</p>
          <Link href={briefing.href} className="blue-briefing-action">{briefing.action} <span>→</span></Link>
        </div>
      </section>

      <section className="blue-questions public-block" id="ask-blue" aria-labelledby="ask-blue-title">
        <header>
          <p className="eyebrow">Ask B-Lue3</p>
          <h2 id="ask-blue-title">What do you need?</h2>
          <p>{aiOn ? "Type a question, or tap one. B-Lue3 checks your synced roster and the guild's data before answering." : "B-Lue3 reads your synced roster against the guild's current needs and gives you the straight answer."}</p>
        </header>
        {!aiOn && access.isOfficer ? (
          <p className="blue-off-note" role="note">
            Officers only: B-Lue3&apos;s typing box is off because the server&apos;s BLUE_AI setting is {process.env.BLUE_AI ? `"${process.env.BLUE_AI}"` : "not set"}. It must be exactly on (lower case), then redeploy.
          </p>
        ) : null}
        {aiOn ? <BlueChat /> : (
          <>
            <nav className="blue-question-actions" aria-label="Questions for B-Lue3">
          <Link href="/me?blue=farm#ask-blue"><NavIcon name="sprout" size={20} />What should I farm next?</Link>
          <Link href="/me?blue=team#ask-blue"><NavIcon name="roster" size={20} />What team should I finish?</Link>
          <Link href="/me?blue=help#ask-blue"><NavIcon name="help" size={20} />How can I help the band?</Link>
        </nav>
        {answer ? <article className="blue-answer" aria-live="polite"><Image src="/blue.png" alt="" width={72} height={72} /><div><p className="eyebrow">{answer.title}</p><p>{answer.message}</p></div></article> : null}
          </>
        )}
      </section>

      {advice ? (
        <section className="public-block" id="blue-report">
          <header>
            <p className="eyebrow">B-Lue3&apos;s roster report</p>
            <h2>Your next useful move</h2>
            <p>B-Lue3 compares your synced roster with saved guild counter squads and current TB callouts. Each saved counter checks every listed unit against your roster.</p>
          </header>
          <div className="blue-report-grid">
            <article className="blue-report-card">
              <p className="eyebrow">Gig-ready leaders · {advice.ready.length}</p>
              {advice.ready.length ? <ul>{advice.ready.slice(0, 4).map((item) => <li key={item.key}><strong>{item.label}</strong><span>{item.leader} meets the {item.targetStars}★{item.targetRelic >= 0 ? ` R${item.targetRelic}+` : item.targetGear > 0 ? ` G${item.targetGear}+` : ""} leader target{item.thin ? ` · only ${item.qualifiers} guild members meet it` : ""}</span></li>)}</ul> : <p className="my-empty">No tracked leader target is ready yet. B-Lue3 will call out the closest one.</p>}
            </article>
            <article className="blue-report-card">
              <p className="eyebrow">Closest guild builds · {advice.close.length}</p>
              {advice.close.length ? <ul>{advice.close.slice(0, 4).map((item) => <li key={item.key}><strong>{item.label} · {item.gap}</strong><span>{item.leader}{item.haveStars !== null ? ` · currently ${item.haveStars}★${item.haveRelic ? ` R${item.haveRelic}` : item.haveGear ? ` G${item.haveGear}` : ""}` : " · not unlocked"}{item.thin ? ` · only ${item.qualifiers} members currently meet the target` : ""}</span></li>)}</ul> : <p className="my-empty">No tracked target is close to completion right now. B-Lue3 will keep watching the roster.</p>}
            </article>
            <article className="blue-report-card">
              <p className="eyebrow">B-Lue3&apos;s next team</p>
              {personalCounters.next ? <div className="blue-counter-pick"><strong>{personalCounters.next.title} into {personalCounters.next.enemy.name}</strong><span>{personalCounters.next.readiness.you?.gaps.length ? `Still needed: ${personalCounters.next.readiness.you.gaps.join("; ")}` : "This saved team matches your synced roster."}</span><small>{personalCounters.next.readiness.ready.length} guild member{personalCounters.next.readiness.ready.length === 1 ? "" : "s"} currently meet this counter&apos;s full requirements.</small></div> : personalCounters.ready.length ? <p className="my-empty">You meet the requirements for all saved counters in this report. Pick one from your ready list below.</p> : <p className="my-empty">No saved counter squad is available yet. Add trusted counters as the guild discovers them.</p>}
              <p className="eyebrow blue-counter-ready-label">Ready counters · {personalCounters.ready.length}</p>
              {personalCounters.ready.length ? <ul>{personalCounters.ready.slice(0, 4).map((counter) => <li key={counter.id}><strong>{counter.title} · into {counter.enemy.name}</strong><span>{counter.squad.map((slot) => `${slot.name}${slot.minRelic > 0 ? ` R${slot.minRelic}+` : ` ${slot.minStars}★`}`).join(" · ")}{counter.notes ? ` · ${counter.notes}` : ""}</span></li>)}</ul> : <p className="my-empty">No saved counter squad is fully ready from the latest synced roster.</p>}
              {personalCounters.close.length > 1 ? <div className="blue-counter-close"><strong>Other close counters</strong><ul>{personalCounters.close.slice(1, 3).map((counter) => <li key={counter.id}><span>{counter.title} into {counter.enemy.name}: {counter.readiness.you?.gaps.join("; ")}</span></li>)}</ul></div> : null}
              <Link href="/counters">Open the counters library →</Link>
            </article>
            <article className="blue-report-card blue-report-limits">
              <p className="eyebrow">What B-Lue3 can read</p>
              <p>Saved counter readiness checks each listed character&apos;s stars and relic requirement. The separate TW target list checks squad leaders only. B-Lue3 does not yet score mod loadouts or know farm locations, so it won&apos;t guess at either.</p>
              <Link href="/members#who-has">Find who has a unit →</Link>
            </article>
          </div>
        </section>
      ) : null}

      <section className="public-block">
        <header><p className="eyebrow">Where the guild could use you</p><h2>Your callouts</h2></header>
        {data.callouts.length ? (
          <ul className="my-list">
            {data.callouts.map((callout) => (
              <li key={callout.id} className={callout.status}>
                <strong>{callout.headline}</strong>
                <span>
                  {callout.status === "ready"
                    ? "You're ready ✓"
                    : `You're close — ${callout.gap}`}
                  {" · "}{callout.readyCount}{callout.needed ? `/${callout.needed}` : ""} ready
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="my-empty">Nothing open right now that needs you. Check <Link href="/territory-battles#callouts">the callouts</Link> any time.</p>
        )}
      </section>

      <section className="public-block">
        <header><p className="eyebrow">Last 60 days</p><h2>Your wins</h2></header>
        {data.wins.length ? (
          <ul className="my-list">
            {data.wins.map((win) => (
              <li key={win.id}>
                <strong><span aria-hidden="true">{win.icon}</span> {win.text}</strong>
                <span>{win.occurredAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" })} · {win.tag}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="my-empty">Nothing spotted yet. Level a unit and it shows up here after the next roster refresh.</p>
        )}
      </section>

      <section className="public-block">
        <header><p className="eyebrow">Your standing</p><h2>Tickets &amp; activity</h2></header>
        <p className="my-line"><strong>{data.raidTickets}</strong> raid tickets today · last active {lastSeen}</p>
        {data.standing.length ? (
          <ul className="my-list">{data.standing.map((reason) => <li key={reason}><strong>{reason}</strong></li>)}</ul>
        ) : (
          <p className="my-empty">All clear. Keep it up.</p>
        )}
      </section>

      <section className="public-block">
        <header><p className="eyebrow">Stay in the loop</p><h2>Notifications</h2><p>Choose what buzzes your phone or desktop. This applies to this device only.</p></header>
        <PushSettings />
      </section>

      <IntelFooter message="This page is only visible to you.">
        <Link href="/">Back to the command centre →</Link>
      </IntelFooter>
    </main>
  );
}
