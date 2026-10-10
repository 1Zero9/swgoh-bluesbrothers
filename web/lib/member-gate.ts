import { getViewerAccess } from "@/lib/access-control";

/** Members area: signed-in active guild members and officers. Ex-members and visitors are out. */
export async function canViewMembersArea() {
  const access = await getViewerAccess();
  return access.isMember || access.isOfficer;
}
