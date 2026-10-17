"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatAllyCode, isCompleteAllyCode } from "@/lib/ally-code";
import { linkProblem, type LinkProblem } from "@/lib/link-help";

/** First sign-in: Discord is done, now match the member to their game account with an ally code. */
export default function LinkWelcome({ discordUsername, discordUrl, preview = false }: { discordUsername: string; discordUrl: string; preview?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<LinkProblem | null>(null);
  const [joinedAs, setJoinedAs] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isCompleteAllyCode(code)) {
      setProblem(linkProblem(400, "That's not nine digits yet."));
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/members/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allyCode: code }) });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; name?: string; error?: string } | null;
      if (response.ok && data?.ok) {
        setJoinedAs(data.name ?? "friend");
        setTimeout(() => router.refresh(), 1400);
      } else setProblem(linkProblem(response.status, data?.error ?? null));
    } catch {
      setProblem(linkProblem(502, "Couldn't reach the site."));
    } finally {
      setBusy(false);
    }
  }

  const step = joinedAs ? 3 : 2;
  return (
    <main className="hub-main hub-welcome-page">
      <div className="hub-wrap hub-onboard">
        <div className="hub-link-brand">
          <Image src="/bb-emblem.webp" alt="" width={56} height={56} priority />
          <div><strong>Blues Brothers</strong><small>Guild hub</small></div>
        </div>

        <ol className="hub-progress" aria-label="Sign-in steps">
          <li className="is-done"><span>1</span>Discord</li>
          <li className={step === 2 ? "is-now" : "is-done"}><span>2</span>Ally code</li>
          <li className={step === 3 ? "is-now" : ""}><span>3</span>You&apos;re in</li>
        </ol>

        {joinedAs ? (
          <section className="hub-card hub-link-card" role="status">
            <p className="hub-eyebrow">Linked</p>
            <h1>Welcome to the band, {joinedAs}.</h1>
            <p className="hub-intro">Taking you to your home page.</p>
          </section>
        ) : (
          <section className="hub-card hub-link-card">
            <p className="hub-eyebrow">Step 2 of 3</p>
            <h1>Now, your ally code</h1>
            <p className="hub-intro">You&apos;re signed in to Discord as <strong>{discordUsername}</strong>. If that is not the Discord account you use for the guild, <a href="/api/auth/discord?consent=1">sign in with a different one</a>. One more thing, once only: tell us which game account is yours so the site can show you your own page.</p>
            <form onSubmit={submit} className="hub-form">
              <label>Your 9-digit ally code
                <input
                  value={code}
                  onChange={(event) => setCode(formatAllyCode(event.target.value))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="123-456-789"
                  maxLength={11}
                  aria-describedby="ally-help"
                  aria-invalid={problem ? true : undefined}
                />
              </label>
              <details id="ally-help" className="hub-help" open>
                <summary>Where do I find it?</summary>
                <p>In the game, tap your player portrait at the top left of the home screen. Your ally code is under your name.</p>
              </details>
              <button type="submit" className="hub-button" disabled={busy || preview}>{busy ? "Checking…" : "Link my account"}</button>
            </form>

            {problem ? (
              <div className="hub-problem" role="alert">
                <strong>{problem.message}</strong>
                <p>{problem.hint}</p>
                {problem.next === "sign-in-again" ? <a className="hub-button" href="/api/auth/discord">Sign in with Discord again</a> : null}
                {problem.next === "ask-officer" ? <a className="hub-button" href={discordUrl} target="_blank" rel="noreferrer">Open the Discord</a> : null}
              </div>
            ) : null}
          </section>
        )}
        <p className="hub-note-line"><a href="/help/sign-in">Need help? Step-by-step guide</a>. We only use your ally code to find your public profile. Not in the guild yet? <Link href="/#join">See how to join</Link>.</p>
      </div>
    </main>
  );
}
