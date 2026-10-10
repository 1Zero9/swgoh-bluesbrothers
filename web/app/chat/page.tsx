import type { Metadata } from "next";
import MembersOnly from "@/app/members-only";
import SiteHeader from "@/app/site-header";
import { getViewerAccess } from "@/lib/access-control";
import { enabledChatChannels } from "@/lib/chat-config";
import ChatClient from "./chat-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Guild Chat · Blues Brothers",
  description: "The Blues Brothers Discord channels, on the site.",
};

export default async function ChatPage() {
  const access = await getViewerAccess();
  if (!(access.isMember || access.isOfficer)) return <MembersOnly path="/chat" area="The guild chat" />;

  const channels = enabledChatChannels().map(({ key, label }) => ({ key, label }));

  return (
    <main className="chat-page">
      <SiteHeader homeHref="/" syncLabel="Guild chat" />
      <ChatClient channels={channels} signedInAsMember={access.isMember && Boolean(access.playerId)} />
    </main>
  );
}
