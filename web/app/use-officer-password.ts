"use client";

import { useEffect, useState } from "react";

/** null while loading; true/false once the server says whether the shared officer password is switched on. */
export function useOfficerPasswordEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/officer/session")
      .then((response) => response.json())
      .then((data: { enabled?: boolean }) => { if (!cancelled) setEnabled(Boolean(data.enabled)); })
      .catch(() => { if (!cancelled) setEnabled(true); });
    return () => { cancelled = true; };
  }, []);
  return enabled;
}
