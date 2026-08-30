import type { Metadata } from "next";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import { getViewerAccess } from "@/lib/access-control";
import { getDiscordUrl } from "@/lib/discord";
import { isMemberAuthConfigured } from "@/lib/member-auth";
import { isOfficerConfigured } from "@/lib/officer-auth";
import CrewGate from "./crew-gate";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "The Gig is In Session · Restricted Access · Blues Brothers",
  description:
    "The Blues Brothers guild operations room is in session. Crew access only. Present your Discord credentials or SWGOH ally code to enter.",
  openGraph: {
    title: "The Gig is In Session · Blues Brothers",
    description: "Crew access only. Star Wars Galaxy of Heroes guild command deck.",
    images: ["/gig-in-session.png"],
  },
};

export default async function GigInSessionPage() {
  const [access, discordUrl] = await Promise.all([
    getViewerAccess(),
    Promise.resolve(getDiscordUrl()),
  ]);

  return (
    <main className="intel-shell destination-shell gig-in-session-page">
      <PageHero
        image="/gig-in-session.png"
        imageAlt="Droid bouncer in fedora and sunglasses guarding the entrance under The Gig is in Session neon sign"
        eyebrow="Blues Brothers Cantina · Restricted Access"
        title={
          <>
            The Gig is In Session.<br />
            <em>Crew Access Only.</em>
          </>
        }
        description="Behind these doors, the Blues Brothers guild coordinates live Territory Wars, tracks seasonal Datacron super-weapons, and tunes up combat rosters. Present your credentials to enter."
        priority
      />

      <CrewGate
        discordUrl={discordUrl}
        isOfficerConfigured={isOfficerConfigured()}
        isMemberAuthConfigured={isMemberAuthConfigured()}
        pendingDiscordUsername={access.discordUsername}
        initialRole={access.role}
        membershipState={access.membershipState}
        playerName={access.playerName}
      />

      <IntelFooter message="The Blues Brothers SWGOH Guild Command Deck · Powered by Comlink & Discord." />
    </main>
  );
}
