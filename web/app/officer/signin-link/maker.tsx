"use client";

import { useMemo, useState } from "react";

export default function SignInLinkMaker({ members }: { members: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [made, setMade] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shown = useMemo(() => members.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12), [members, query]);

  async function make(id: string) {
    setBusy(id); setError(null); setMade(null); setCopied(false);
    const response = await fetch("/api/officer/signin-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: id }) }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; name?: string; url?: string; error?: string } | null;
    setBusy(null);
    if (data?.ok && data.url && data.name) setMade({ name: data.name, url: data.url });
    else setError(data?.error ?? "That did not work. Try again.");
  }

  const message = made ? `Hi ${made.name}, here is your own sign-in link for the Blues Brothers site. Tap it once, then tap "Sign me in". It works one time and lasts two days:\n${made.url}` : "";
  async function copy() {
    try { await navigator.clipboard.writeText(message); setCopied(true); } catch { /* the text is shown to copy by hand */ }
  }

  return (
    <div className="help-steps">
      <section className="help-box">
        <label>Find the member
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Start typing their name" autoComplete="off" style={{ width: "100%", padding: "12px", marginTop: 6, borderRadius: 10, border: "1px solid var(--glass-line)", background: "var(--glass)", color: "var(--hub-text)", font: "inherit" }} />
        </label>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {shown.map((m) => (
            <li key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <span>{m.name}</span>
              <button type="button" className="kb-secondary" disabled={busy !== null} onClick={() => void make(m.id)}>{busy === m.id ? "Making…" : "Make a link"}</button>
            </li>
          ))}
        </ul>
        {error ? <p role="alert">{error}</p> : null}
      </section>
      {made ? (
        <section className="help-box" aria-live="polite">
          <h2>Link for {made.name}</h2>
          <p>Send this to them privately (a Discord message to them, not a public channel). Anyone who opens it first gets in as them, so don&apos;t post it anywhere else. It is shown only now.</p>
          <textarea readOnly value={message} rows={5} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--glass-line)", background: "var(--glass)", color: "var(--hub-text)", font: "inherit" }} onFocus={(event) => event.currentTarget.select()} />
          <p><button type="button" className="kb-primary" onClick={() => void copy()}>{copied ? "Copied" : "Copy the message"}</button></p>
        </section>
      ) : null}
    </div>
  );
}
