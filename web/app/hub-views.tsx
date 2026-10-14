import Image from "next/image";
import type { ReactNode } from "react";
import HubLinkList from "./hub-link-list";
import HubPage, { HubHeading } from "./hub-page";
import MoreActions from "./more-actions";
import PushSettings from "./push-settings";
import { GUILD_GROUPS, OFF_DUTY_LINKS, OFFICER_LINKS } from "@/lib/hub-links";

/** The hub screens as plain views, so pages can gate them and a local preview can render them without a database. */

export function GuildView() {
  return (
    <HubPage>
      <HubHeading eyebrow="Guild" title="The people and the war" intro="Who is in the band, and everything for Territory War, Territory Battles and raids." />
      {GUILD_GROUPS.map((group) => (
        <section key={group.title} className="hub-section">
          <h2 className="hub-section-title">{group.title}</h2>
          <HubLinkList links={group.links} />
        </section>
      ))}
    </HubPage>
  );
}

export function MoreView({ isOfficer, discordUrl }: { isOfficer: boolean; discordUrl: string }) {
  return (
    <HubPage>
      <HubHeading eyebrow="More" title="Account, alerts and downtime" />

      <section className="hub-section">
        <h2 className="hub-section-title">Account</h2>
        <HubLinkList links={[{ label: "My page", hint: "Your standing, wins and callouts", href: "/me", icon: "me" }]} />
        <MoreActions discordUrl={discordUrl} />
      </section>

      <section className="hub-section">
        <h2 className="hub-section-title">Notifications</h2>
        <div className="hub-card"><PushSettings /></div>
      </section>

      <section className="hub-section">
        <h2 className="hub-section-title">Off duty</h2>
        <div className="hub-photo">
          <Image src="/cantin-bannera.webp" alt="The cantina street" fill sizes="(max-width: 1023px) 100vw, 720px" />
          <span>The Cantina</span>
        </div>
        <HubLinkList links={OFF_DUTY_LINKS} quiet />
      </section>

      {isOfficer ? (
        <section className="hub-section">
          <h2 className="hub-section-title">Officers only</h2>
          <HubLinkList links={OFFICER_LINKS} quiet />
        </section>
      ) : null}
    </HubPage>
  );
}

export function AskView({ children }: { children: ReactNode }) {
  return (
    <HubPage>
      <HubHeading
        eyebrow="B-Lue3 · your guild droid"
        title="Ask B-Lue3"
        intro="Ask about the game, the guild or a counter. He looks at what the guild already knows before anything else, and that never costs you a question."
      />
      <div className="hub-ask-intro">
        <Image src="/blue.png" alt="B-Lue3, the guild droid" width={160} height={160} priority />
        <ol className="hub-order" aria-label="How B-Lue3 answers">
          <li><span className="hub-badge is-free">Free</span><div><strong>The guild&apos;s own knowledge</strong><small>Counters and who has what. No AI, no question used.</small></div></li>
          <li><span className="hub-badge is-paid">1 question</span><div><strong>The web, only when you tap it</strong><small>If the guild has nothing, you choose whether to search.</small></div></li>
          <li><span className="hub-badge">1 question</span><div><strong>AI for everything else</strong><small>Things like &ldquo;what should I farm next?&rdquo;.</small></div></li>
        </ol>
      </div>
      <section className="hub-section hub-chat" id="ask-blue" aria-label="Chat with B-Lue3">{children}</section>
    </HubPage>
  );
}
