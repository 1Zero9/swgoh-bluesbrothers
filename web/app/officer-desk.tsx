"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OfficerDesk({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  async function handleSignOut() {
    setBusy(true);
    try {
      await fetch("/api/officer/session", { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handlePost(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/officer/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, author }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not post the notice");
      setTitle("");
      setBody("");
      setNotice(payload?.discordPosted ? "Posted to the Guild Wire and Discord." : "Posted to the Guild Wire.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the notice");
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return (
      <form className="officer-form" onSubmit={handleLogin}>
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

  return (
    <form className="officer-form" onSubmit={handlePost}>
      <div className="officer-form-head">
        <p className="officer-hint">Signed in. Post word to the whole cantina.</p>
        <button type="button" className="officer-signout" onClick={handleSignOut} disabled={busy}>Sign out</button>
      </div>
      <input
        type="text"
        placeholder="Headline (e.g. Raid closes Friday 20:00 UTC)"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={120}
        required
      />
      <textarea
        placeholder="What does the band need to know?"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={2000}
        rows={3}
        required
      />
      <input
        type="text"
        placeholder="Signed (optional, e.g. Jake)"
        value={author}
        onChange={(event) => setAuthor(event.target.value)}
        maxLength={60}
      />
      {error && <p className="officer-error">{error}</p>}
      {notice && <p className="officer-notice">{notice}</p>}
      <button type="submit" disabled={busy}>{busy ? "Posting…" : "Pin it to the Guild Wire"}</button>
    </form>
  );
}
