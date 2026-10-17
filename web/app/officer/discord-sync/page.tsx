import type { Metadata } from "next";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
import { isOfficerRequest } from "@/lib/officer-session";
import { getDiscordSyncReport } from "@/lib/discord-sync";
import DiscordSyncInteractive from "./discord-sync-interactive";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discord Sync & Access Governance · Officer Command · Blues Brothers",
  description:
    "Reconcile Discord guild roles, resolve player nickname mismatches, and manage role transitions for active and departed SWGOH members.",
};

export default async function OfficerDiscordSyncPage() {
  const isOfficer = await isOfficerRequest();

  if (!isOfficer) {
    return (
      <HubPage backdrop="themed" inner>
        <HubHeader eyebrow="Officers" title="Officer access required" intro="Discord sync and role governance need officer sign-in." />
        <div className="officer-gate-card">
          <h3>Enter Officer Keycard</h3>
          <p>Please use the Officer Roster or Crew Gate to authenticate your officer session.</p>
          <a href="/officer/roster" className="btn-officer-login-link">Go to Officer Login →</a>
        </div>
      </HubPage>
    );
  }

  const report = await getDiscordSyncReport();

  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Discord sync and roster governance" intro="Reconcile Discord roles with active in-game membership, resolve nickname mismatches with confidence scoring, and demote departed players to the Public role." />
      <DiscordSyncInteractive initialReport={report} />
      <HubLinks message="Discord REST API and Comlink." />
    </HubPage>
  );
}
