"use client";

import Link from "next/link";
import { useState } from "react";
import type { MemberListing } from "@/lib/player-card";

const power = (value: string) => { const n = Number(value); return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n.toLocaleString("en-GB"); };

export default function MemberPicker({ members }: { members: MemberListing[] }) {
  const [text, setText] = useState("");
  const shown = members.filter((member) => member.name.toLowerCase().includes(text.trim().toLowerCase()));
  return (
    <div className="hub-knowledge">
      <div className="kb-toolbar mc-bar"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Search members" aria-label="Search members" /></div>
      {shown.length === 0 ? <div className="kb-empty"><strong>No members found.</strong></div> : (
        <ul className="mc-pick">
          {shown.map((member) => (
            <li key={member.playerId}><Link href={`/officer/member/${member.playerId}`}>
              <strong>{member.name}</strong><small>{member.role ? `${member.role.toLowerCase()} · ` : ""}{power(member.galacticPower)} GP</small>
              {member.flags ? <i title={`${member.flags} things to look at`}>{member.flags}</i> : null}
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
