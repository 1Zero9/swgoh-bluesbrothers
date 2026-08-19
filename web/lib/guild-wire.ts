import { getPrisma } from "@/lib/prisma";

export type GuildWireItem = {
  id: string;
  kind: "welcome" | "departure" | "notice" | "system";
  title: string;
  summary: string;
  occurredAt: Date;
  status: "sent" | "pending" | "failed";
};

const fallbackItems: GuildWireItem[] = [
  {
    id: "wire-ready",
    kind: "system",
    title: "Guild Wire ready",
    summary: "Membership announcements will appear here after the first roster sync.",
    occurredAt: new Date("2026-08-19T08:00:00Z"),
    status: "pending",
  },
];

export async function getGuildWire() {
  if (!process.env.DATABASE_URL) return fallbackItems;

  try {
    const events = await getPrisma().automationEvent.findMany({
      where: { kind: { in: ["MEMBER_WELCOME", "MEMBER_DEPARTURE", "ROSTER_BASELINE", "OFFICER_NOTICE"] } },
      orderBy: { occurredAt: "desc" },
      take: 8,
    });

    if (!events.length) return fallbackItems;
    return events.map((event): GuildWireItem => ({
      id: event.id,
      kind: event.kind === "MEMBER_WELCOME"
        ? "welcome"
        : event.kind === "MEMBER_DEPARTURE"
          ? "departure"
          : event.kind === "OFFICER_NOTICE"
            ? "notice"
            : "system",
      title: event.title ?? (event.kind === "MEMBER_WELCOME"
        ? "Welcome to the band"
        : event.kind === "MEMBER_DEPARTURE"
          ? "Until the next gig"
          : "Roster connected"),
      summary: event.summary,
      occurredAt: event.occurredAt,
      status: event.status.toLowerCase() as GuildWireItem["status"],
    }));
  } catch {
    return fallbackItems;
  }
}
