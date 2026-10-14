import { notFound } from "next/navigation";
import HubHome from "@/app/hub-home";
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
  if (screen === "ask") return <AskView><p style={{ color: "var(--hub-muted)" }}>(The chat appears here.)</p></AskView>;
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
    />
  );
}
