import type { Metadata } from "next";
import HubPage, { HubHeader } from "@/app/hub-page";
import MembersOnly from "@/app/members-only";
import { getViewerAccess } from "@/lib/access-control";
import { adminOverview } from "@/lib/blue/log";
import { isSiteAdmin } from "@/lib/site-admin";
import BlueLog from "./blue-log";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "B-Lue3 log · Blues Brothers", robots: { index: false } };

export default async function BlueAdminPage() {
  const access = await getViewerAccess();
  if (!isSiteAdmin(access)) return <MembersOnly path="/admin/blue" area="The B-Lue3 question log" />;
  let initial = { questions: [], members: [], searches: [], cutoffs: [] } as Awaited<ReturnType<typeof adminOverview>>;
  try { initial = await adminOverview("all"); } catch { /* table not ready: show it empty */ }
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Site admin" title="B-Lue3 question log" intro="Every question asked of B-Lue3, who asked it and how it was handled. Only you can see this. Cut off anyone who abuses it." />
      <BlueLog initial={initial} />
    </HubPage>
  );
}
