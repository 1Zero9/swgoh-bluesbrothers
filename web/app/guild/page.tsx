import type { Metadata } from "next";
import { GuildView } from "@/app/hub-views";
import MembersOnly from "@/app/members-only";
import { canViewMembersArea } from "@/lib/member-gate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Guild · Blues Brothers",
  description: "The people and the war room.",
};

export default async function GuildPage() {
  if (!(await canViewMembersArea())) return <MembersOnly path="/guild" area="The guild area" />;
  return <GuildView />;
}
