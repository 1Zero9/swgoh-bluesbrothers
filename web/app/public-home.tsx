import type { ReactNode } from "react";
import Link from "next/link";
import IntelFooter from "@/app/intel-footer";
import PageHero from "@/app/page-hero";
import CheckStats from "@/app/check-stats";
import { getDiscordUrl } from "@/lib/discord";
import type { PublicHomeData } from "@/lib/public-stats";
import { JOIN_REQUIREMENTS } from "@/lib/requirements";

function millions(value: bigint) {
  const amount = Number(value);
  return amount >= 1_000_000 ? `${Math.round(amount / 1_000_000)}M` : amount.toLocaleString("en-GB");
}

/** The front door: what the guild is, whether there's room, what we ask, and how to join. No member data. */
export default function PublicHome({ data, linking }: { data: PublicHomeData; linking?: ReactNode }) {
  const discordUrl = getDiscordUrl();
  const full = data.spaces === 0;

  return (
    <main className="intel-shell destination-shell public-home">
      <PageHero
        image="/bb-title.webp"
        imageAlt="The Blues Brothers outside their cantina in a desert spaceport"
        eyebrow="Star Wars: Galaxy of Heroes guild"
        title={<>The Blues Brothers.<br /><em>On a mission from the Force.</em></>}
        description="A friendly, active guild that turns up for Territory War, Territory Battles and raids — and has fun doing it."
        priority
      >
        <div className="intel-summary">
          <div><strong>{data.live ? data.members : "—"}<span>/{data.capacity}</span></strong><small>members</small></div>
          <div><strong>{data.live ? millions(data.guildPower) : "—"}</strong><small>guild power</small></div>
          <div><strong>{data.live ? data.galacticLegends : "—"}</strong><small>Galactic Legends</small></div>
          <div><strong>{full ? "Full" : data.spaces}</strong><small>{full ? "ask about a space" : data.spaces === 1 ? "space open" : "spaces open"}</small></div>
        </div>
      </PageHero>

      {linking ? <section className="public-block">{linking}</section> : null}

      <section className="public-block" id="join">
        <header>
          <p className="eyebrow">Join us</p>
          <h2>What we ask. How to get in.</h2>
        </header>
        <div className="req-grid">
          <article><strong>{JOIN_REQUIREMENTS.minGalacticPower / 1_000_000}M+</strong><span>Galactic Power</span></article>
          <article><strong>{JOIN_REQUIREMENTS.minGalacticLegends}+</strong><span>Galactic Legends</span></article>
          <article><strong>Participate</strong><span>Turn up for TW, TB and raid tickets</span></article>
          <article><strong>Have fun</strong><span>That&apos;s the point</span></article>
        </div>
        <ol className="join-steps">
          <li><strong>Check your stats</strong> below — it takes a few seconds.</li>
          <li><strong>Join our Discord</strong> and say hello. {full ? "We're full right now, but spaces open up — tell us you're interested." : "Tell us your ally code and we'll sort an invite."}</li>
          <li><strong>Find us in-game</strong> by searching for <em>Blues Brothers</em>.</li>
        </ol>
        <p><a className="btn-discord-gate" href={discordUrl} target="_blank" rel="noreferrer">Join our Discord</a></p>
      </section>

      <section className="public-block" id="check-stats">
        <header>
          <p className="eyebrow">Check your stats</p>
          <h2>Would you fit?</h2>
          <p>Enter your ally code. We only look at your public profile and show you your Galactic Power and Galactic Legends — nothing is saved.</p>
        </header>
        <CheckStats />
      </section>

      <section className="public-block" id="record">
        <header>
          <p className="eyebrow">The record</p>
          <h2>How we get on</h2>
        </header>
        {data.tw.recent.length ? (
          <>
            <p className="record-line"><strong>{data.tw.wins}</strong> Territory War wins · <strong>{data.tw.losses}</strong> losses <small>in our last {data.tw.wins + data.tw.losses}</small></p>
            <ul className="tw-record">
              {data.tw.recent.map((result) => (
                <li key={`${result.opponent}-${result.endedAt?.toISOString() ?? result.score}`} className={result.won ? "won" : "lost"}>
                  <span>{result.won ? "WIN" : "LOSS"}</span>
                  <strong>vs {result.opponent}</strong>
                  <em>{result.score.toLocaleString("en-GB")} – {result.opponentScore.toLocaleString("en-GB")}</em>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Our war results appear here as they happen.</p>
        )}
        {data.highlights.length ? (
          <>
            <h3 className="record-sub">Fresh from the roster</h3>
            <ul className="highlight-list">
              {data.highlights.map((item, index) => (
                <li key={index}><span aria-hidden="true">{item.icon}</span><strong>A Blues Brother</strong> {item.text}</li>
              ))}
            </ul>
            <p>Members can see who, and every win, once signed in.</p>
          </>
        ) : null}
      </section>

      <section className="public-block" id="guides">
        <header>
          <p className="eyebrow">Field guides</p>
          <h2>New here? Start with these.</h2>
          <p>Plain-English guides to how the guild works: linking your account, Territory War orders, datacrons and more. Open to everyone.</p>
        </header>
        <p><Link className="btn-discord-gate" href="/guides">Read the field guides</Link></p>
      </section>

      <IntelFooter message="Already in the guild? Use Sign in at the top to see the members' area.">
        <Link href="/guides">Field guides →</Link>
      </IntelFooter>
    </main>
  );
}
