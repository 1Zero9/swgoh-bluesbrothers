import type { Metadata } from "next";
import MembersOnly from "@/app/members-only";
import HubPage, { HubHeader } from "@/app/hub-page";
import { getViewerAccess } from "@/lib/access-control";
import { getPrisma } from "@/lib/prisma";
import SignInLinkMaker from "./maker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign-in links · Blues Brothers", robots: { index: false } };

export default async function SignInLinkPage() {
  const access = await getViewerAccess();
  if (!access.isOfficer) return <MembersOnly path="/officer/signin-link" area="Sign-in links" />;
  const players = await getPrisma().player.findMany({ where: { membershipTerms: { some: { state: "ACTIVE" } } }, select: { id: true, currentName: true }, orderBy: { currentName: "asc" } });
  const help = await getPrisma().signInHelp.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, take: 30 }).catch(() => []);
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Officers" title="Sign-in links" intro="For a member who can't get Discord sign-in to work. Make them a one-time link, send it to them privately, and they tap once to come in. It works once and lasts two days." />
      <SignInLinkMaker members={players.map((p) => ({ id: p.id, name: p.currentName }))} requests={help.map((h) => ({ id: h.id, name: h.name, contact: h.contact, problem: h.problem, note: h.note }))} />
    </HubPage>
  );
}
