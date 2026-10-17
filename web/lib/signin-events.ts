import { deviceFrom } from "@/lib/visits";

/** The steps of a sign-in attempt we count. "finished" below means success (already linked) or linked (just matched by ally code). */
export const SIGNIN_KINDS = ["start", "success", "pending", "linked", "error", "stall", "cancel", "help"] as const;
export type SignInKind = (typeof SIGNIN_KINDS)[number];
export const CLIENT_KINDS: SignInKind[] = ["stall", "cancel"];

const IN_APP = /Discord|FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|Twitter|LinkedInApp|GSA\//i;

/** Only the kind of browser and device, never who. */
export function clientFrom(userAgent: string | null): { device: "mobile" | "tablet" | "desktop"; browser: string; inApp: boolean } {
  const ua = userAgent ?? "";
  const device = deviceFrom(ua);
  const inApp = IN_APP.test(ua);
  const browser = /Edg(e|A|iOS)?\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  return { device, browser, inApp };
}

export type SignInRow = { kind: string; device: string | null; browser: string | null; inApp: boolean };
export type Segment = { label: string; started: number; finished: number; stalled: number; rate: number | null };
export type SignInSummary = { started: number; finished: number; needsAllyCode: number; errors: number; stalled: number; cancelled: number; helpAsked: number; rate: number | null; segments: Segment[] };

/** Turn raw events into the picture: how many tried, how many got in, and which kinds of device struggle. */
export function summariseSignIns(rows: SignInRow[]): SignInSummary {
  const count = (kinds: string[], list = rows) => list.filter((r) => kinds.includes(r.kind)).length;
  const started = count(["start"]);
  const finished = count(["success", "linked"]);
  const bySeg = new Map<string, SignInRow[]>();
  for (const row of rows) {
    const label = `${row.inApp ? "In-app browser" : row.browser ?? "Unknown"} · ${row.device ?? "unknown"}`;
    bySeg.set(label, [...(bySeg.get(label) ?? []), row]);
  }
  const segments = [...bySeg.entries()].map(([label, list]) => {
    const s = count(["start"], list);
    const f = count(["success", "linked"], list);
    return { label, started: s, finished: f, stalled: count(["stall"], list), rate: s ? Math.min(1, f / s) : null };
  }).filter((seg) => seg.started > 0).sort((a, b) => b.started - a.started);
  return { started, finished, needsAllyCode: count(["pending"]), errors: count(["error"]), stalled: count(["stall"]), cancelled: count(["cancel"]), helpAsked: count(["help"]), rate: started ? Math.min(1, finished / started) : null, segments };
}
