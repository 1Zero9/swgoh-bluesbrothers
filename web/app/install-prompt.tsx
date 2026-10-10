"use client";

import { useEffect, useRef, useState } from "react";
import { detectInstallPlatform, type InstallPlatform } from "@/lib/install-platform";

const STORAGE_KEY = "bb-install-prompt";
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
export const OPEN_INSTALL_EVENT = "bb-open-install";

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function readStore(): string | null {
  try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
function writeStore(value: string) {
  try { window.localStorage.setItem(STORAGE_KEY, value); } catch { /* storage unavailable: just ask again next time */ }
}

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function currentPlatform(): InstallPlatform {
  return detectInstallPlatform(window.navigator.userAgent, window.navigator.maxTouchPoints);
}

function ShareIcon() {
  return (
    <svg className="install-share-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><path d="M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

/**
 * "Add to home screen" help for phones. Shows once (after a short pause) to visitors on a phone who
 * haven't installed the app, can be snoozed or silenced, and can be reopened from the mobile menu.
 */
export default function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("android");
  const [showOther, setShowOther] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferred = useRef<DeferredPrompt | null>(null);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferred.current = event as DeferredPrompt;
      setCanInstall(true);
    };
    const onManualOpen = () => {
      const detected = currentPlatform();
      setPlatform(detected === "desktop" ? "android" : detected);
      setShowOther(false);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener(OPEN_INSTALL_EVENT, onManualOpen);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const detected = currentPlatform();
    const stored = readStore();
    const snoozed = stored === "never" || (stored !== null && Date.now() - Number(stored) < SNOOZE_MS);
    if (detected !== "desktop" && !isInstalled() && !snoozed) {
      timer = setTimeout(() => {
        setPlatform(detected);
        setOpen(true);
      }, 6000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener(OPEN_INSTALL_EVENT, onManualOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function snooze() {
    writeStore(String(Date.now()));
    setOpen(false);
  }

  function never() {
    writeStore("never");
    setOpen(false);
  }

  async function installNow() {
    const prompt = deferred.current;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice.catch(() => undefined);
    deferred.current = null;
    setCanInstall(false);
    setOpen(false);
  }

  if (!open) return null;

  const iosSteps = (
    <ol>
      <li>Tap the <strong>Share</strong> button <ShareIcon /> in Safari&apos;s toolbar (top right on an iPad).</li>
      <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
      <li>Tap <strong>Add</strong>. The Blues Brothers icon appears on your home screen.</li>
    </ol>
  );
  const androidSteps = canInstall ? (
    <div>
      <button type="button" className="install-primary" onClick={installNow}>Install the app</button>
      <p>One tap, then confirm. It lands on your home screen.</p>
    </div>
  ) : (
    <ol>
      <li>Tap the <strong>⋮</strong> menu at the top right of Chrome.</li>
      <li>Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</li>
      <li>Tap <strong>Install</strong>. The Blues Brothers icon appears on your home screen.</li>
    </ol>
  );

  const first = platform === "ios" ? { label: "iPhone & iPad", steps: iosSteps } : { label: "Android", steps: androidSteps };
  const other = platform === "ios" ? { label: "Android", steps: androidSteps } : { label: "iPhone & iPad", steps: iosSteps };

  return (
    <div className="install-sheet" role="dialog" aria-label="Add the Blues Brothers site to your home screen">
      <button type="button" className="install-close" aria-label="Close" onClick={snooze}>×</button>
      <h2>Keep the guild in your pocket</h2>
      <p className="install-lead">Add this site to your home screen. It opens full screen like an app, with no browser bars, one tap away.</p>

      <section>
        <h3>{first.label}</h3>
        {first.steps}
      </section>

      <button type="button" className="install-toggle" aria-expanded={showOther} onClick={() => setShowOther(!showOther)}>
        {showOther ? "Hide" : "Different phone?"} {showOther ? "▴" : "▾"}
      </button>
      {showOther ? (
        <section>
          <h3>{other.label}</h3>
          {other.steps}
        </section>
      ) : null}

      <div className="install-actions">
        <button type="button" onClick={snooze}>Not now</button>
        <button type="button" onClick={never}>Don&apos;t show again</button>
      </div>
    </div>
  );
}
