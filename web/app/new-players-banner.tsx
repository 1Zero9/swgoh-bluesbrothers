"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, PartyPopper, X } from "lucide-react";

export type Newcomer = { id: string; name: string; when: string; power: string | null };

const TINTS = ["#67c7f5", "#ffd166", "#7ee2a8", "#f4a3c4", "#b9a6ff"];

function tint(name: string) {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return TINTS[sum % TINTS.length];
}

/** A warm welcome for the newest members, with a nudge to say hello. It stays until you close it. */
export default function NewPlayersBanner({ members }: { members: Newcomer[] }) {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  function close() {
    setLeaving(true);
    window.setTimeout(() => setGone(true), 600);
  }

  if (gone || !members.length) return null;
  return (
    <section
      className={`hub-newbar${leaving ? " is-leaving" : ""}`}
      aria-label="New members"
    >
      <div className="hub-newbar-head">
        <PartyPopper size={22} aria-hidden="true" />
        <div>
          <small>New to the band</small>
          <h2>Welcome to the Blues Brothers!</h2>
        </div>
        <Link className="hub-newbar-hello" href="/chat"><MessageCircle size={15} aria-hidden="true" /> Say hello</Link>
        <button type="button" className="hub-newbar-close" onClick={close} aria-label="Close welcome"><X size={16} aria-hidden="true" /></button>
      </div>
      <ul className="hub-newbar-people">
        {members.map((member) => (
          <li key={member.id}>
            <span className="hub-newbar-avatar" style={{ borderColor: tint(member.name), color: tint(member.name) }} aria-hidden="true">{member.name.slice(0, 2).toUpperCase()}</span>
            <span><strong>{member.name}</strong><small>Joined {member.when}{member.power ? ` · ${member.power} GP` : ""}</small></span>
          </li>
        ))}
      </ul>
    </section>
  );
}
