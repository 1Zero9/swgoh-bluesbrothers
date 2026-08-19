function getRedirectUri() {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) throw new Error("SITE_URL is required for Discord sign-in");
  return `${siteUrl.replace(/\/$/, "")}/api/auth/discord/callback`;
}

export function buildDiscordAuthorizeUrl(state: string) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) throw new Error("DISCORD_CLIENT_ID is not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

type DiscordTokenResponse = {
  access_token?: string;
  error?: string;
};

export async function exchangeDiscordCode(code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Discord OAuth is not configured");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
  });

  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as DiscordTokenResponse | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error || `Discord token exchange failed with HTTP ${response.status}`);
  }

  return payload.access_token;
}

type DiscordUserResponse = {
  id?: string;
  username?: string;
  global_name?: string;
};

export async function fetchDiscordIdentity(accessToken: string) {
  const response = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as DiscordUserResponse | null;
  if (!response.ok || !payload?.id) {
    throw new Error(`Discord identity lookup failed with HTTP ${response.status}`);
  }

  return { id: payload.id, username: payload.global_name || payload.username || "Discord member" };
}
