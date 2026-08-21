import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function field(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Recipe submissions are not configured yet." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return Response.json({ error: "That recipe is too large to submit." }, { status: 413 });
  }

  let payload: Record<string, unknown>;
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid body");
    payload = value as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Send the recipe as valid JSON." }, { status: 400 });
  }

  // Honeypot: bots frequently fill every field. Return success without storing it.
  if (field(payload.website, 200)) {
    return Response.json({ ok: true, status: "pending" }, { status: 201 });
  }

  const recipe = {
    name: field(payload.name, 100),
    origin: field(payload.origin, 100) || null,
    bread: field(payload.bread, 300),
    filling: field(payload.filling, 500),
    toppings: field(payload.toppings, 500),
    instructions: field(payload.instructions, 4_000),
    beerSuggestion: field(payload.beerSuggestion, 300) || null,
    submitterName: field(payload.submitterName, 100) || null,
    notes: field(payload.notes, 1_000) || null,
  };

  if (!recipe.name || !recipe.bread || !recipe.filling || !recipe.toppings || !recipe.instructions) {
    return Response.json({ error: "Name, bread, filling, toppings and method are required." }, { status: 400 });
  }

  try {
    await getPrisma().recipeSubmission.create({ data: recipe });
    return Response.json({ ok: true, status: "pending" }, { status: 201 });
  } catch {
    return Response.json({ error: "The recipe could not be saved. Please try again." }, { status: 503 });
  }
}
