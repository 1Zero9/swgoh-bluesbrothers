import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import { getTerritoryWarRoom, type TerritoryWarZone } from "@/lib/territory-war";
import WarRoster from "./war-roster";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Territory War Room · Blues Brothers",
  description: "Live Territory War registration, scores, zones and roster readiness for the Blues Brothers.",
};

function compactPower(value: bigint | null) {
  if (value === null) return "—";
  const amount = Number(value);
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  return amount.toLocaleString("en-GB");
}

function zoneName(id: string, index: number) {
  const suffix = id.match(/(?:ZONE|CONFLICT)[_-]?(\d+)$/i)?.[1] ?? id.match(/(\d+)$/)?.[1];
  return suffix ? `Zone ${suffix}` : id.startsWith("Zone ") ? id : `Zone ${index + 1}`;
}

function ZoneBoard({ title, zones }: { title: string; zones: TerritoryWarZone[] }) {
  return (
    <section className="tw-zone-board">
      <header><div><p className="eyebrow">Battle map</p><h2>{title}</h2></div><strong>{zones.length}<small>zones</small></strong></header>
      <div className="tw-zone-grid">
        {zones.map((zone, index) => {
          const standing = Math.max(0, zone.squads - zone.defeated);
          return (
            <article key={`${zone.id}-${index}`}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{zoneName(zone.id, index)}</h3></div>
              <p>{zone.command || "No officer command captured for this zone."}</p>
              <dl>
                <div><dt>Standing</dt><dd>{standing}<small>/{zone.capacity || "—"}</small></dd></div>
                <div><dt>Defeated</dt><dd>{zone.defeated}</dd></div>
                <div><dt>Score</dt><dd>{zone.score.toLocaleString("en-GB")}</dd></div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default async function TerritoryWarPage() {
  const war = await getTerritoryWarRoom();
  const profileCoverage = war.members.filter((member) => member.profileSyncedAt).length;
  const capturedLabel = war.capturedAt?.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) ?? "Awaiting first sync";
  const roundEndLabel = war.roundEndsAt?.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="intel-shell tw-shell">
      <PageHero
        image="/tb-banner.webp"
        imageAlt="The Blues Brothers overlooking a massive Territory War battlefield"
        eyebrow="Territory War room"
        title={war.active ? <>The band is live.<br /><em>Know the field.</em></> : <>Get the band ready.<br /><em>Before the doors open.</em></>}
        description={war.active
          ? `Live registration, locked power and zone state against ${war.opponentName || "the opposing guild"}. Every figure below comes from the latest stored Comlink guild capture.`
          : "The next opponent has not entered the room yet. Use the readiness board to check roster coverage, activity and the people available for the next lock-in."}
        className="tw-hero"
        priority
        syncLabel={`Territory War · Captured ${capturedLabel}`}
      >
        <div className={`tw-live-strip${war.active ? " is-live" : ""}`}>
          <span><i /> {war.active ? `Live war${war.round === null ? "" : ` · Round ${war.round}`}` : "No active war in the latest capture"}</span>
          <strong>{war.active ? (roundEndLabel ? `Round ends ${roundEndLabel}` : "Round timing unavailable") : `Last checked ${capturedLabel}`}</strong>
        </div>
        <div className="intel-summary tw-summary" aria-label="Territory War summary">
          <div><strong>{war.active ? war.joinedCount : war.members.length}<span>/{war.members.length || "—"}</span></strong><small>{war.active ? "members joined" : "active members"}</small></div>
          <div><strong>{war.active ? compactPower(war.joinedPower) : profileCoverage}<span>{war.active ? "" : `/${war.members.length || "—"}`}</span></strong><small>{war.active ? "locked guild power" : "profiles captured"}</small></div>
          <div><strong>{war.active ? war.guildScore.toLocaleString("en-GB") : "—"}</strong><small>{war.active ? "Blues Brothers score" : "guild score"}</small></div>
          <div><strong>{war.active ? war.opponentScore.toLocaleString("en-GB") : "—"}</strong><small>{war.active ? `${war.opponentName || "opponent"} score` : "opponent score"}</small></div>
        </div>
      </PageHero>

      {war.active ? (
        <section className="tw-matchup" aria-label="Guild matchup">
          <article><p>Home signal</p><h2>Blues Brothers</h2><strong>{compactPower(war.guildPower)}<small>locked GP</small></strong></article>
          <span>VS</span>
          <article><p>Opposition</p><h2>{war.opponentName || "Unknown guild"}</h2><strong>{compactPower(war.opponentPower)}<small>locked GP</small></strong></article>
        </section>
      ) : war.lastResult ? (
        <section className="tw-last-result">
          <div><p className="eyebrow">Last recorded result</p><h2>Blues Brothers vs {war.lastResult.opponentName || "the opposition"}</h2></div>
          <strong>{war.lastResult.score.toLocaleString("en-GB")} <span>—</span> {war.lastResult.opponentScore.toLocaleString("en-GB")}</strong>
        </section>
      ) : null}

      {war.active && (war.homeZones.length || war.opponentZones.length) ? (
        <div className="tw-zones">
          {war.homeZones.length ? <ZoneBoard title="Our defence" zones={war.homeZones} /> : null}
          {war.opponentZones.length ? <ZoneBoard title="Enemy field" zones={war.opponentZones} /> : null}
        </div>
      ) : null}

      <section className="tw-roster-section">
        <header>
          <div><p className="eyebrow">{war.active ? "Registration & locked rosters" : "Pre-war readiness"}</p><h2>{war.active ? "Who took the field" : "Build the call sheet"}</h2></div>
          <p>{war.active
            ? "Locked GP is taken from this war. GL, relic and datacron counts come from each member’s latest full profile capture. A dash means that profile has not rotated through sync yet."
            : "Current GP is live from the guild roster. Deeper roster figures fill in as full player profiles rotate through the hourly sync."}</p>
        </header>
        <WarRoster members={war.members} active={war.active} />
      </section>

      <aside className="tw-data-note">
        <strong>What this board knows</strong>
        <p>Comlink supplies guild-specific TW registration, locked rosters, opponent profile, commands, zone state and squads through the existing <code>/guild</code> call. The sync now stores every active war as a <code>GuildEvent</code> with hourly <code>EventSnapshot</code> history; no opponent counters or officer assignments are invented when the game does not provide them.</p>
      </aside>

      <footer className="intel-footer">
        <span>Live data from the guild’s self-hosted SWGOH Comlink service.</span>
        <Link href="/arsenal">Open guild arsenal →</Link>
      </footer>
    </main>
  );
}
