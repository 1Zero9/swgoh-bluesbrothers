import { parseYouTubeId } from "@/lib/discs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitize(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return Response.json({ error: "That submission is too large to process." }, { status: 413 });
  }

  let payload: Record<string, unknown>;
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Invalid body");
    }
    payload = value as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Send the submission as valid JSON." }, { status: 400 });
  }

  // Honeypot anti-bot check
  if (sanitize(payload.website, 200)) {
    return Response.json({ ok: true, status: "pending" }, { status: 201 });
  }

  const title = sanitize(payload.title, 120);
  const artist = sanitize(payload.artist, 120);
  const rawUrl = sanitize(payload.youtubeUrl, 500);
  const submitterName = sanitize(payload.submitterName, 80) || "Guild Brother";
  const category = sanitize(payload.category, 60) || "community";
  const notes = sanitize(payload.notes, 1000);

  if (!title || !artist || !rawUrl) {
    return Response.json(
      { error: "Track title, artist name, and a YouTube URL or video ID are required." },
      { status: 400 }
    );
  }

  const youtubeId = parseYouTubeId(rawUrl);
  if (!youtubeId) {
    return Response.json(
      { error: "Could not extract a valid YouTube video ID from that link. Check the URL and try again." },
      { status: 400 }
    );
  }

  const createdDisc = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    artist,
    category: "community" as const,
    categoryLabel: "Guild Picks",
    youtubeId,
    album: "Guild Crate Submissions",
    year: new Date().getFullYear(),
    duration: "Live",
    vibe: notes || `Spun into Dougie's Jukebox by ${submitterName}.`,
    addedBy: submitterName,
    vinylColor: "cyan" as const,
    tempo: "Driving Shuffle" as const,
  };

  return Response.json(
    {
      ok: true,
      message: `"${title}" has been dropped into Dougie's Jukebox!`,
      track: createdDisc,
    },
    { status: 201 }
  );
}
