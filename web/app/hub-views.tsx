import Image from "next/image";
import type { ReactNode } from "react";
import AnswerLadder from "./answer-ladder";
import BlueIntro from "./blue-intro";
import HubLinkList from "./hub-link-list";
import HubBanner from "./hub-banner";
import HubPage, { HubHeader } from "./hub-page";
import MoreActions from "./more-actions";
import PushSettings from "./push-settings";
import { GUILD_GROUPS, OFF_DUTY_LINKS, OFFICER_LINKS } from "@/lib/hub-links";

/** The hub screens as plain views, so pages can gate them and a local preview can render them without a database. */

export function GuildView() {
  return (
    <HubPage banner={<HubBanner image="/members-banner.webp" eyebrow="Guild" title="The people and the war" intro="Who is in the band, and everything for Territory War, Territory Battles and raids." />}>
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
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="More" title="Account, alerts and downtime" intro="Your page, notifications, the theme, and the off-duty corner." />
      <div className="hub-more">
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
          <HubLinkList links={OFF_DUTY_LINKS} quiet />
        </section>

        {isOfficer ? (
          <section className="hub-section">
            <h2 className="hub-section-title">Officers only</h2>
            <HubLinkList links={OFFICER_LINKS} quiet />
          </section>
        ) : null}
      </div>
    </HubPage>
  );
}

export function AskView({ children, left }: { children: ReactNode; left?: { left: number; limit: number; resetsLabel: string } | null }) {
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="B-Lue3 · your guild droid" title="Ask B-Lue3, or find a counter" intro="Ask about the game, the guild or a squad. He checks what the guild already knows first, and that never costs you a question." />
      <div className="ask-layout">
        <div className="ask-main" id="ask-blue-wrap">{children}</div>
        <aside className="ask-side" aria-label="How B-Lue3 answers">
          <BlueIntro variant="hub" size={96} endHref="#ask-blue" />
          <AnswerLadder left={left ?? null} />
        </aside>
      </div>
    </HubPage>
  );
}
