"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Me = { signedIn: boolean; role: "OFFICER" | "MEMBER" | "PUBLIC"; name: string | null };

/** Sign in / account control for the site header. Reads who you are from /api/members/me so cached pages stay cached. */
export default function AccountMenu({ variant = "header" }: { variant?: "header" | "drawer" }) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/members/me")
      .then((response) => response.json())
      .then((data: Me) => { if (!cancelled) setMe(data); })
      .catch(() => { if (!cancelled) setMe(null); });
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      // A full reload (not a client navigation) so every page re-renders in its signed-out state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    }
  }

  if (!me) return null;

  if (!me.signedIn) {
    return (
      <a className={`account-menu-signin ${variant}`} href={`/api/auth/discord?next=${encodeURIComponent(pathname)}`}>
        Sign in
      </a>
    );
  }

  const label = me.name ?? "Signed in";
  return (
    <div className={`account-menu ${variant}`} ref={ref}>
      <button type="button" className="account-menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" title={label}>
        <span className="account-menu-avatar" aria-hidden="true">{label.charAt(0).toUpperCase()}</span>
        <span className="account-menu-name">{label}</span>
      </button>
      {open ? (
        <div className="account-menu-panel" role="menu">
          <p><strong>{label}</strong><small>{me.role === "OFFICER" ? "Officer" : "Member"}</small></p>
          <button type="button" role="menuitem" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
        </div>
      ) : null}
    </div>
  );
}
