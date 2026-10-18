import type { Metadata } from "next";
import Link from "next/link";
import HubLinkList from "@/app/hub-link-list";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { blueEnabled, webSearchOn } from "@/lib/blue/ask";
import { researchLimit } from "@/lib/blue/limits";
import { countNotesAwaitingReview } from "@/lib/knowledge/notes-data";
import { getPrisma } from "@/lib/prisma";
import { isSiteAdmin } from "@/lib/site-admin";
import type { HubLink } from "@/lib/hub-links";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Site admin · Blues Brothers", robots: { index: false } };

const VERCEL = "https://vercel.com/onezeronines-projects-e2ecda52/swgoh-bluesbrothers";
const GITHUB = "https://github.com/1Zero9/swgoh-bluesbrothers";

const WATCH: HubLink[] = [
  { label: "Launch checklist", hint: "What members find on day one, and what is missing", href: "/officer/launch", icon: "clipboard" },
  { label: "Sign-in tracker", hint: "How many tried, how many got in, which devices struggle", href: "/admin/signin", icon: "report" },
  { label: "Who uses the site", hint: "Who has been seen, who hasn't, and where from", href: "/admin/usage", icon: "me" },
  { label: "B-Lue3 log", hint: "Every question asked, and cut-offs for misuse", href: "/admin/blue", icon: "blue" },
];
const PEOPLE: HubLink[] = [
  { label: "Sign-in links", hint: "A one-time link for someone who can't sign in, and Obi-Wan requests", href: "/officer/signin-link", icon: "me" },
  { label: "Discord sync", hint: "Roles and name mismatches", href: "/officer/discord-sync", icon: "blue" },
  { label: "Member cards", hint: "A one-page overview of any member", href: "/officer/member", icon: "roster" },
  { label: "Roster report", hint: "Participation and guild history", href: "/officer/roster", icon: "report" },
];
const CONTENT: HubLink[] = [
  { label: "Review queue", hint: "Counters and tips waiting for a check, and the research tools", href: "/knowledge/review", icon: "clipboard" },
  { label: "Announcement", hint: "The pop-up members see on their first visit", href: "/officer/announcement", icon: "star" },
  { label: "Combat handbook", hint: "Mods, turn order and omicron priority", href: "/knowledge/handbook", icon: "report" },
  { label: "Glossary", hint: "What the short forms mean", href: "/knowledge/glossary", icon: "report" },
  { label: "Sign-in help page", hint: "The step-by-step page members are sent to", href: "/help/sign-in", icon: "chat" },
];

const OUTSIDE: { label: string; hint: string; href: string }[] = [
  { label: "Vercel: deployments and logs", hint: "Is the site up, and what went wrong if it isn't", href: VERCEL },
  { label: "Vercel: environment variables", hint: "Where the switches above are set", href: `${VERCEL}/settings/environment-variables` },
  { label: "Vercel: analytics", hint: "Page views from outside the site", href: `${VERCEL}/analytics` },
  { label: "GitHub: the code and recent changes", hint: "Every release is a merged pull request, easy to undo", href: GITHUB },
  { label: "Discord: help centre", hint: "To show who is on Discord in Who's online, switch on Server Settings → Widget", href: "https://support.discord.com/" },
];

export default async function AdminHome() {
  const access = await getViewerAccess();
  if (!isSiteAdmin(access)) return <MembersOnly path="/admin" area="The site admin area" />;
  const db = getPrisma();
  const safe = async <T,>(work: Promise<T>, fallback: T) => work.catch(() => fallback);
  const [counters, notes, helpWaiting, requests] = await Promise.all([
    safe(db.kbMatchup.count({ where: { status: { in: ["CANDIDATE", "DISPUTED"] } } }), 0),
    safe(countNotesAwaitingReview(), 0),
    safe(db.signInHelp.count({ where: { status: "OPEN" } }), 0),
    safe(db.kbRequest.count({ where: { status: "OPEN" } }), 0),
  ]);
  return <AdminHomeView counts={{ review: counters + notes, help: helpWaiting, requests }} switches={[
    { label: "B-Lue3 AI", value: blueEnabled() ? "On" : "Off", env: "BLUE_AI" },
    { label: "Web search", value: webSearchOn() ? "On" : "Off", env: "GOOGLE_GENERATIVE_AI_API_KEY" },
    { label: "Weekly question limit", value: process.env.BLUE_WEEKLY_LIMIT ?? "5 (default)", env: "BLUE_WEEKLY_LIMIT" },
    { label: "Officer research per week", value: String(researchLimit()), env: "BLUE_RESEARCH_LIMIT" },
    { label: "Officers' help channel", value: process.env.DISCORD_OFFICER_WEBHOOK_URL ? "Set" : "Not set", env: "DISCORD_OFFICER_WEBHOOK_URL" },
    { label: "Counter requests channel", value: process.env.DISCORD_COUNTERS_WEBHOOK_URL ? "Set" : "Not set", env: "DISCORD_COUNTERS_WEBHOOK_URL" },
  ]} />;
}

/** The page itself, so the local preview can show it without a database. */
export function AdminHomeView({ counts, switches }: { counts: { review: number; help: number; requests: number }; switches: { label: string; value: string; env: string }[] }) {
  const tiles = [
    { value: counts.review, label: "to review", href: "/knowledge/review" },
    { value: counts.help, label: "waiting for a sign-in link", href: "/officer/signin-link" },
    { value: counts.requests, label: "counters members want", href: "/ask?tab=counters" },
  ];
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Site admin" title="Everything in one place" intro="Only you see this page. The tools for keeping an eye on the site, looking after members, and the links to where it runs." />
      <ul className="admin-tiles">
        {tiles.map((tile) => <li key={tile.label} className={tile.value ? "has-work" : undefined}><Link href={tile.href}><strong>{tile.value}</strong><span>{tile.label}</span></Link></li>)}
      </ul>
      <div className="hub-more">
        <section className="hub-section"><h2 className="hub-section-title">Keep an eye on it</h2><HubLinkList links={WATCH} /></section>
        <section className="hub-section"><h2 className="hub-section-title">Members and sign-in</h2><HubLinkList links={PEOPLE} /></section>
        <section className="hub-section"><h2 className="hub-section-title">Content</h2><HubLinkList links={CONTENT} /></section>
        <section className="hub-section">
          <h2 className="hub-section-title">Switches (set in Vercel)</h2>
          <div className="help-box">
            <ul className="admin-switches">
              {switches.map((item) => <li key={item.env}><span>{item.label}</span><strong>{item.value}</strong><code>{item.env}</code></li>)}
            </ul>
            <p className="hb-lead">To change one, open the environment variables in Vercel, edit it, then redeploy.</p>
          </div>
        </section>
        <section className="hub-section">
          <h2 className="hub-section-title">Where it runs</h2>
          <ul className="hub-links">
            {OUTSIDE.map((link) => (
              <li key={link.href}><a className="hub-link" href={link.href} target="_blank" rel="noreferrer noopener"><span className="hub-link-text"><strong>{link.label}</strong><small>{link.hint}</small></span></a></li>
            ))}
          </ul>
        </section>
      </div>
    </HubPage>
  );
}
