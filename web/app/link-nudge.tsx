"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Invites unlinked visitors to link their account; renders nothing for linked members. */
export default function LinkNudge({ reason }: { reason: string }) {
  const [linked, setLinked] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/members/me")
      .then((response) => response.json())
      .then((data: { linked?: boolean }) => { if (!cancelled) setLinked(Boolean(data.linked)); })
      .catch(() => { if (!cancelled) setLinked(null); });
    return () => { cancelled = true; };
  }, []);

  if (linked !== false) return null;

  return (
    <aside className="link-nudge">
      <div>
        <strong>Are you a Blues Brother?</strong>
        <p>{reason}</p>
      </div>
      <a href={`/api/auth/discord?next=${encodeURIComponent(pathname)}`}>Sign in with Discord →</a>
    </aside>
  );
}
