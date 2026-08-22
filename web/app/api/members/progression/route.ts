import { getPlayerProgression } from "@/lib/progression";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return Response.json({ error: "Missing playerId parameter." }, { status: 400 });
  }

  try {
    const points = await getPlayerProgression(playerId);
    return Response.json({ points });
  } catch (error) {
    console.error("Progression API error:", error);
    return Response.json({ error: "Failed to load progression history." }, { status: 500 });
  }
}
