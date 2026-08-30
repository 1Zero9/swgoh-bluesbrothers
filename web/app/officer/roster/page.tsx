import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getOfficerRosterReport } from "@/lib/officer-roster";
import OfficerRosterLogin from "@/app/officer-roster-login";
import OfficerRosterTable from "@/app/officer-roster-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Officer Roster Report · Blues Brothers",
  description: "Officer-only participation report across tickets, raids and Territory War, with full guild membership history.",
};

export default async function OfficerRosterPage() {
  const store = await cookies();
  const isOfficer = verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);
  const report = isOfficer ? await getOfficerRosterReport() : null;

  const rows = (report?.rows ?? []).map((row) => ({
    ...row,
    joinedAt: row.joinedAt.toISOString(),
    leftAt: row.leftAt?.toISOString() ?? null,
    galacticPower: row.galacticPower?.toString() ?? null,
    lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
  }));
  const activeCount = rows.filter((row) => row.state === "ACTIVE").length;
  const attentionCount = rows.filter((row) => row.needsAttention).length;

  return (
    <main className="intel-shell destination-shell">
      <PageHero
        image="/ops-banner.webp"
        imageAlt="The Blues Brothers officers reviewing guild activity reports"
        eyebrow="Officer tools"
        title={<>Every member.<br /><em>Every gig, tracked.</em></>}
        description="Tickets, raid participation and Territory War joins in one filterable table, plus the full active/departed guild history. Officers only."
        priority
      >
        {report ? (
          <div className="intel-summary">
            <div><strong>{activeCount || "—"}</strong><small>active members</small></div>
            <div><strong>{attentionCount || "—"}</strong><small>need attention</small></div>
            <div><strong>{rows.length - activeCount || "—"}</strong><small>in the archive</small></div>
          </div>
        ) : null}
      </PageHero>

      {isOfficer ? (
        rows.length ? (
          <section className="rr-section">
            <OfficerRosterTable rows={rows} raidLabel={report?.raidLabel ?? null} twLabel={report?.twLabel ?? null} />
          </section>
        ) : (
          <div className="tw-empty"><strong>No roster data captured yet.</strong><p>This report fills in once the first guild sync has run.</p></div>
        )
      ) : (
        <section className="rr-section rr-gate">
          <OfficerRosterLogin />
        </section>
      )}

      <IntelFooter message="Roster data refreshes through the scheduled guild sync.">
        <Link href="/officer/discord-sync">Open Discord Sync Governance →</Link>
        <Link href="/operations">Back to Operations →</Link>
      </IntelFooter>
    </main>
  );
}
