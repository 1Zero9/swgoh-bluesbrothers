import type { Metadata } from "next";
import HubPage, { HubHeader } from "@/app/hub-page";
import { getDiscordUrl } from "@/lib/discord";
import { looksLikeToken } from "@/lib/signin-link";
import { peekSignInLink } from "@/lib/signin-link-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in · Blues Brothers", robots: { index: false, follow: false } };

export default async function SignInLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const who = looksLikeToken(token) ? await peekSignInLink(token).catch(() => null) : null;
  return (
    <HubPage backdrop="themed" inner>
      {who ? (
        <>
          <HubHeader eyebrow="Blues Brothers" title={`Hello, ${who.name}`} intro="An officer made this link for you, so you can come in without Discord. Tap the button and you're in. It works once." />
          <form className="help-box" method="post" action="/api/auth/link">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="btn-discord-gate">Sign me in</button>
            <p>You stay signed in on this device for about three months.</p>
          </form>
        </>
      ) : (
        <>
          <HubHeader eyebrow="Blues Brothers" title="This link has been used or has expired" intro="Sign-in links work once and last two days. Nothing is wrong, you just need a fresh one." />
          <section className="help-box">
            <p>Ask an officer in the Discord for a new link, or <a href="/help/sign-in">try the normal sign-in</a>.</p>
            <p><a href={getDiscordUrl()} target="_blank" rel="noreferrer">Open the Discord</a></p>
          </section>
        </>
      )}
    </HubPage>
  );
}
