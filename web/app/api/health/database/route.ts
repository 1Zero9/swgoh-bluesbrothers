import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { service: "database", status: "unconfigured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await getPrisma().$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        service: "database",
        status: "ok",
        checkedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // Say what kind of failure it was (never the address or password), so a connection limit can be told from an outage.
    const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code ?? null;
    const reason = /too many|remaining connection slots|max_client_conn|53300|max clients/i.test(text) ? "too many connections"
      : /timeout|timed out/i.test(text) ? "connection timeout"
      : /ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(text) ? "cannot reach the database server"
      : /terminat|reset|closed|ECONNRESET/i.test(text) ? "connection dropped"
      : /ssl|certificate/i.test(text) ? "ssl problem"
      : "other";
    return NextResponse.json(
      { service: "database", status: "unavailable", reason, code, detail: text.replace(/postgres(ql)?:\/\/\S+/gi, "[address hidden]").slice(0, 160) },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
