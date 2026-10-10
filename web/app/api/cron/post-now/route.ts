import { channelWebhook, postWeeklyNewsIfDue, postWeeklyPromptIfDue, runWeeklyPublicStats } from "@/lib/curated-posts";
import { getStarWarsNews } from "@/lib/news";
import { pickPrompt, PROMPTS } from "@/lib/prompts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Manual "post now" for the curated posts, behind the cron secret and run from the "Post now" GitHub workflow.
 * ?what=public-stats | prompt | news | both   ?dry=1 previews without posting (and reports which channels are wired).
 * The once-a-week guards still apply, so pressing it twice never double-posts.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const what = params.get("what") ?? "both";
  const dryRun = params.get("dry") === "1";
  const result: Record<string, unknown> = {
    channels: { general: Boolean(channelWebhook("general")), public: Boolean(channelWebhook("public")) },
  };

  try {
    if (what === "public-stats" || what === "both") {
      const stats = await runWeeklyPublicStats({ dryRun });
      result.publicStats = { posted: stats.posted, reason: stats.reason, preview: stats.post.description };
    }
    if (what === "prompt" || what === "both") {
      result.prompt = dryRun
        ? { posted: false, reason: "dry run", preview: pickPrompt([], PROMPTS).text }
        : { posted: await postWeeklyPromptIfDue(new Date(), { force: true }) };
    }
    if (what === "news") {
      result.news = dryRun
        ? { posted: false, reason: "dry run", preview: (await getStarWarsNews(5, 600)).map((item) => `${item.game ? "[game] " : ""}${item.title} (${item.source})`) }
        : { posted: await postWeeklyNewsIfDue(new Date(), { force: true }) };
    }
    return Response.json({ ok: true, dryRun, ...result });
  } catch (error) {
    console.error("post-now failed", error);
    return Response.json({ ok: false, error: "post-now failed" }, { status: 500 });
  }
}
