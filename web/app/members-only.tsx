import IntelFooter from "@/app/intel-footer";
import PageHero from "@/app/page-hero";
import { getDiscordUrl } from "@/lib/discord";

/** What a visitor sees instead of a members-only page. Server-rendered, so nothing behind the gate is sent. */
export default function MembersOnly({ path, area }: { path: string; area: string }) {
  return (
    <main className="intel-shell destination-shell">
      <PageHero
        image="/gig-in-session.png"
        imageAlt="A droid bouncer in a fedora guarding the door under a neon sign"
        eyebrow="Members only"
        title={<>This one&apos;s for the band.<br /><em>Sign in to come through.</em></>}
        description={`${area} is for Blues Brothers guild members. Sign in with Discord and, if your account is linked, you're straight in.`}
        priority
      />
      <section className="members-only-card">
        <a className="btn-discord-gate" href={`/api/auth/discord?next=${encodeURIComponent(path)}`}>Sign in with Discord</a>
        <p>First time here? Signing in once links your Discord to your in-game account, and an officer can help if it doesn&apos;t match.</p>
        <p>Not in the guild yet? <a href={getDiscordUrl()} target="_blank" rel="noreferrer">Say hello in our Discord</a>.</p>
      </section>
      <IntelFooter message="Members area · Blues Brothers" />
    </main>
  );
}
