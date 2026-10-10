"use client";

import { useState } from "react";

type Result = {
  name: string;
  galacticPower: number;
  galacticLegends: number;
  meets: boolean;
  checks: { label: string; have: string; need: string; ok: boolean }[];
};

export default function CheckStats() {
  const [allyCode, setAllyCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/public/check-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allyCode }),
      });
      const data = (await response.json().catch(() => null)) as (Result & { ok?: boolean; error?: string }) | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Couldn't check that ally code.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check that ally code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="check-stats">
      <form onSubmit={submit}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Your ally code, e.g. 123-456-789"
          value={allyCode}
          onChange={(event) => setAllyCode(event.target.value)}
          maxLength={11}
          aria-label="Ally code"
          required
        />
        <button type="submit" disabled={busy}>{busy ? "Checking…" : "Check my stats"}</button>
      </form>
      {busy ? <p className="check-note">Looking you up in the galaxy — this can take up to 15 seconds.</p> : null}
      {error ? <p className="check-error">{error}</p> : null}
      {result ? (
        <div className={`check-result${result.meets ? " is-good" : ""}`}>
          <h3>{result.name}</h3>
          <ul>
            {result.checks.map((check) => (
              <li key={check.label} className={check.ok ? "ok" : "short"}>
                <span aria-hidden="true">{check.ok ? "✓" : "✗"}</span>
                <strong>{check.label}</strong>
                <em>{check.have} <small>(we ask {check.need})</small></em>
              </li>
            ))}
          </ul>
          <p>{result.meets
            ? "You meet the entry bar. Come and say hello in our Discord."
            : "Not quite there yet — but we'd still like to hear from you. Ask in our Discord."}</p>
        </div>
      ) : null}
    </div>
  );
}
