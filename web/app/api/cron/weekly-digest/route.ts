import { runWeeklyPublicStats } from "@/lib/curated-posts";
import { runWeeklyDigest } from "@/lib/wins-digest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const dryRun = new URL(request.url).searchParams.get("dry") === "1";
    const result = await runWeeklyDigest({ dryRun });
    // The same weekly trigger also posts the numbers-only roundup to the public channel (it has its own guard).
    const publicStats = await runWeeklyPublicStats({ dryRun }).catch((error) => {
      console.error("weekly public stats failed", error);
      return { posted: false, reason: "error" };
    });
    return Response.json({ ok: true, ...result, publicStats });
  } catch (error) {
    console.error("weekly digest failed", error);
    return Response.json({ ok: false, error: "weekly digest failed" }, { status: 500 });
  }
}
