import { after } from "next/server";
import { defang } from "@/lib/knowledge/requests";
import { postDiscordAnnouncement } from "@/lib/discord";
import { getPrisma } from "@/lib/prisma";
import { PROBLEMS, validateHelp } from "@/lib/signin-help";
import { deviceFrom } from "@/lib/visits";
import { recordSignIn } from "@/lib/signin-events-data";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status, headers: NO_STORE });

/** "Help me, Obi-Wan": someone who can't sign in asks the officers for a personal link. Open to anyone, so it is capped. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Not allowed.", 403);
  const checked = validateHelp(await request.json().catch(() => null));
  if (!checked.ok) return fail(checked.error, 400);
  const db = getPrisma();
  const recent = await db.signInHelp.count({ where: { createdAt: { gte: new Date(Date.now() - 10 * 60_000) } } });
  if (recent >= 8) return fail("A lot of people are asking right now. Please message an officer in the Discord instead.", 429);

  const agent = request.headers.get("user-agent");
  const device = deviceFrom(agent);
  const { name, contact, problem, note } = checked.value;
  const open = await db.signInHelp.findFirst({ where: { name: { equals: name, mode: "insensitive" }, status: "OPEN" }, select: { id: true } });
  if (open) await db.signInHelp.update({ where: { id: open.id }, data: { contact, problem, note, device } });
  else {
    await db.signInHelp.create({ data: { name, contact, problem, note, device } });
    after(async () => {
      await recordSignIn("help", agent);
      const webhook = process.env.DISCORD_OFFICER_WEBHOOK_URL;
      if (!webhook) return;
      try {
        const lines = [`**${defang(name)}** can't get signed in.`, `Problem: ${PROBLEMS[problem]}`, contact ? `Reach them: ${defang(contact)}` : "", note ? `> ${defang(note)}` : "", `Make them a personal link: ${siteUrl()}/officer/signin-link`].filter(Boolean);
        await postDiscordAnnouncement({ title: "Help me, Obi-Wan", description: lines.join("\n").slice(0, 1800), color: 0xf59e0b, footer: "Blues Brothers · Sign-in help" }, webhook);
      } catch (error) {
        console.error("signin help: not posted", error instanceof Error ? error.message : "unknown");
      }
    });
  }
  return Response.json({ ok: true }, { headers: NO_STORE });
}
