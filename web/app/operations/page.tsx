import type { Metadata } from "next";
import Link from "next/link";
import MembersOnly from "@/app/members-only";
import PageHero from "@/app/page-hero";
import IntelFooter from "@/app/intel-footer";
import { getDashboardSummary } from "@/lib/dashboard";
import NavIcon from "@/app/nav-icon";
import { canViewMembersArea } from "@/lib/member-gate";
import { isOfficerRequest } from "@/lib/officer-session";
import { getTerritoryWarRoom } from "@/lib/territory-war";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Guild Operations · Blues Brothers",
  description: "Territory War, Territory Battle, raid and roster-planning destinations.",
};

function power(value: bigint) {
  const amount = Number(value);
  return amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(1)}M` : amount.toLocaleString("en-GB");
}

export default async function OperationsPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/operations" area="Guild operations" />;
  const [war, summary, isOfficer] = await Promise.all([getTerritoryWarRoom(), getDashboardSummary(), isOfficerRequest()]);

  const tools = [
    { href: "/territory-war", icon: "war", name: "Territory War", line: "Your job this war", fact: war.active ? `Live vs ${war.opponentName || "the opposition"}` : "No war running" },
    { href: "/territory-battles", icon: "planet", name: "Territory Battles", line: "Callouts and the plan", fact: summary.live ? `${summary.memberCount} members` : "—" },
    { href: "/counters", icon: "shield", name: "Counters", line: "What beats what, and who can run it", fact: "TW and GAC" },
    { href: "/raids", icon: "raid", name: "Raids", line: "Who carried the last raid", fact: summary.live ? `${summary.dailyTickets.toLocaleString("en-GB")} tickets today` : "—" },
    { href: "/datacrons", icon: "datacron", name: "Datacrons", line: "The guild's Level 9 weapons", fact: "Active sets" },
    { href: "/arsenal", icon: "rocket", name: "Arsenal", line: "What the guild can field", fact: summary.live ? `${power(summary.guildPower)} GP` : "—" },
    { href: "/members#who-has", icon: "search", name: "Who has…?", line: "Find a unit in the guild", fact: "Search" },
    ...(isOfficer ? [{ href: "/officer/discord-sync", icon: "blue", name: "Discord sync", line: "Officers: roles and name matches", fact: "Officers only" }] : []),
  ];

  return (
    <main className="intel-shell destination-shell operations-shell">
      <PageHero
        image="/ops-banner.webp"
        imageAlt="The Blues Brothers and guild officers planning missions around a holographic operations table"
        eyebrow="Guild operations"
        title={<>Every mission.<br /><em>One launch deck.</em></>}
        description="Pick a tool."
        priority
      />

      <nav className="quick-launch ops-launch" aria-label="Operations tools">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="quick-tool">
            <span className="quick-icon" aria-hidden="true"><NavIcon name={tool.icon} size={22} /></span>
            <strong>{tool.name}</strong>
            <small>{tool.line}</small>
            <em className="ops-fact">{tool.fact}</em>
          </Link>
        ))}
      </nav>

      <IntelFooter message="Everything the guild uses to plan a war, a battle or a raid.">
        <Link href="/members">Open member directory →</Link>
      </IntelFooter>
    </main>
  );
}
