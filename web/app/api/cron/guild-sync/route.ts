import { syncGuildRoster } from "@/lib/guild-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncGuildRoster();
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json({ ok: false, error: "guild sync failed" }, { status: 500 });
  }
}
