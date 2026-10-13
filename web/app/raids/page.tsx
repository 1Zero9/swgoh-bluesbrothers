import MembersOnly from "@/app/members-only";
import { canViewMembersArea } from "@/lib/member-gate";
import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import { getDashboardSummary } from "@/lib/dashboard";
import { getRaidRoom } from "@/lib/raids";
import RaidBoard from "./raid-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Raid Operations · Blues Brothers",
  description: "Raid tickets, readiness and recent raid results for the Blues Brothers guild.",
};

export default async function RaidsPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/raids" area="Raid operations" />;
  const [summary, raidRoom] = await Promise.all([getDashboardSummary(), getRaidRoom()]);
  const progress = summary.live && summary.ticketTarget
    ? Math.min(100, Math.round((summary.dailyTickets / summary.ticketTarget) * 100))
    : 0;
  const capturedLabel = raidRoom.capturedAt
    ? new Date(raidRoom.capturedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Awaiting first sync";

  return (
    <main className="intel-shell destination-shell mission-shell">
      <PageHero
        image="/raid-banner.webp"
        imageAlt="The Blues Brothers coordinating a guild raid against a giant creature"
        eyebrow="Raid operations"
        title={<>Bring the right teams.<br /><em>Hit the right notes.</em></>}
        description="Where the guild is on tickets, and who carried the last completed raid."
        priority
        syncLabel={`Raid operations · Captured ${capturedLabel}`}
      >
        <div className="intel-summary">
          <div><strong>{summary.live ? summary.dailyTickets.toLocaleString("en-GB") : "—"}</strong><small>daily tickets</small></div>
          <div><strong>{summary.ticketTarget.toLocaleString("en-GB")}</strong><small>ticket target</small></div>
          <div><strong>{summary.live ? progress : "—"}<span>{summary.live ? "%" : ""}</span></strong><small>target reached</small></div>
        </div>
      </PageHero>

      <section className="tw-roster-section">
        <header>
          <div><p className="eyebrow">Recent results</p><h2>Who carried the raid</h2></div>
        </header>
        {raidRoom.raids.length ? (
          <RaidBoard raids={raidRoom.raids} />
        ) : (
          <div className="tw-empty"><strong>No completed raid captured yet.</strong><p>This board fills in as soon as a raid finishes and the next hourly sync runs.</p></div>
        )}
      </section>

      <details className="raid-data-note">
        <summary>What this board can and cannot show</summary>
        <p>SWGOH&apos;s public Comlink guild data does not expose live raid progress to tools outside the guild&apos;s own account. Only the few most recent completed runs are available, and that is what this board shows, one tab per run.</p>
      </details>

      <IntelFooter message="Raid operations now surface real results, not just ticket pace.">
        <Link href="/operations">Back to Operations →</Link>
      </IntelFooter>
    </main>
  );
}
