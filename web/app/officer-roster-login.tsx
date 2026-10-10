"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOfficerPasswordEnabled } from "@/app/use-officer-password";

export default function OfficerRosterLogin() {
  const router = useRouter();
  const passwordEnabled = useOfficerPasswordEnabled();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/officer/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Sign-in failed");
      }
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  if (passwordEnabled !== true) {
    return (
      <div className="officer-form officer-gate">
        <p className="officer-hint">Officers only. In-game officers are let in automatically once they sign in with Discord.</p>
        <a className="btn-discord-gate" href="/api/auth/discord">Sign in with Discord</a>
      </div>
    );
  }

  return (
    <form className="officer-form officer-gate" onSubmit={handleLogin}>
      <p className="officer-hint">Officers only, past the beaded curtain.</p>
      <p className="officer-hint">In-game officers are let in automatically once they <a href="/api/auth/discord?next=/officer/roster">sign in with Discord</a>.</p>
      <input
        type="password"
        placeholder="Officer password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
      />
      {error && <p className="officer-error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? "Checking…" : "Step behind the bar"}</button>
    </form>
  );
}
