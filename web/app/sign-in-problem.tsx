import ObiWanHelp from "./obi-wan-help";

/** Shown on the front page when the Discord sign-in came back without finishing (cancelled, timed out, or Discord was unreachable). */
export default function SignInProblem({ discordUrl }: { discordUrl: string }) {
  return (
    <div className="hub-problem" role="alert">
      <strong>The Discord sign-in didn&apos;t finish</strong>
      <p>It may have timed out, or you chose Cancel on Discord. Nothing was changed, so you can simply try again.</p>
      <p>
        <a className="hub-button" href="/api/auth/discord">Sign in with Discord again</a>
      </p>
      <p><a href="/help/sign-in">Step-by-step help with signing in</a></p>
      <p><ObiWanHelp /></p>
      <p>Still stuck? <a href={discordUrl} target="_blank" rel="noreferrer">Say hello in the Discord</a> and an officer will sort it out.</p>
    </div>
  );
}
