"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OfficerRosterLogin() {
  const router = useRouter();
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

  return (
    <form className="officer-form officer-gate" onSubmit={handleLogin}>
      <p className="officer-hint">Officers only, past the beaded curtain.</p>
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
