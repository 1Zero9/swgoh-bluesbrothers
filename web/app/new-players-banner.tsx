"use client";

import { useEffect, useState } from "react";
import { PartyPopper, X } from "lucide-react";

/** How long the welcome shows before it quietly folds away. */
const SHOW_MS = 25000;

/** A bold welcome for the newest members. It times out, or you can close it. */
export default function NewPlayersBanner({ names }: { names: string[] }) {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fade = window.setTimeout(() => setLeaving(true), SHOW_MS);
    const remove = window.setTimeout(() => setGone(true), SHOW_MS + 600);
    return () => { window.clearTimeout(fade); window.clearTimeout(remove); };
  }, []);

  if (gone || !names.length) return null;
  return (
    <div className={`hub-newbar${leaving ? " is-leaving" : ""}`} role="status">
      <PartyPopper size={22} aria-hidden="true" />
      <p>
        <small>New to the band</small>
        <span>Welcome {names.map((name, index) => <span key={name}>{index ? (index === names.length - 1 ? " and " : ", ") : ""}<strong>{name}</strong></span>)} to the Blues Brothers!</span>
      </p>
      <button type="button" onClick={() => setLeaving(true)} aria-label="Close welcome"><X size={16} aria-hidden="true" /></button>
    </div>
  );
}
