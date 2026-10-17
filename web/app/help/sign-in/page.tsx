import type { Metadata } from "next";
import HubPage, { HubHeader } from "@/app/hub-page";
import RefreshButton from "@/app/refresh-button";
import { getDiscordUrl } from "@/lib/discord";

export const metadata: Metadata = {
  title: "Help signing in · Blues Brothers",
  description: "Step-by-step help for signing in to the Blues Brothers guild site with Discord.",
};

const STEPS: { title: string; body: string }[] = [
  { title: "Use Safari or Chrome", body: "Open the site in your phone or computer's normal browser: Safari on an iPhone, Chrome on Android or a computer. If you got here from a link inside Discord, Facebook or another app, tap the three dots or the compass icon and choose \"Open in browser\". The browser built into those apps often can't finish signing in." },
  { title: "Log in to Discord first (the easy way)", body: "If Discord's login page won't fill in, open discord.com in a new tab, log in there until you can see your servers, then come back to this site and tap Sign in. Once Discord knows you, it skips the login pages and goes straight to the Authorise button." },
  { title: "Tap Sign in once", body: "Tap the blue \"Sign in with Discord\" button one time and wait. It can take a few seconds. Tapping again and again can make it start over." },
  { title: "Check the name Discord shows", body: "Discord may ask you to log in first. Use the same email and password you use for Discord. Then look for the line that says \"Signed in as …\". If it is not the Discord account you use for the guild, tap \"Not you?\" and sign in to the right one." },
  { title: "Tap Authorise", body: "Discord asks if the Blues Brothers site may see your Discord name and picture. That is all it can see. It cannot read your messages. Tap the blue Authorise button." },
  { title: "Type your ally code, once", body: "The first time only, the site asks for your 9-digit ally code so it can match you to your game account. In the game, tap your portrait at the top left and it is under your name. Next time you are signed straight in." },
];

export default function SignInHelpPage() {
  const discordUrl = getDiscordUrl();
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Help" title="Signing in, step by step" intro="Take your time. Nothing here can break anything, and you can start again whenever you like." />
      <div className="help-steps">
        <ol>
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="help-num" aria-hidden="true">{index + 1}</span>
              <div><h2>{step.title}</h2><p>{step.body}</p></div>
            </li>
          ))}
        </ol>
        <section className="help-box">
          <h2>If something goes wrong</h2>
          <ul>
            <li><strong>Discord just won&apos;t work for you:</strong> ask an officer for a personal sign-in link. They send it to you privately, you tap it once, and you are in with no Discord needed.</li>
            <li><strong>A blank or white screen:</strong> close it, open the site again in Safari or Chrome, and tap Sign in once.</li>
            <li><strong>Discord asks for a password or an emailed code:</strong> that is Discord&apos;s own sign-in. If you use the emailed code, check the account name it shows afterwards is the right one.</li>
            <li><strong>You ended up on the wrong Discord account:</strong> sign out of Discord in the browser, or tap &quot;Not you?&quot; on the Discord screen, and try again.</li>
            <li><strong>Your Discord name is different from your game name:</strong> that is fine. The ally code step matches you.</li>
          </ul>
          <p><a className="btn-discord-gate" href="/api/auth/discord">Try signing in</a></p>
          <p><RefreshButton label="Page stuck? Refresh the site" /></p>
          <p>Still stuck? <a href={discordUrl} target="_blank" rel="noreferrer">Message an officer in the Discord</a>. We would rather help than have you give up.</p>
        </section>
      </div>
    </HubPage>
  );
}
