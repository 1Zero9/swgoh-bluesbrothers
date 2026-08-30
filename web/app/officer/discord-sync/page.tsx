import type { Metadata } from "next";
import { cookies } from "next/headers";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import { OFFICER_COOKIE_NAME, verifyOfficerSessionValue } from "@/lib/officer-auth";
import { getDiscordSyncReport } from "@/lib/discord-sync";
import DiscordSyncInteractive from "./discord-sync-interactive";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discord Sync & Access Governance · Officer Command · Blues Brothers",
  description:
    "Reconcile Discord guild roles, resolve player nickname mismatches, and manage role transitions for active and departed SWGOH members.",
};

export default async function OfficerDiscordSyncPage() {
  const store = await cookies();
  const isOfficer = verifyOfficerSessionValue(store.get(OFFICER_COOKIE_NAME)?.value);

  if (!isOfficer) {
    return (
      <main className="intel-shell destination-shell officer-auth-shell">
        <PageHero
          image="/ops-banner.webp"
          imageAlt="Tactical holographic command terminal in officer quarters"
          eyebrow="Officer Command · Restricted Area"
          title={
            <>
              Officer Access<br />
              <em>Required.</em>
            </>
          }
          description="Discord synchronization and role governance require officer authentication. Please unlock with your leadership credentials."
        />

        <div className="officer-gate-card">
          <h3>Enter Officer Keycard</h3>
          <p>Please use the Officer Roster or Crew Gate to authenticate your officer session.</p>
          <a href="/officer/roster" className="btn-officer-login-link">Go to Officer Login →</a>
        </div>
      </main>
    );
  }

  const report = await getDiscordSyncReport();

  return (
    <main className="intel-shell destination-shell discord-sync-page">
      <PageHero
        image="/ops-banner.webp"
        imageAlt="Tactical holographic command terminal in officer quarters"
        eyebrow="Officer Command · Discord &amp; Access Governance"
        title={
          <>
            Discord Sync &amp;<br />
            <em>Roster Governance.</em>
          </>
        }
        description="Reconcile Discord guild roles with active SWGOH in-game membership, resolve player nickname mismatches with confidence scoring, and demote departed players to the Public role."
        priority
      />

      <DiscordSyncInteractive initialReport={report} />

      <IntelFooter message="Blues Brothers Discord Synchronization Engine · Powered by Discord REST API & Comlink." />
    </main>
  );
}
