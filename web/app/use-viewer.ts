"use client";

import { useEffect, useState } from "react";

export type Viewer = { signedIn: boolean; role: "OFFICER" | "MEMBER" | "PUBLIC"; name: string | null; /** Officers only: counters and tips waiting for a check. */ reviewCount?: number; /** The site admin only. */ isAdmin?: boolean; needsDiscord?: boolean; version?: string; build?: string };

/** Who is looking, fetched from /api/members/me so cached pages still show the right menu. null while loading. */
export function useViewer(refreshKey?: string) {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/members/me")
      .then((response) => response.json())
      .then((data: Viewer) => { if (!cancelled) setViewer(data); })
      .catch(() => { if (!cancelled) setViewer(null); });
    return () => { cancelled = true; };
  }, [refreshKey]);
  return viewer;
}
