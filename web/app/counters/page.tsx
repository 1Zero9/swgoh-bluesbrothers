import { redirect } from "next/navigation";

/** Saved squads now live inside Ask, under "Find a counter". Old links and bookmarks land there. */
export default function CountersPage() {
  redirect("/ask?tab=counters");
}
