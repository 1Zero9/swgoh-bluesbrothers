import type { Metadata } from "next";
import Link from "next/link";
import IntelFooter from "@/app/intel-footer";
import MembersOnly from "@/app/members-only";
import PageHero from "@/app/page-hero";
import { getViewerAccess } from "@/lib/access-control";
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

export default async function MyPage() {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return <MembersOnly path="/me" area="Your page" />;

  const [data, advice] = access.playerId
    ? await Promise.all([getMyPage(access.playerId), getSquadAdvice(access.playerId)])
    : [null, null];

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

  return (
    <main className="intel-shell destination-shell">
      <PageHero
        image="/members-banner.webp"
        imageAlt="The Blues Brothers"
        eyebrow={`${data.rank} · Level ${data.level ?? "—"}`}
        title={<>{data.name}<br /><em>your page.</em></>}
        description="Where you stand, what you've earned lately, and where the guild could use you."
        syncLabel="My page"
      >
        <div className="intel-summary">
          <div><strong>{power(data.galacticPower)}</strong><small>galactic power</small></div>
          <div><strong>{data.galacticLegends}</strong><small>Galactic Legends · {change(data.glChange30d)}</small></div>
          <div><strong>{data.relicUnits}</strong><small>relic units · {change(data.relicChange30d)}</small></div>
          <div><strong>{data.datacrons}</strong><small>datacrons</small></div>
        </div>
      </PageHero>

      {advice ? (
        <section className="public-block">
          <header>
            <p className="eyebrow">Roster advice</p>
            <h2>Where you can help most</h2>
            <p>Based on the squads the guild builds Territory War around, checked against your own roster. We look at the squad leader.</p>
          </header>
          {advice.close.length ? (
            <ul className="my-list">
              {advice.close.slice(0, 4).map((item) => (
                <li key={item.key}>
                  <strong>{item.label}: {item.gap}</strong>
                  <span>
                    {item.thin ? `The guild is thin here: only ${item.qualifiers} member${item.qualifiers === 1 ? "" : "s"} can field it.` : `${item.qualifiers} members can field it.`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="my-empty">You&apos;re not close to any squad you can&apos;t already field. Nice.</p>
          )}
          {advice.ready.length ? (
            <p className="my-line advice-ready"><strong>You can field:</strong> {advice.ready.map((item) => `${item.label}${item.thin ? " (rare)" : ""}`).join(", ")}</p>
          ) : null}
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

      <IntelFooter message="This page is only visible to you.">
        <Link href="/">Back to the command centre →</Link>
      </IntelFooter>
    </main>
  );
}
