import { cookies } from "next/headers";
import { fetchPlayerByAllyCode, sanitizeAllyCode } from "@/lib/comlink";
import {
  LINK_COOKIE_NAME,
  MEMBER_COOKIE_NAME,
  createMemberCookieValue,
  verifyLinkCookieValue,
} from "@/lib/member-auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const store = await cookies();
  const link = verifyLinkCookieValue(store.get(LINK_COOKIE_NAME)?.value);
  if (!link) {
    return Response.json({ ok: false, error: "Your Discord sign-in expired. Try linking again." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { allyCode?: string } | null;
  const allyCode = sanitizeAllyCode(body?.allyCode ?? "");
  if (!allyCode) {
    return Response.json({ ok: false, error: "That doesn't look like a valid ally code." }, { status: 400 });
  }

  let comlinkPlayer;
  try {
    comlinkPlayer = await fetchPlayerByAllyCode(allyCode);
  } catch {
    return Response.json({ ok: false, error: "Couldn't reach the holonet to check that ally code." }, { status: 502 });
  }
  if (!comlinkPlayer) {
    return Response.json({ ok: false, error: "We couldn't find that ally code." }, { status: 404 });
  }

  const prisma = getPrisma();
  const player = await prisma.player.findUnique({
    where: { id: comlinkPlayer.playerId },
    include: { membershipTerms: { where: { state: "ACTIVE" } } },
  });

  if (!player || player.membershipTerms.length === 0) {
    return Response.json(
      { ok: false, error: "That ally code isn't an active Blues Brothers member yet. Ask an officer to run a sync." },
      { status: 403 },
    );
  }

  try {
    await prisma.player.update({
      where: { id: player.id },
      data: { discordUserId: link.discordUserId },
    });
  } catch {
    return Response.json(
      { ok: false, error: "That Discord account is already linked to another member." },
      { status: 409 },
    );
  }

  const session = createMemberCookieValue(player.id);
  store.delete(LINK_COOKIE_NAME);
  store.set(MEMBER_COOKIE_NAME, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });

  return Response.json({ ok: true, name: player.currentName });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(MEMBER_COOKIE_NAME);
  store.delete(LINK_COOKIE_NAME);
  return Response.json({ ok: true });
}
