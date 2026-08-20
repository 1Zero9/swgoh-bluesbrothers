"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MemberContext } from "@/lib/member-context";

function formatPower(value: bigint) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return { value: "0", unit: "" };
  if (num >= 1_000_000_000) return { value: (num / 1_000_000_000).toFixed(2), unit: "B" };
  if (num >= 1_000_000) return { value: (num / 1_000_000).toFixed(1), unit: "M" };
  if (num >= 1_000) return { value: (num / 1_000).toFixed(1), unit: "K" };
  return { value: num.toLocaleString("en-GB"), unit: "" };
}

export default function AccountLink({ context }: { context: MemberContext }) {
  const router = useRouter();
  const [allyCode, setAllyCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmitAllyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/members/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allyCode }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not link that ally code");
      setAllyCode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link that ally code");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await fetch("/api/members/link", { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (context.status === "linked") {
    const power = formatPower(context.player.galacticPower);
    return (
      <div className="account-card account-linked">
        <div className="account-card-head">
          <span className="account-avatar" aria-hidden="true">{context.player.name.charAt(0).toUpperCase()}</span>
          <div>
            <p className="account-hint">Welcome back to the cantina</p>
            <strong>{context.player.name}</strong>
          </div>
          <button type="button" className="account-signout" onClick={handleSignOut} disabled={busy}>Sign out</button>
        </div>
        <div className="account-stats">
          <div><span>Galactic power</span><strong>{power.value}{power.unit}</strong></div>
          <div><span>Raid tickets</span><strong>{context.player.raidTickets.toLocaleString("en-GB")}</strong></div>
        </div>
        {context.player.onWallOfShame ? (
          <div className="account-shame-warning">
            <p>You&apos;re on the Wall of Shame:</p>
            <ul>{context.player.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </div>
        ) : (
          <p className="account-good">Clean record. Keep it that way, hotshot.</p>
        )}
      </div>
    );
  }

  if (context.status === "linking") {
    return (
      <form className="account-card account-linking" onSubmit={handleSubmitAllyCode}>
        <p className="account-hint">Signed in as <strong>{context.discordUsername}</strong> on Discord.</p>
        <p className="account-hint">Enter your ally code to finish linking your account.</p>
        <input
          type="text"
          inputMode="numeric"
          placeholder="123-456-789"
          value={allyCode}
          onChange={(event) => setAllyCode(event.target.value)}
          maxLength={11}
          required
        />
        {error && <p className="account-error">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Checking…" : "Link my account"}</button>
      </form>
    );
  }

  return (
    <div className="account-card account-signed-out">
      <p className="account-hint">Link your Discord to see your stats and keep off the Wall of Shame.</p>
      <a className="account-link-button" href="/api/auth/discord">Link with Discord</a>
    </div>
  );
}
