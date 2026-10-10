import { getViewerAccess } from "@/lib/access-control";
import { canPostTo, chatChannel, getChatMessages, postChatMessage } from "@/lib/chat";
import { cleanMessage, postingAllowed } from "@/lib/chat-rules";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

function fail(error: string, status: number) {
  return Response.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Members and officers can read the mirrored channels. */
export async function GET(request: Request) {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return fail("Members only.", 401);

  const channel = chatChannel(new URL(request.url).searchParams.get("channel") ?? "");
  if (!channel) return fail("Unknown channel.", 404);

  const result = await getChatMessages(channel);
  if (!result.ok) return fail(result.error, result.status);
  return Response.json(
    { ok: true, channel: channel.key, canPost: canPostTo(channel) && Boolean(access.playerId), messages: result.messages, contentHidden: result.contentHidden },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Only signed-in members (with a linked player) can post, and they post under their own name. */
export async function POST(request: Request) {
  const access = await getViewerAccess();
  if (!access.isMember || !access.playerId) return fail("Sign in with Discord to post.", 401);

  const body = (await request.json().catch(() => null)) as { channel?: string; content?: unknown } | null;
  const channel = chatChannel(body?.channel ?? "");
  if (!channel) return fail("Unknown channel.", 404);
  const content = cleanMessage(body?.content);
  if (!content) return fail("Write something first.", 400);
  if (!postingAllowed(access.playerId)) return fail("Easy there. Give it a couple of seconds.", 429);

  const player = await getPrisma().player.findUnique({ where: { id: access.playerId }, select: { currentName: true, discordUserId: true } });
  if (!player) return fail("We couldn't find your player.", 404);

  const result = await postChatMessage(channel, { name: player.currentName, discordUserId: player.discordUserId }, content);
  if (!result.ok) return fail(result.error, 502);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
