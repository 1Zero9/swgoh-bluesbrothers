import Image from "next/image";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
import RefreshButton from "@/app/refresh-button";
import { getDiscordUrl } from "@/lib/discord";

/** What a visitor sees instead of a members-only page. Server-rendered, so nothing behind the gate is sent. */
export default function MembersOnly({ path, area }: { path: string; area: string }) {
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Members only" title="This one's for the band. Sign in to come through." intro={`${area} is for Blues Brothers guild members. Sign in with Discord and, if your account is linked, you're straight in.`} />
      <figure className="gig-door-pic">
        <Image src="/gig-in-session.png" alt="A droid bouncer in a fedora guarding the door under a neon sign" width={1983} height={793} priority sizes="(min-width: 1024px) 1100px, 100vw" />
      </figure>
      <section className="members-only-card">
        <a className="btn-discord-gate" href={`/api/auth/discord?next=${encodeURIComponent(path)}`}>Sign in with Discord</a>
        <p>First time here? Signing in once links your Discord to your in-game account, and an officer can help if it doesn&apos;t match.</p>
        <p><RefreshButton label="Page stuck? Refresh the site" /></p>
        <p>Not in the guild yet? <a href={getDiscordUrl()} target="_blank" rel="noreferrer">Say hello in our Discord</a>.</p>
      </section>
      <HubLinks message="Members area · Blues Brothers" />
    </HubPage>
  );
}
