import { notFound } from "next/navigation";
import HubHome from "@/app/hub-home";
import { DEFAULT_ANNOUNCEMENT } from "@/lib/announcement";
import { buildStatusRow } from "@/lib/home-status";
import HubPage, { HubHeader } from "@/app/hub-page";
import FeedbackBoard from "@/app/feedback/feedback-board";
import CountersClient from "@/app/counters/counters-client";
import ActivityFeed from "@/app/activity/activity-feed";
import KnowledgeHub from "@/app/knowledge/knowledge-hub";
import LinkWelcome from "@/app/link-welcome";
import { AskView, GuildView, MoreView } from "@/app/hub-views";

/** Local preview of the hub screens with sample data. Development only: it does not exist in a production build. */
const KNOW_NAMES = { MOTHERTALZIN: "Mother Talzin", OLDDAKA: "Old Daka", NIGHTSISTERZOMBIE: "Nightsister Zombie", ASAJJVENTRESS: "Asajj Ventress", MERRIN: "Merrin", GENERALVEERS: "General Veers", ADMIRALPIETT: "Admiral Piett", DARKTROOPER: "Dark Trooper", RANGETROOPER: "Range Trooper", MOFFGIDEON: "Moff Gideon" };

const FB_SAMPLE = [
  { id: "1", kind: "FEATURE", title: "Show my ticket count on the home page", body: "I always forget to spend my raid tickets. A reminder on Home would help.", status: "IN_PROGRESS", reply: "Started. Coming with the next Home update.", submittedByName: "Dex", statusByName: "Steve", createdAt: "2026-10-10T10:00:00Z", doneAt: null, votes: 7, votedByMe: true, mine: false },
  { id: "2", kind: "BUG", title: "Raid page is empty after login", body: "Opened Raids on my phone and it shows nothing until I refresh.", status: "OPEN", reply: null, submittedByName: "Juggernaut2000", statusByName: null, createdAt: "2026-10-12T10:00:00Z", doneAt: null, votes: 2, votedByMe: false, mine: false },
  { id: "3", kind: "FEEDBACK", title: "Love the new Home page", body: "The Hoth background is brilliant, keep it.", status: "OPEN", reply: null, submittedByName: "You", statusByName: null, createdAt: "2026-10-15T10:00:00Z", doneAt: null, votes: 5, votedByMe: false, mine: true },
  { id: "4", kind: "FEATURE", title: "Counters you can save", body: "Let me keep a list of counters I use.", status: "DONE", reply: "Done: see Squads in the control panel.", submittedByName: "ZappAttk", statusByName: "Steve", createdAt: "2026-10-01T10:00:00Z", doneAt: "2026-10-16T10:00:00Z", votes: 9, votedByMe: false, mine: false },
];

const ACT_SAMPLE = [["Teepeeteet","promoted Gungan Phalanx to 7-Star","stars","17h"],["Teepeeteet","applied a Zeta upgrade to Boss of Otoh Gunga","gear","17h"],["Bro","promoted Snowtrooper Commander to 7-Star","stars","17h"],["TolkenSolo","promoted Brutus to 7-Star","stars","14h"],["Jim","increased Ben Solo's gear to level XIII","gear","12h"],["Dex","took Jedi Master Kenobi to Relic 9","relics","9h"],["Steve","unlocked Lord Vader: their 4th Galactic Legend","legends","2d"]].map(([who, text, group, ago], i) => ({ id: String(i), who, text, tag: "", tier: group === "legends" || group === "relics" ? "headline" as const : "standard" as const, group: group as "stars", ago, at: "2026-10-16T10:00:00Z" }));

export const dynamic = "force-dynamic";

export default async function HubPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { screen } = await searchParams;
  if (screen === "welcome") return <LinkWelcome discordUsername="steve_c" discordUrl="https://discord.gg/example" preview />;
  if (screen === "guild") return <GuildView />;
  if (screen === "knowledge") return <HubPage backdrop="themed" inner><HubHeader eyebrow="Knowledge" title="What the guild has learned" intro="Counters, tips and ideas from the band, with where each one came from. Add what you know and everyone, B-Lue3 included, can use it."><span className="hub-pagehead-link">Review queue →</span></HubHeader><KnowledgeHub names={KNOW_NAMES} canAct /></HubPage>;
  if (screen === "feedback") return <HubPage backdrop="themed" inner><HubHeader eyebrow="Feedback" title="What we want next" intro="Ask for a feature, say what you think, or report something broken. Everyone in the guild can see this list, tap +1 on what you want too, and an officer ticks things off as they are done." /><FeedbackBoard isOfficer canPost initial={FB_SAMPLE} /></HubPage>;
  if (screen === "counters") return <HubPage backdrop="themed" inner><HubHeader eyebrow="Saved squads" title="Know the counter. Know who can run it." intro="Pick an enemy squad's leader and see the counters the guild trusts, whether you can run them, and who can. Anyone can add one." /><CountersClient aside={<aside className="kb-side kb-ask-side"><h3>Not on the list?</h3><p>Ask B-Lue3. He checks what the guild has saved first, then searches the web for current counters.</p><span className="kb-ask-link">Ask B-Lue3 →</span></aside>} /></HubPage>;
  if (screen === "activity") return <HubPage backdrop="themed" inner><HubHeader eyebrow="Guild" title="Guild activity" intro="Star promotions, gear, relics and unlocks across the guild, newest first."><span className="hub-pagehead-link">The Wins →</span></HubHeader><ActivityFeed items={ACT_SAMPLE} /></HubPage>;
  if (screen === "more") return <MoreView isOfficer discordUrl="https://discord.gg/example" />;
  if (screen === "ask") return <AskView left={{ left: 4, limit: 5, resetsLabel: "Monday 20 Oct" }}><p style={{ color: "var(--hub-muted)" }}>(The chat appears here.)</p></AskView>;
  return (
    <HubHome
      name="Steve"
      linked
      standing="1.24B GP · 6 raid tickets"
      checkIn={null}
      requests={[{ id: "1", leaderName: "Night Sisters", modeLabel: "Territory War" }, { id: "2", leaderName: "Jedi Master Kenobi", modeLabel: "Grand Arena 5v5" }]}
      wire={[
        { id: "a", title: "Welcome, Brian", summary: "Joined the band", when: "2h ago" },
        { id: "b", title: "Territory War result posted", summary: "A win by 4 zones", when: "1d ago" },
        { id: "c", title: "Officer notice", summary: "TW signup closes Friday", when: "2d ago" },
      ]}
      isOfficer
      reviewCount={3}
      stats={{ members: "49/50", power: "1.31B", tickets: "2,430", legends: "86" }}
      wins={[{ id: "w1", who: "Brian", text: "unlocked Jedi Knight Revan", when: "1d ago" }, { id: "w2", who: "Igor", text: "reached relic 9 on Padmé", when: "3d ago" }]}
      status={buildStatusRow({ tw: { wins: 7, losses: 3, recent: [{ opponent: "Rebel Scum", score: 1200000, opponentScore: 900000, won: true, endedAt: new Date("2026-10-10T12:00:00Z") }] }, openCallouts: 2, tickets: { today: 2430, target: 29400 }, lastRaid: { label: "Krayt Dragon", outcomeLabel: "Completed" } })}
      newMembers={[{ id: "n1", name: "Juggernaut2000", when: "2h ago", power: "7.9M" }, { id: "n2", name: "Dex", when: "27 Sept", power: "11.1M" }]}
      callouts={[{ id: "c1", unit: "Lord Vader", need: "relic 7+, 5 needed", where: "Zeffo" }, { id: "c2", unit: "Padmé Amidala", need: "7 stars, 3 needed", where: "phase 3" }]}
      chat={null}
      discordUrl="https://discord.gg/example"
      announcement={DEFAULT_ANNOUNCEMENT}
      mySquads={{
        saved: [
          { id: "1", title: "Night Sisters answer", enemy: "Nightsister Zombie", mode: "Territory War", units: ["Mother Talzin", "Asajj Ventress", "Nightsister Acolyte"], ready: true, gap: null },
          { id: "2", title: "Vader opener", enemy: "Lord Vader", mode: "Any mode", units: ["Jedi Master Kenobi", "Padmé Amidala"], ready: false, gap: "Padmé Amidala: R5 → R7" },
        ],
        uses: [{ id: "u1", attacker: "Jedi Knight Revan", defender: "Sith Empire (Malak)", mode: "Grand Arena 5v5" }],
      }}
      questions={{ left: 4, limit: 5, resetsLabel: "Monday 20 Oct" }}
    />
  );
}
