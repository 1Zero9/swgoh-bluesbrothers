import { notFound } from "next/navigation";
import HubHome from "@/app/hub-home";
import { HandbookView } from "@/app/knowledge/handbook/page";
import { GlossaryView } from "@/app/knowledge/glossary/page";
import NextSteps from "@/app/ask/next-steps";
import BlueText from "@/app/blue-text";
import MatchCard from "@/app/knowledge/match-card";
import ResearchPanel from "@/app/knowledge/review/research-panel";
import { launchRows } from "@/lib/launch-check";
import { DEFAULT_ANNOUNCEMENT } from "@/lib/announcement";
import { buildStatusRow } from "@/lib/home-status";
import HubPage, { HubHeader, HubLinks } from "@/app/hub-page";
import FeedbackBoard from "@/app/feedback/feedback-board";
import CountersClient from "@/app/counters/counters-client";
import ActivityFeed from "@/app/activity/activity-feed";
import MemberCard from "@/app/officer/member/[id]/member-card";
import { assessPlayer } from "@/lib/player-assessment";
import MemberPicker from "@/app/officer/member/member-picker";
import MemberDirectory from "@/app/member-directory";
import MemberWelcomeTicker from "@/app/member-welcome-ticker";
import WhoHas from "@/app/members/who-has";
import RaidBoard from "@/app/raids/raid-board";
import TwWorkspace from "@/app/territory-war/tw-workspace";
import { SQUAD_KEYS } from "@/lib/tw-squads";
import DatacronsInteractive from "@/app/datacrons/datacrons-interactive";
import { ACTIVE_DATACRON_SETS } from "@/lib/datacrons";
import ArsenalInteractive from "@/app/arsenal/arsenal-interactive";
import DougiesJukebox from "@/app/dougies-discs/dougies-jukebox";
import { CURATED_DISCS } from "@/lib/discs";
import SoulFoodCafe from "@/app/soul-food-cafe";
import { getSoulFoodRecipes } from "@/lib/recipes";
import MissionGame from "@/app/mission-from-god/mission-game";
import ChatClient from "@/app/chat/chat-client";
import OfficerRosterTable from "@/app/officer-roster-table";
import CreditsPage from "@/app/credits/page";
import AskTabs from "@/app/ask/ask-tabs";
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

const RAID_SAMPLE = [{ raidId: "sith_raid", label: "Krayt Dragon", outcome: 1, outcomeLabel: "Completed", durationSeconds: 7200, endedAt: "2026-10-16T10:00:00Z", participants: [["Dex", 4200000], ["Steve", 3900000], ["ZappAttk", 3100000], ["Brian", 2500000]].map(([name, damage], i) => ({ playerId: String(i), name: name as string, damage: damage as number, rank: i + 1 })) }, { raidId: "rancor_challenge", label: "Rancor", outcome: 1, outcomeLabel: "Completed", durationSeconds: 5400, endedAt: "2026-10-12T10:00:00Z", participants: [{ playerId: "1", name: "Dex", damage: 100, rank: 1 }] }];

const TW_POOL = ["Dex", "Steve", "ZappAttk", "Brian", "Igor", "Juggernaut2000"].map((name, i) => ({ playerId: "p" + i, name, joined: i !== 4, galacticPower: 11e6 - i * 1.2e6, squads: Object.fromEntries(SQUAD_KEYS.map((key, j) => [key, (i + j) % 3 !== 0])) as never }));
const TW_PLAN = { id: "plan1", name: "Round 2 defence", status: "ACTIVE" as const, version: 3, templateId: null, zonePlans: [], assignments: [], attackAssignments: [] };

const DC_SAMPLE = {
  activeSets: ACTIVE_DATACRON_SETS,
  syncedMemberCount: 48,
  summary: { totalDatacrons: 130, level9Count: 12, level6Count: 40, level3Count: 78, topOwners: [{ playerName: "Dex", l9Count: 3, totalCount: 9 }, { playerName: "Steve", l9Count: 2, totalCount: 7 }], factionsCovered: [{ faction: "Galactic Empire", count: 12 }], characterDatacrons: [{ character: "Lord Vader", count: 2, owners: ["Dex", "Steve"] }] },
  datacrons: [
    { id: "d1", ownerName: "Dex", setId: ACTIVE_DATACRON_SETS[0].id, setName: ACTIVE_DATACRON_SETS[0].name, level: 9, tierCategory: "L9_CHARACTER" as const, characterTarget: "Lord Vader", abilitySummary: "Lord Vader gains Offense and a chance to counter.", stats: [{ stat: "Potency", value: "+8%" }, { stat: "Health", value: "+5%" }], rerollCount: 2, twSuitability: "OPTIMAL_DEFENCE" as const, recommendedCommand: "Dark side top front" },
    { id: "d2", ownerName: "Steve", setId: ACTIVE_DATACRON_SETS[0].id, setName: ACTIVE_DATACRON_SETS[0].name, level: 6, tierCategory: "L6_FACTION" as const, factionTarget: "Galactic Empire", abilitySummary: "Empire allies gain turn meter on attack.", stats: [{ stat: "Speed", value: "+4" }], rerollCount: 0, twSuitability: "KEY_OFFENCE" as const },
    { id: "d3", ownerName: "ZappAttk", setId: ACTIVE_DATACRON_SETS[0].id, setName: ACTIVE_DATACRON_SETS[0].name, level: 3, tierCategory: "L3_ALIGNMENT" as const, alignmentTarget: "DARK" as const, abilitySummary: "Dark side allies gain offence.", stats: [{ stat: "Tenacity", value: "+6%" }], rerollCount: 1, twSuitability: "SOLID_BACKUP" as const },
  ],
};

export const dynamic = "force-dynamic";

export default async function HubPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { screen } = await searchParams;
  if (screen === "welcome") return <LinkWelcome discordUsername="steve_c" discordUrl="https://discord.gg/example" preview />;
  if (screen === "launch") {
    const groups = launchRows({ blueAi: true, webSearch: false, published: 4, candidates: 9, savedWaiting: 22, tips: 0, ideas: 1, openRequests: 2, activeMembers: 50, discordLinked: 38, seenThisWeek: 11, helpWaiting: 1, botConfigured: true, countersWebhook: true, officerWebhook: false, discordWidget: false });
    const mark = { good: "✓", warn: "!", bad: "✕" } as const;
    return (
      <HubPage backdrop="themed" inner>
        <HubHeader eyebrow="Officers" title="Launch checklist" intro="What members will find on day one, and what is still missing." />
        <div className="launch-groups">{groups.map((g) => (<section key={g.group} className="help-box"><h2>{g.group}</h2><ul className="launch-rows">{g.rows.map((r) => (<li key={r.label} className={`is-${r.tone}`}><span className="launch-mark">{mark[r.tone]}</span><div><strong>{r.label}: {r.value}</strong><p>{r.detail}</p></div></li>))}</ul></section>))}</div>
      </HubPage>
    );
  }
  if (screen === "research") return <HubPage backdrop="themed" inner><HubHeader eyebrow="Officers" title="Review queue" /><ResearchPanel /></HubPage>;
  if (screen === "suggest") {
    const names = { VADER: "Lord Vader", HERMIT: "Hermit Yoda", GMY: "Grand Master Yoda", MACE: "Mace Windu", BARRISS: "Barriss Offee", GK: "General Kenobi" };
    const item = { id: "c1", status: "PUBLISHED", mode: "TW", strategy: "Open with Kenobi's taunt, then wait for turn meter.", defender: { teamName: "Lord Vader", memberIds: ["VADER"], members: [{ unitId: "VADER", role: "LEADER" }] }, attacker: { teamName: "GMY", memberIds: ["GMY", "MACE", "BARRISS", "GK"], members: [{ unitId: "GMY", role: "LEADER" }, { unitId: "MACE", role: "CORE" }, { unitId: "BARRISS", role: "CORE" }, { unitId: "GK", role: "CORE" }] }, datacronDependent: false, datacronExpiresAt: null, reviewedAt: "2026-10-10T10:00:00Z", createdAt: "2026-10-01T10:00:00Z", evidenceCount: 2, useCount: 4, requirements: null, oneShot: null, freshEnemyOnly: null };
    return <HubPage backdrop="themed" inner><HubHeader eyebrow="Knowledge" title="Counters" /><MatchCard item={item} names={names} canMark /></HubPage>;
  }
  if (screen === "bluetext") return <HubPage backdrop="themed" inner><HubHeader eyebrow="B-Lue3" title="Answer formatting" /><div className="hub-chat"><div className="blue-chat"><div className="blue-thread"><div className="blue-turn blue-turn-assistant"><div className="blue-turn-body"><BlueText text={"Beep-boop, commander! Here are the two top counters currently used to take down Lord Vader:\n\n### Squad 1 (Premier GAC Duo)\n* **Darth Bane** (Leader)\n* **Count Dooku** (or **Sith Eternal Emperor**)\n\n**How to run it:** With Bane's *Rule of Two* active, allow Vader to pile debuffs on Bane.\n\n---\n\n### Squad 2 (Galactic Legend Counter)\n* **Jedi Master Kenobi** (Leader)"} /><p className="blue-sources">From the web: ign.com · swgoh.gg</p><div className="blue-save"><button type="button" className="kb-secondary">Add these counters to the guild list</button><small>An officer checks them, with their sources, before anyone else sees them.</small></div></div></div></div></div></div></HubPage>;
  if (screen === "nextsteps") return <HubPage backdrop="themed" inner><HubHeader eyebrow="Find a counter" title="Lord Vader" /><NextSteps options={[{ label: "Fennec, Greef, Bossk, Bo-Katan, Mando", needs: [{ unit: "Bossk", kind: "own", have: 0, want: 7 }, { unit: "Mando", kind: "relic", have: 3, want: 5 }] }, { label: "Jedi Master Kenobi, CAT", needs: [{ unit: "Jedi Master Kenobi", kind: "relic", have: 2, want: 7 }, { unit: "Commander Ahsoka Tano", kind: "own", have: 0, want: 7 }] }]} /></HubPage>;
  if (screen === "handbook") return <HandbookView />;
  if (screen === "glossary") return <GlossaryView />;
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
  if (screen === "raids") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Raid operations" title="Bring the right teams. Hit the right notes." intro="Where the guild is on tickets, and who carried the last completed raid." meta="Captured 17 Oct, 09:00" />
      <div className="hub-stats"><div className="intel-summary"><div><strong>2,430</strong><small>daily tickets</small></div><div><strong>29,400</strong><small>ticket target</small></div><div><strong>8<span>%</span></strong><small>target reached</small></div></div></div>
      <section className="tw-roster-section"><header><div><p className="eyebrow">Recent results</p><h2>Who carried the raid</h2></div></header>
        <RaidBoard raids={RAID_SAMPLE} />
      </section>
      <section className="tw-matchup" aria-label="Guild matchup"><article><p>Home signal</p><h2>Blues Brothers</h2><strong>1.31B<small>locked GP</small></strong></article><span>VS</span><article><p>Opposition</p><h2>Immortal Hungarians</h2><strong>1.28B<small>locked GP</small></strong></article></section>
      <div className="tw-empty"><strong>No completed raid captured yet.</strong><p>This board fills in as soon as a raid finishes and the next hourly sync runs.</p></div>
      <HubLinks message="Raid operations now surface real results, not just ticket pace."><span>Back to Operations →</span></HubLinks>
    </HubPage>
  );
  if (screen === "me") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Leader · Level 85" title="Steve" intro="Where you stand, what you've earned lately, and where the guild could use you." />
      <div className="hub-stats"><div className="intel-summary"><div><strong>1.2B</strong><small>galactic power</small></div><div><strong>9</strong><small>Galactic Legends · +1 in 30 days</small></div><div><strong>41</strong><small>relic units · no change in 30 days</small></div><div><strong>28</strong><small>datacrons</small></div></div></div>
      <section className="blue-briefing public-block"><div className="blue-briefing-copy"><p className="eyebrow">B-Lue3 · Briefing</p><h2>Finish Jedi Master Kenobi next</h2><p>He is one relic level from the target the guild needs for Territory Battles.</p><span className="blue-briefing-action">Open the callout <span>→</span></span></div></section>
      <section className="blue-questions public-block"><header><p className="eyebrow">Ask B-Lue3</p><h2>What do you need?</h2><p>Type a question, or tap one.</p></header><nav className="blue-question-actions"><span>What should I farm next?</span><span>What team should I finish?</span></nav></section>
      <section className="public-block"><header><p className="eyebrow">B-Lue3&apos;s roster report</p><h2>Your next useful move</h2></header><div className="blue-report-grid"><article className="blue-report-card"><p className="eyebrow">Gig-ready leaders · 2</p><ul><li><strong>Jedi Master Kenobi</strong><span>meets the 7★ R7+ leader target</span></li></ul><a href="#">Open the counters library →</a></article><article className="blue-report-card"><p className="eyebrow">Closest guild builds · 1</p><div className="blue-counter-pick"><strong>Vader opener into Lord Vader</strong><span>Still needed: Padmé R5 to R7</span></div></article></div></section>
      <section className="public-block"><header><p className="eyebrow">Your standing</p><h2>Tickets &amp; activity</h2></header><p className="my-line"><strong>600</strong> raid tickets today · last active 17 Oct</p><p className="my-empty">All clear. Keep it up.</p></section>
      <section className="public-block"><header><p className="eyebrow">Last 60 days</p><h2>Your wins</h2></header><ul className="my-list"><li className="ready"><strong>★ unlocked Lord Vader</strong><span>16 Oct · Galactic Legend</span></li></ul></section>
      <HubLinks message="This page is only visible to you."><span>Back to Home →</span></HubLinks>
    </HubPage>
  );
  if (screen === "twplan") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Territory War room" title="The band is live. Know the field." meta="Captured 17 Oct, 09:00" />
      <TwWorkspace isOfficer plan={TW_PLAN} pool={TW_POOL} war={{ active: true, opponentName: "Immortal Hungarians", guildScore: 1200000, opponentScore: 900000, round: 2 }} templates={[]} commands={[]} />
    </HubPage>
  );
  if (screen === "tb") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Territory Battles" title="See the whole field. Deploy with purpose." intro="What the guild needs from you in Rise of the Empire, and the plan for each phase." />
      <section className="tb-section" id="callouts"><div className="section-heading"><div><p className="eyebrow">Callouts</p><h2>What the guild needs from you</h2></div><span>Matched against live member rosters</span></div>
        <div className="callouts">
          <article className="callout-card"><header><div><h3>Lord Vader</h3><small>relic 7+ · Zeffo</small></div><div className="callout-count"><strong>3<span>/5</span></strong><small>ready</small></div></header><div className="callout-bar"><span style={{ width: "60%" }} /></div><p className="callout-note">Need him on the Zeffo mission, please.</p><p className="callout-line"><span>Ready:</span> Dex, Steve, ZappAttk</p><div className="callout-close"><span>Closest</span><ul><li>Igor <em>(R5 → R7)</em></li></ul></div></article>
          <article className="callout-card is-complete"><header><div><h3>Padmé Amidala</h3><small>7 stars · phase 3</small></div><div className="callout-count"><strong>3<span>/3</span></strong><small>ready</small></div></header><div className="callout-bar"><span style={{ width: "100%" }} /></div><p className="callout-done">All filled. Thank you!</p></article>
        </div></section>
      <section className="tb-section" id="plan"><div className="section-heading"><div><p className="eyebrow">The plan</p><h2>What we are doing, phase by phase</h2></div></div>
        <div className="tb-plan-view"><div className="tb-plan-phase"><h3>Phase 1</h3><ul><li><strong>Zeffo</strong><span className="tb-plan-badge is-three-star">Three star</span><small>Dark side</small><p>Full deploy, no preload.</p></li><li><strong>Mandalore</strong><span className="tb-plan-badge is-hold">Hold</span></li></ul></div></div></section>
      <section className="tb-section"><div className="section-heading"><div><p className="eyebrow">Rise of the Empire</p><h2>Interactive ROTE Planner &amp; Star Optimizer</h2></div><span>Syncing from 49 player profiles</span></div>
        <div className="tb-strategy-tool"><div className="tb-phase-selector"><div className="phase-buttons"><button className="selected-phase">Phase 1</button><button>Phase 2</button><button>Phase 3</button></div><button className="btn-optimize">Optimise</button></div>
          <div className="tb-zone-card dark"><div className="zone-header"><h3>Zeffo (dark side)</h3></div><div className="star-toggles"><button className="active">1★</button><button>2★</button><button>3★</button></div></div></div></section>
      <HubLinks message="Territory Battle allocations are calculated using synced guild snapshots."><span>Back to Operations →</span></HubLinks>
    </HubPage>
  );
  if (screen === "datacrons") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Datacrons" title="Holocron power. Tactical advantage." intro="Track active SWGOH Datacron sets, review the guild's Level 9 character super-weapons and Level 6 faction boosts, and optimize squad pairings for Territory War victory." />
      <DatacronsInteractive initialData={DC_SAMPLE} />
      <HubLinks message="Active Datacron intelligence and guild inventory aggregated from player Comlink syncs."><span>Open Territory War Command →</span></HubLinks>
    </HubPage>
  );
  if (screen === "arsenal") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Guild arsenal" title="Know what the band can put on the field." intro="Click any card to plan squad coverage and check player eligibility." />
      <div className="hub-stats"><div className="intel-summary"><div><strong>48<span>/50</span></strong><small>profiles synced</small></div><div><strong>96<span>%</span></strong><small>roster coverage</small></div><div><strong>120</strong><small>priority units</small></div></div></div>
      <ArsenalInteractive syncedMembers={48} categories={[{ name: "Galactic Legends" as never, coverage: 80, units: [["Lord Vader", 30, 28, 20, 12, 6.4], ["Jedi Master Kenobi", 44, 40, 30, 22, 7.1], ["Rey", 25, 20, 12, 5, 4.2]].map(([name, owned, sevenStar, relic, relicFive, averageRelic], i) => ({ definitionId: "u" + i, name: name as string, owned: owned as number, sevenStar: sevenStar as number, relic: relic as number, relicFive: relicFive as number, averageRelic: averageRelic as number, owners: [] })) }]} />
    </HubPage>
  );
  if (screen === "discs") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Dougie's Discs · Galactic Jukebox" title="Chicago soul. Outer Rim rhythm." intro="The mission has music. Drop a credit into Dougie's Jukebox, spin timeless Blues Brothers classics and Chicago blues legends, or queue your own favourite YouTube record." />
      <DougiesJukebox initialDiscs={CURATED_DISCS} />
      <HubLinks message="Curated vinyl and transmissions from Dougie's Speakeasy databank."><span>Visit Soul Food Cantina →</span></HubLinks>
    </HubPage>
  );
  if (screen === "cantina") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Soul Food Cantina" title="Good food. Across the galaxy." intro="Galactic sandwich recipes, tap-droid beer pairings and community specials from Chicago to the Outer Rim." />
      <SoulFoodCafe recipes={await getSoulFoodRecipes()} />
    </HubPage>
  );
  if (screen === "mission") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Mission From God" title="A thirty-day galactic trading run" intro="Pay Jabba, save the orphanage, and keep the Bluesmobile moving. Free play, saved on this device." />
      <div className="hub-mission"><MissionGame /></div>
    </HubPage>
  );
  if (screen === "overview") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Guild" title="Overview" intro="Guild health, the Guild Wire, legends and the watchlist, and who has just joined." meta="Comlink connected · Last capture 2h ago" />
      <div className="hub-overview"><div className="dashboard-content">
        <section className="metric-grid">
          <article className="metric-card"><div className="metric-head"><span>Active members</span><span className="nav-mark">MB</span></div><strong>49<small>/50</small></strong><p>1 place available</p></article>
          <article className="metric-card"><div className="metric-head"><span>Guild power</span><span className="nav-mark">GP</span></div><strong>1.31<small>B</small></strong><p>Across the roster</p></article>
          <article className="metric-card"><div className="metric-head"><span>Daily tickets</span><span className="nav-mark">TK</span></div><strong>2,430</strong><div className="progress-track"><i style={{ width: "8%" }} /></div></article>
          <article className="metric-card"><div className="metric-head"><span>Needs attention</span><span className="nav-mark">!</span></div><strong>3</strong><p>Members to check in</p></article>
        </section>
        <section className="guild-wire"><div className="wire-feed"><div className="wire-head"><div><p className="eyebrow">Guild communications</p><h2>The Guild Wire</h2></div><span className="wire-sync"><i /> Website + Discord</span></div><p className="wire-intro">Guild news lives here. The same membership announcements are sent into Discord.</p>
          <div className="wire-list"><article className="wire-item"><span className="wire-icon">+</span><div><div className="wire-meta"><span>Welcome, Brian</span><time>2h ago</time></div><p>Joined the band at 7.9M GP.</p></div></article></div></div>
          <aside className="discord-handoff"><div className="discord-handoff-head"><span className="discord-glyph">◈</span><div><p>Discord</p><strong>Prefer the app?</strong></div></div><a className="discord-open" href="#">Open Discord <span>→</span></a></aside></section>
        <section className="section-block standings-section"><div className="standings-grid">
          <section className="standing-panel fame-panel"><header className="standing-panel-head"><div><span className="standing-symbol">★</span><p>Cantina legends</p><h3>Wall of Fame</h3></div></header><p className="standing-copy">Guild leaderboards across power, tickets and roster depth.</p><ol className="standing-list"><li><a href="#"><span className="standing-rank">1</span><span className="standing-avatar">D</span><span className="standing-member"><strong>Dex</strong><small>Top power</small></span><span className="standing-value"><strong>11.1M</strong><small>GP</small></span></a></li></ol></section>
          <section className="standing-panel watch-panel"><header className="standing-panel-head"><div><span className="standing-symbol">!</span><p>Officer watchlist</p><h3>Needs a check-in</h3></div></header><p className="standing-copy">A practical shortlist, not a permanent label.</p></section>
        </div></section>
      </div></div>
      <HubLinks message="Live guild data from Comlink and the Discord announcements."><span>Operations</span></HubLinks>
    </HubPage>
  );
  if (screen === "wins") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="The Wins" title="What the band got done" intro="Every Galactic Legend, ultimate and relic level-up, spotted from real member rosters as the guild sync runs." meta="This week" />
      <div className="hub-stats"><div className="intel-summary"><div><strong>2</strong><small>Galactic Legends this week</small></div><div><strong>1</strong><small>Ultimates</small></div><div><strong>14</strong><small>Relic level-ups</small></div><div><strong>9</strong><small>Members levelled up</small></div></div></div>
      <section className="tw-roster-section"><header><div><p className="eyebrow">Last three weeks</p><h2>Win after win</h2></div><p>A day here is the day we noticed it.</p></header>
        <div className="wins-feed"><section className="wins-day"><h3>Friday 16 October</h3>
          <article className="win-item win-headline"><span className="win-icon">★</span><div><p><strong>Steve</strong> unlocked Lord Vader: their 4th Galactic Legend</p><small>Galactic Legend</small></div></article>
          <article className="win-item"><span className="win-icon">◆</span><div><p><strong>Dex</strong> took Jedi Master Kenobi to Relic 8</p><small>Relic</small></div></article>
          <details className="wins-more"><summary>2 more upgrades</summary></details></section></div></section>
      <HubLinks message="Spot a win we missed?"><span>See the roster →</span></HubLinks>
    </HubPage>
  );
  if (screen === "chat") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Guild" title="Guild chat" intro="The Blues Brothers Discord channels, on the site." />
      <div className="hub-chatframe"><ChatClient channels={[{ key: "general", label: "general" }, { key: "tw", label: "territory-war" }]} signedInAsMember /></div>
    </HubPage>
  );
  if (screen === "roster-report") return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Roster report" intro="Tickets, raid participation and Territory War joins in one filterable table." />
      <div className="hub-stats"><div className="intel-summary"><div><strong>49</strong><small>active members</small></div><div><strong>3</strong><small>need attention</small></div><div><strong>12</strong><small>in the archive</small></div></div></div>
      <section className="rr-section"><OfficerRosterTable raidLabel="Krayt Dragon" twLabel="Current war" rows={[0, 1, 2].map((i) => ({ playerId: "p" + i, name: ["Dex", "ZappAttk", "Igor"][i], role: i ? null : "OFFICER", state: "ACTIVE" as const, joinedAt: "2026-02-10T10:00:00Z", leftAt: null, tenureDays: 249, galacticPower: String(11e6 - i * 3e6), raidTickets: [600, 310, 80][i], ticketTarget: 600, lastActivityAt: "2026-10-17T06:00:00Z", raidLabel: "Krayt Dragon", raidParticipated: i < 2, raidDamage: 4e6, twLabel: "Current war", twJoined: i < 2, flags: i === 2 ? ["Sat out the last raid"] : [], needsAttention: i === 2 }))} /></section>
    </HubPage>
  );
  if (screen === "credits") return <CreditsPage />;
  if (screen === "more") return <MoreView isOfficer discordUrl="https://discord.gg/example" />;
  if (screen === "ask") return <AskView left={{ left: 4, limit: 5, resetsLabel: "Monday 20 Oct" }}><AskTabs initialTab="counters" names={KNOW_NAMES} canAct chat={<section className="hub-section hub-chat" id="ask-blue"><div className="blue-chat"><div className="blue-status">4 of 5 questions left this week</div><form className="blue-form"><input placeholder="Ask B-Lue3 about the game" /><button type="submit">Ask</button></form></div></section>} /></AskView>;
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
