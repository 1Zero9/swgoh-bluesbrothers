import { MODE_LABELS, type KbMode } from "@/lib/knowledge/modes";

type Member = { unitId: string; role: string; alternatives?: string[] };

/** A squad as a row of unit chips, leader first. `names` maps unit ids to display names. */
export function SquadChips({ members, names }: { members: Member[]; names: Record<string, string> }) {
  return (
    <span className="kb-squad">
      {members.map((member) => (
        <span key={member.unitId} className={`kb-chip kb-chip-${member.role.toLowerCase()}`} title={member.role === "OPTIONAL" && member.alternatives?.length ? `Or: ${member.alternatives.map((id) => names[id] ?? id).join(", ")}` : undefined}>
          {names[member.unitId] ?? member.unitId}
          {member.role === "OPTIONAL" ? <i> optional</i> : null}
        </span>
      ))}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: string }) {
  return <span className="kb-badge kb-badge-mode">{MODE_LABELS[mode as KbMode] ?? mode}</span>;
}
