import { notFound } from "next/navigation";
import HubHome from "@/app/hub-home";
import { buildStatusRow } from "@/lib/home-status";
import HubPage, { HubHeading } from "@/app/hub-page";
import KnowledgeHub from "@/app/knowledge/knowledge-hub";
import LinkWelcome from "@/app/link-welcome";
import { AskView, GuildView, MoreView } from "@/app/hub-views";

/** Local preview of the hub screens with sample data. Development only: it does not exist in a production build. */
export const dynamic = "force-dynamic";

export default async function HubPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { screen } = await searchParams;
  if (screen === "welcome") return <LinkWelcome discordUsername="steve_c" discordUrl="https://discord.gg/example" preview />;
  if (screen === "guild") return <GuildView />;
  if (screen === "knowledge") return <HubPage><HubHeading eyebrow="Knowledge" title="What the guild has learned" intro="Counters, tips and ideas from the band." /><KnowledgeHub names={{}} canAct /></HubPage>;
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
      questions={{ left: 4, limit: 5, resetsLabel: "Monday 20 Oct" }}
    />
  );
}
