import { CURRENT_ID, DEFAULT_ANNOUNCEMENT, type Announcement, type AnnouncementInput } from "@/lib/announcement";
import { getPrisma } from "@/lib/prisma";

/** The saved announcement, or the starting words when nothing has been saved yet (or the database is not reachable). */
export async function getAnnouncement(): Promise<Announcement> {
  try {
    const row = await getPrisma().announcement.findUnique({ where: { id: CURRENT_ID } });
    if (!row) return DEFAULT_ANNOUNCEMENT;
    return { enabled: row.enabled, label: row.label, title: row.title, text: row.text, cta: row.cta, href: row.href, quote: row.quote, seconds: row.seconds, version: row.version };
  } catch {
    return DEFAULT_ANNOUNCEMENT;
  }
}

/** Save an officer's edit. The version goes up so everyone sees it again. */
export async function saveAnnouncement(input: AnnouncementInput, officer: string): Promise<Announcement> {
  const prisma = getPrisma();
  const row = await prisma.announcement.upsert({
    where: { id: CURRENT_ID },
    create: { id: CURRENT_ID, ...input, version: 2, updatedByName: officer },
    update: { ...input, version: { increment: 1 }, updatedByName: officer },
  });
  return { enabled: row.enabled, label: row.label, title: row.title, text: row.text, cta: row.cta, href: row.href, quote: row.quote, seconds: row.seconds, version: row.version };
}
