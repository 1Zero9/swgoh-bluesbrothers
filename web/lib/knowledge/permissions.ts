/**
 * Who may do what with the knowledge base. Submitting, reviewing/publishing and importing are three separate powers.
 *  - Members and officers can submit (always as a candidate).
 *  - B-Lue3 can submit candidates on a member's behalf, never publish.
 *  - Only officers review and publish.
 *  - Imports are run from the command line with database access; they stage candidates too unless a trusted source rule fires.
 */
export type Via = "MEMBER" | "BLUE" | "IMPORT" | "OFFICER";

export type Viewer = { isMember: boolean; isOfficer: boolean };

export const canSubmit = (viewer: Viewer) => viewer.isMember || viewer.isOfficer;
export const canReview = (viewer: Viewer) => viewer.isOfficer;

/**
 * Structured sources whose records may skip review. Empty on purpose: a source earns a place here only
 * after its data has been checked, and then only for aggregated battle counts above a minimum sample.
 */
export const TRUSTED_IMPORT_SOURCES: readonly string[] = [];
export const MIN_TRUSTED_BATTLES = 100;

export function mayAutoPublish(
  via: Via,
  provider: string,
  evidence: { type: string; battles: number | null }[],
  trusted: readonly string[] = TRUSTED_IMPORT_SOURCES,
): boolean {
  if (via !== "IMPORT" || !trusted.includes(provider)) return false;
  return evidence.length > 0 && evidence.every((item) => item.type === "AGGREGATED" && item.battles !== null && item.battles >= MIN_TRUSTED_BATTLES);
}
