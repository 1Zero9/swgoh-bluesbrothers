import { notFound } from "next/navigation";
import HubHome from "@/app/hub-home";
import { DEFAULT_ANNOUNCEMENT } from "@/lib/announcement";
import { buildStatusRow } from "@/lib/home-status";
import HubPage, { HubHeader } from "@/app/hub-page";
import FeedbackBoard from "@/app/feedback/feedback-board";
import CountersClient from "@/app/counters/counters-client";
import ActivityFeed from "@/app/activity/activity-feed";
import MemberCard from "@/app/officer/member/[id]/member-card";
import { assessPlayer } from "@/lib/player-assessment";
import MemberPicker from "@/app/officer/member/member-picker";
import MemberDirectory from "@/app/member-directory";
import MemberWelcomeTicker from "@/app/member-welcome-ticker";
import WhoHas from "@/app/members/who-has";
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

const CARD_SAMPLE = {
  playerId: "x", name: "Dex", role: "OFFICER", level: 85, joinedAt: "2026-02-10T10:00:00Z", tenureDays: 249, discordLinked: true, lastActivityAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
  power: { galacticPower: "11100000", characterPower: "9800000", shipPower: "1300000", rank: 6, members: 50, averageGp: "9800000", changePct: 4.2, history: [10.2, 10.3, 10.3, 10.6, 10.7, 10.9, 11.1].map((v) => v * 1e6) },
  roster: { galacticLegends: 9, relicUnits: 41, datacrons: 28, sevenStars: 190, ultimates: 3, relic9: 12 },
  tickets: { now: 600, target: 600, average: 540 },
  raids: [{ label: "Krayt Dragon", joined: true, damage: 4200000, rank: 4, of: 46 }, { label: "Krayt Dragon", joined: true, damage: 3900000, rank: 7, of: 45 }, { label: "Rancor", joined: false, damage: null, rank: null, of: 44 }],
  war: { joined: true, label: "vs Immortal Hungarians" },
  contribution: { countersAdded: 3, countersUsed: 5, tipsPublished: 2, ideasPublished: 1, feedbackPosts: 2, wins30d: 14 },
  recent: [{ text: "took Jedi Master Kenobi to Relic 9", at: new Date(Date.now() - 9 * 3600_000).toISOString() }, { text: "promoted Gungan Phalanx to 7-Star", at: new Date(Date.now() - 30 * 3600_000).toISOString() }],
  flags: [], profileSyncedAt: new Date(Date.now() - 20 * 3600_000).toISOString(),
  assessment: assessPlayer({ gpRank: 6, members: 50, galacticPower: 11.1e6, averageGp: 9.8e6, gpChange: 0.042, galacticLegends: 9, relicUnits: 41, raidTickets: 600, ticketTarget: 600, hoursSinceActive: 5, tenureDays: 249, raidsJoined: 2, raidsTotal: 3, joinedWar: true, wins30d: 14, countersAdded: 3, tipsPublished: 3, profileStale: false }),
};

const HIST_SAMPLE = [["Pillar of the band",4,0,11.1],["Pillar of the band",4,0,10.9],["Pulling their weight",3,1,10.6],["Needs a nudge",1,2,10.3]].map(([headline, strengths, watches, gp], i) => ({ at: new Date(Date.now() - i * 3 * 86400_000).toISOString(), headline: headline as string, strengths: strengths as number, watches: watches as number, galacticPower: String((gp as number) * 1e6) }));

const ROSTER_SAMPLE = [["Steve","LEADER",1.24e9,9,41,600,null],["Dex","OFFICER",11.1e6,9,41,600,null],["ZappAttk","MEMBER",8.2e6,3,22,310,"Raid tickets running low"],["Igor","MEMBER",6.1e6,1,9,80,"Gone quiet on the holonet"],["Brian","MEMBER",9.4e6,5,30,590,null]].map(([name, role, gp, gl, relics, tickets, flag], i) => ({ playerId: String(i), name: name as string, galacticPower: String(gp), characterPower: String(Number(gp) * 0.85), shipPower: String(Number(gp) * 0.15), raidTickets: tickets as number, lastActivityAt: "2026-10-17T08:00:00Z", joinedAt: "2026-02-10T10:00:00Z", rank: i + 1, playerLevel: 85, memberRole: role as string, galacticLegends: gl as number, relicUnits: relics as number, datacrons: 20, profileSyncedAt: "2026-10-16T10:00:00Z", attentionReasons: flag ? [flag as string] : [] }));

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
  if (screen === "member") return <HubPage backdrop="themed" inner><HubHeader eyebrow="Officers" title="Dex"><span className="hub-pagehead-link">← All members</span></HubHeader><MemberCard card={CARD_SAMPLE} capturedAt="2026-10-17T10:00:00Z" fromCache history={HIST_SAMPLE} /></HubPage>;
  if (screen === "members") return <HubPage backdrop="themed" inner><HubHeader eyebrow="Officers" title="Member cards" intro="Pick a member." /><MemberPicker newest="2026-10-17T09:00:00Z" members={[{ playerId: "1", name: "Dex", role: "OFFICER", galacticPower: "11100000", flags: 0, headline: "Pillar of the band", watches: 0, topWatch: null }, { playerId: "2", name: "ZappAttk", role: "MEMBER", galacticPower: "8200000", flags: 1, headline: null, watches: null, topWatch: "Raid tickets running low" }, { playerId: "3", name: "Igor", role: "MEMBER", galacticPower: "6100000", flags: 3, headline: "Needs a nudge", watches: 3, topWatch: "Quiet for 5 days" }, { playerId: "4", name: "Brian", role: "MEMBER", galacticPower: "9400000", flags: 0, headline: "Pulling their weight", watches: 0, topWatch: null }]} /></HubPage>;
  if (screen === "roster") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Roster" title="Meet the whole band" intro="Search the live roster, find who has a unit, and open any member for their guild standing.">
        <span className="hub-pagehead-stat"><strong>49</strong> active</span><span className="hub-pagehead-stat"><strong>2</strong> joined this month</span><span className="hub-pagehead-link">TW room →</span>
      </HubHeader>
      <WhoHas />
      <MemberWelcomeTicker members={[{ playerId: "a", name: "Juggernaut2000", joinedAt: "2026-10-15T10:00:00Z", galacticPower: "7900000", memberRole: "MEMBER" }]} />
      <MemberDirectory members={ROSTER_SAMPLE} />
    </HubPage>
  );
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
