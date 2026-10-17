import { getPrisma } from "@/lib/prisma";
import { clientFrom, summariseSignIns, type SignInKind } from "@/lib/signin-events";

/** Best effort: a sign-in must never fail because we couldn't count it. */
export async function recordSignIn(kind: SignInKind, userAgent: string | null) {
  try {
    const client = clientFrom(userAgent);
    await getPrisma().signInEvent.create({ data: { kind, device: client.device, browser: client.browser, inApp: client.inApp } });
  } catch (error) {
    console.error("signin: not counted", error instanceof Error ? error.message : "unknown");
  }
}

export async function signInOverview(days = 30) {
  const db = getPrisma();
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db.signInEvent.findMany({ where: { at: { gte: since } }, select: { kind: true, device: true, browser: true, inApp: true }, take: 20_000 });
  return { days, ...summariseSignIns(rows) };
}
