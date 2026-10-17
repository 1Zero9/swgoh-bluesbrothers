/** The launch checklist: plain rules turning numbers and switches into "good / needs a look / not ready" rows. Pure, so it is tested. */

export type Tone = "good" | "warn" | "bad";
export type CheckRow = { label: string; value: string; tone: Tone; detail: string; href?: string; action?: string };

export type LaunchFacts = {
  blueAi: boolean;
  webSearch: boolean;
  published: number;
  candidates: number;
  savedWaiting: number;
  tips: number;
  ideas: number;
  openRequests: number;
  activeMembers: number;
  discordLinked: number;
  seenThisWeek: number;
  helpWaiting: number;
  botConfigured: boolean;
  countersWebhook: boolean;
  officerWebhook: boolean;
  discordWidget: boolean;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function launchRows(f: LaunchFacts): { group: string; rows: CheckRow[] }[] {
  const never = Math.max(0, f.activeMembers - f.discordLinked);
  return [
    {
      group: "B-Lue3 and counters: what people find first",
      rows: [
        { label: "B-Lue3 AI chat", value: f.blueAi ? "On" : "Off", tone: f.blueAi ? "good" : "bad", detail: f.blueAi ? "He can answer questions after checking the guild's knowledge." : "He will only answer from the guild's own knowledge and say the AI is off. Set BLUE_AI=on in Vercel to switch it on." },
        { label: "Web search for counters", value: f.webSearch ? "On" : "Off", tone: f.webSearch ? "good" : "warn", detail: f.webSearch ? "When the guild has nothing, he can search the web, when the member chooses to." : "Without it, nothing is found for a squad the guild hasn't covered yet. Needs the Google key in Vercel." },
        { label: "Counters members can find", value: String(f.published), tone: f.published >= 10 ? "good" : f.published > 0 ? "warn" : "bad", detail: f.published === 0 ? "Nothing is published, so every search finds nothing and falls to the web search. Publish the best counters first." : f.published < 10 ? "A good start. The squads people face most (Territory War defences) matter most." : "Plenty to start with.", href: "/knowledge/review", action: "Review queue" },
        { label: "Waiting for an officer's check", value: String(f.candidates), tone: f.candidates === 0 ? "good" : "warn", detail: f.candidates === 0 ? "Nothing is stuck in the queue." : `${plural(f.candidates, "counter")} submitted but not yet visible to members.`, href: "/knowledge/review", action: "Open the queue" },
        { label: "Saved squads not yet imported", value: String(f.savedWaiting), tone: f.savedWaiting === 0 ? "good" : "warn", detail: f.savedWaiting === 0 ? "Everything saved has been brought in." : "Old saved squads that are not in the counter knowledge base yet. Import them, then publish the good ones.", href: "/knowledge/review", action: "Import them" },
        { label: "Tips and ideas published", value: `${f.tips} + ${f.ideas}`, tone: f.tips + f.ideas > 0 ? "good" : "warn", detail: "Tips and ideas B-Lue3 can also use.", href: "/knowledge/tips", action: "Tips" },
        { label: "Counters members are asking for", value: String(f.openRequests), tone: "good", detail: f.openRequests ? "These are on the Wanted list and in Find a counter." : "None open." },
      ],
    },
    {
      group: "Members getting in",
      rows: [
        { label: "Members signed in this week", value: `${f.seenThisWeek} of ${f.activeMembers}`, tone: f.seenThisWeek >= f.activeMembers * 0.5 ? "good" : "warn", detail: "From the visit log. After the launch post, this is the number to watch.", href: "/admin/usage", action: "Who uses it" },
        { label: "Discord accounts linked", value: `${f.discordLinked} of ${f.activeMembers}`, tone: never === 0 ? "good" : "warn", detail: never === 0 ? "Everyone is linked." : `${plural(never, "member")} not linked yet. They need to sign in once (or you can send a personal link).`, href: "/officer/signin-link", action: "Sign-in links" },
        { label: '"Help me, Obi-Wan" requests waiting', value: String(f.helpWaiting), tone: f.helpWaiting === 0 ? "good" : "bad", detail: f.helpWaiting === 0 ? "Nobody is stuck." : "Someone is waiting for a personal sign-in link.", href: "/officer/signin-link", action: "Make links" },
      ],
    },
    {
      group: "Discord",
      rows: [
        { label: "Bot connected", value: f.botConfigured ? "Yes" : "No", tone: f.botConfigured ? "good" : "bad", detail: "Needed for chat, roles and the member list." },
        { label: "Counter requests channel", value: f.countersWebhook ? "Set" : "Not set", tone: f.countersWebhook ? "good" : "warn", detail: f.countersWebhook ? "Requests for a counter are posted in Discord." : "Requests still show on the site, but nobody is told in Discord. Add DISCORD_COUNTERS_WEBHOOK_URL." },
        { label: "Officers' help channel", value: f.officerWebhook ? "Set" : "Not set", tone: f.officerWebhook ? "good" : "warn", detail: f.officerWebhook ? "\"Help me, Obi-Wan\" requests are posted to officers." : "Without it, officers have to check the Sign-in links page. Add DISCORD_OFFICER_WEBHOOK_URL (an officers-only channel)." },
        { label: "Discord widget (Who's online)", value: f.discordWidget ? "On" : "Off", tone: f.discordWidget ? "good" : "warn", detail: f.discordWidget ? "Who's online shows who is on Discord." : "Server Settings → Widget → Enable Server Widget." },
      ],
    },
  ];
}
