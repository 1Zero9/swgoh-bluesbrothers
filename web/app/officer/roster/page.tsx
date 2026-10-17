import type { Metadata } from "next";
import Link from "next/link";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
import { isOfficerRequest } from "@/lib/officer-session";
import { getOfficerRosterReport } from "@/lib/officer-roster";
import OfficerRosterLogin from "@/app/officer-roster-login";
import OfficerRosterTable from "@/app/officer-roster-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Officer Roster Report · Blues Brothers",
  description: "Officer-only participation report across tickets, raids and Territory War, with full guild membership history.",
};

export default async function OfficerRosterPage() {
  const isOfficer = await isOfficerRequest();
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
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Roster report" intro="Tickets, raid participation and Territory War joins in one filterable table, plus the full active and departed guild history." />
      {report ? (
        <div className="hub-stats">
          <div className="intel-summary">
            <div><strong>{activeCount || "—"}</strong><small>active members</small></div>
            <div><strong>{attentionCount || "—"}</strong><small>need attention</small></div>
            <div><strong>{rows.length - activeCount || "—"}</strong><small>in the archive</small></div>
          </div>
        </div>
      ) : null}

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

      <HubLinks message="Roster data refreshes through the scheduled guild sync.">
        <Link href="/officer/member">Member cards →</Link>
        <Link href="/officer/discord-sync">Discord sync →</Link>
      </HubLinks>
    </HubPage>
  );
}
