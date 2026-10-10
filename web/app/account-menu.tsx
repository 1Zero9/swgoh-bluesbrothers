"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOutEverywhere } from "./sign-out";
import { useViewer } from "./use-viewer";

/** Sign in / account control for the site header. Reads who you are from /api/members/me so cached pages stay cached. */
export default function AccountMenu({ variant = "header" }: { variant?: "header" | "drawer" }) {
  const pathname = usePathname();
  const me = useViewer(pathname);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function signOut() {
    setBusy(true);
    await signOutEverywhere();
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

  // In the mobile drawer the chip is just a link to My page; sign out is a visible button in the drawer footer.
  if (variant === "drawer") {
    return (
      <a className="account-menu-button drawer" href="/me" title="My page">
        <span className="account-menu-avatar" aria-hidden="true">{label.charAt(0).toUpperCase()}</span>
        <span className="account-menu-name">{label}</span>
      </a>
    );
  }

  return (
    <div className={`account-menu ${variant}`} ref={ref}>
      <button type="button" className="account-menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" title={label}>
        <span className="account-menu-avatar" aria-hidden="true">{label.charAt(0).toUpperCase()}</span>
        <span className="account-menu-name">{label}</span>
      </button>
      {open ? (
        <div className="account-menu-panel" role="menu">
          <p><strong>{label}</strong><small>{me.role === "OFFICER" ? "Officer" : "Member"}</small></p>
          <a className="account-menu-link" href="/me" role="menuitem">My page</a>
          <button type="button" role="menuitem" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
        </div>
      ) : null}
    </div>
  );
}
