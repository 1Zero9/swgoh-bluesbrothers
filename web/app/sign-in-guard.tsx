"use client";

import { useEffect, useState } from "react";

/** Phones' in-app browsers (Discord, Facebook, Instagram...) often can't finish a Discord sign-in. */
const IN_APP = /Discord|FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|Twitter|LinkedInApp|GSA\//i;

/**
 * Watches every "Sign in with Discord" link on the site. The first tap shows a full-screen "Opening Discord" panel, so extra taps can't
 * start the sign-in again and break it, and if nothing happens (or the page is inside an app's built-in browser) it says what to do.
 */
export default function SignInGuard() {
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href^='/api/auth/discord']");
      if (!link) return;
      if (busy) { event.preventDefault(); return; }
      setInApp(IN_APP.test(navigator.userAgent));
      setBusy(true);
      setSlow(false);
    };
    // Coming back with the back button restores the old page; start fresh.
    const onShow = (event: PageTransitionEvent) => { if (event.persisted) { setBusy(false); setSlow(false); } };
    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onShow);
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("pageshow", onShow); };
  }, [busy]);

  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(() => setSlow(true), 7000);
    return () => clearTimeout(timer);
  }, [busy]);

  if (!busy) return null;
  const here = typeof window === "undefined" ? "" : `${window.location.origin}/`;
  async function copy() {
    try { await navigator.clipboard.writeText(here); setCopied(true); } catch { /* the link is shown anyway */ }
  }

  return (
    <div className="signin-guard" role="status" aria-live="polite">
      <div className="signin-guard-card">
        <span className="signin-guard-spin" aria-hidden="true" />
        <strong>Opening Discord…</strong>
        <p>One tap is enough. If Discord asks for your email and password, that is Discord&apos;s own sign-in, and it is safe to use.</p>
        {inApp || slow ? (
          <div className="signin-guard-help">
            <p><b>{inApp ? "You are in an app's built-in browser, which often can't finish this." : "Taking a while?"}</b> Open this page in <b>Safari</b> or <b>Chrome</b> and sign in there.</p>
            <button type="button" onClick={() => void copy()}>{copied ? "Link copied" : "Copy the site link"}</button>
            <code>{here}</code>
          </div>
        ) : null}
        <a className="signin-guard-more" href="/help/sign-in">Step-by-step help</a>
        <button type="button" className="signin-guard-cancel" onClick={() => setBusy(false)}>Cancel</button>
      </div>
    </div>
  );
}
