"use client";

import { useCallback, useEffect, useState } from "react";
import { detectInstallPlatform } from "@/lib/install-platform";

type Status = "checking" | "unsupported" | "needs-install" | "unavailable" | "denied" | "off" | "on";
type Topics = { chat: boolean; droid: boolean };

function urlBase64ToUint8Array(base64: string) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  return registration ? registration.pushManager.getSubscription() : null;
}

export default function PushSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [topics, setTopics] = useState<Topics>({ chat: true, droid: true });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const platform = detectInstallPlatform(navigator.userAgent, navigator.maxTouchPoints);
    // iPhones only offer notifications to an installed app.
    if (platform === "ios" && !isInstalled()) return setStatus("needs-install");
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setStatus("unsupported");

    const subscription = await currentSubscription().catch(() => null);
    const query = subscription ? `?endpoint=${encodeURIComponent(subscription.endpoint)}` : "";
    const response = await fetch(`/api/push/subscribe${query}`, { cache: "no-store" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { configured?: boolean; subscribed?: boolean; topics?: string[] } | null;
    if (!data?.configured) return setStatus("unavailable");
    if (Notification.permission === "denied") return setStatus("denied");
    if (subscription && data.subscribed) {
      setTopics({ chat: Boolean(data.topics?.includes("chat")), droid: Boolean(data.topics?.includes("droid")) });
      return setStatus("on");
    }
    setStatus("off");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const keyResponse = await fetch("/api/push/subscribe", { cache: "no-store" });
      const key = (await keyResponse.json()) as { publicKey?: string | null };
      if (!key.publicKey) throw new Error("Notifications aren't switched on for the site yet.");

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription = (await registration.pushManager.getSubscription())
        ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key.publicKey) }));

      const save = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON(), topics: ["chat", "droid"] }),
      });
      if (!save.ok) throw new Error(((await save.json().catch(() => null)) as { error?: string } | null)?.error ?? "Couldn't save that.");
      setTopics({ chat: true, droid: true });
      setStatus("on");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't turn notifications on.");
    } finally {
      setBusy(false);
    }
  }

  async function changeTopic(topic: keyof Topics, value: boolean) {
    const next = { ...topics, [topic]: value };
    setTopics(next);
    const subscription = await currentSubscription().catch(() => null);
    if (!subscription) return;
    await fetch("/api/push/subscribe", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint, topics: (Object.keys(next) as (keyof Topics)[]).filter((key) => next[key]) }),
    }).catch(() => undefined);
  }

  async function disable() {
    setBusy(true);
    try {
      const subscription = await currentSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setStatus("off");
      setMessage(null);
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/push/test", { method: "POST" }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setMessage(data?.ok ? "Sent. It should arrive in a few seconds." : data?.error ?? "Couldn't send a test.");
    setBusy(false);
  }

  return (
    <div className="push-card" id="notifications">
      {status === "checking" ? <p>Checking…</p> : null}
      {status === "unsupported" ? <p>This browser can&apos;t show notifications. Try Chrome on Android, or the installed app on iPhone.</p> : null}
      {status === "needs-install" ? <p>On iPhone, notifications work in the installed app. Add the site to your home screen first (menu → Add to home screen), open it from there, and come back to this page.</p> : null}
      {status === "unavailable" ? <p>Notifications aren&apos;t switched on for the site yet. An officer needs to finish setting them up.</p> : null}
      {status === "denied" ? <p>Notifications are blocked for this site. Allow them in your browser or phone settings, then reload this page.</p> : null}

      {status === "off" ? (
        <>
          <p>Get a buzz for Territory War results, milestones, the weekly question and chat messages sent from the site.</p>
          <button type="button" onClick={enable} disabled={busy}>{busy ? "Turning on…" : "Turn on notifications"}</button>
        </>
      ) : null}

      {status === "on" ? (
        <>
          <p className="push-on">Notifications are on for this device.</p>
          <label><input type="checkbox" checked={topics.droid} onChange={(event) => void changeTopic("droid", event.target.checked)} /> The Droid&apos;s posts: war results, milestones, the weekly question, news</label>
          <label><input type="checkbox" checked={topics.chat} onChange={(event) => void changeTopic("chat", event.target.checked)} /> Chat messages sent from the site</label>
          <div className="push-actions">
            <button type="button" onClick={sendTest} disabled={busy}>Send me a test</button>
            <button type="button" onClick={disable} disabled={busy}>Turn off</button>
          </div>
        </>
      ) : null}

      {message ? <p className="push-message">{message}</p> : null}
    </div>
  );
}
