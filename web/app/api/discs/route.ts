import { CURATED_DISCS, DISC_CATEGORIES } from "@/lib/discs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    categories: DISC_CATEGORIES,
    discs: CURATED_DISCS,
    total: CURATED_DISCS.length,
  });
}
