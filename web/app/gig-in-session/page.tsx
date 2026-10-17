import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import RefreshButton from "@/app/refresh-button";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
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

  // Already in: nothing to do at the door.
  if (access.isMember || access.isOfficer) redirect("/");

  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Blues Brothers Cantina · Restricted access" title="The Gig is In Session. Crew access only." intro="Behind these doors the guild coordinates live Territory Wars, tracks seasonal Datacron super-weapons and tunes up combat rosters. Present your credentials to enter."><RefreshButton label="Refresh" /></HubHeader>

      <figure className="gig-door-pic">
        <Image src="/gig-in-session.png" alt="Droid bouncer in fedora and sunglasses guarding the entrance under The Gig is in Session neon sign" width={1983} height={793} priority sizes="(min-width: 1024px) 1100px, 100vw" />
      </figure>

      <CrewGate
        discordUrl={discordUrl}
        isOfficerConfigured={isOfficerConfigured()}
        isMemberAuthConfigured={isMemberAuthConfigured()}
        pendingDiscordUsername={access.discordUsername}
        initialRole={access.role}
        membershipState={access.membershipState}
        playerName={access.playerName}
      />

      <HubLinks message="The Blues Brothers SWGOH Guild Command Deck · Powered by Comlink & Discord." />
    </HubPage>
  );
}
