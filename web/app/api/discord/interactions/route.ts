import { EPHEMERAL, InteractionType, ResponseType } from "@/lib/discord-commands";
import { discordPublicKey, verifyDiscordSignature } from "@/lib/discord-signature";
import { findActiveMemberByDiscordId } from "@/lib/member-lookup";
import { siteUrl } from "@/lib/site-url";
import { formatHolders, searchUnits, whoHas } from "@/lib/who-has";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

type Option = { name: string; value?: string | number; focused?: boolean };
type Interaction = {
  type: number;
  member?: { user?: { id?: string } };
  user?: { id?: string };
  data?: { name?: string; options?: Option[] };
};

function reply(content: string) {
  return Response.json({ type: ResponseType.Message, data: { content, flags: EPHEMERAL, allowed_mentions: { parse: [] } } });
}

/** Discord posts slash commands and autocomplete requests here, signed so we can trust them. */
export async function POST(request: Request) {
  const publicKey = discordPublicKey();
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();
  if (!publicKey || !signature || !timestamp || !verifyDiscordSignature(publicKey, signature, timestamp, body)) {
    return new Response("invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(body) as Interaction;

  if (interaction.type === InteractionType.Ping) return Response.json({ type: ResponseType.Pong });

  const options = interaction.data?.options ?? [];

  if (interaction.type === InteractionType.Autocomplete) {
    const focused = options.find((option) => option.focused);
    const choices = searchUnits(String(focused?.value ?? ""), 25).map((unit) => ({ name: unit.name.slice(0, 100), value: unit.id }));
    return Response.json({ type: ResponseType.Autocomplete, data: { choices } });
  }

  if (interaction.type === InteractionType.Command && interaction.data?.name === "whohas") {
    // Only linked, current guild members get an answer, and the answer is private to them.
    const discordId = interaction.member?.user?.id ?? interaction.user?.id;
    const member = discordId ? await findActiveMemberByDiscordId(discordId).catch(() => null) : null;
    if (!member) return reply(`Link your account first and I'll answer: sign in with Discord at ${siteUrl()}.`);

    const unitInput = String(options.find((option) => option.name === "unit")?.value ?? "");
    const minStars = Number(options.find((option) => option.name === "min_stars")?.value ?? 0) || 0;
    const result = await whoHas(unitInput, minStars);
    if (!result.unit) return reply(`I couldn't find a unit called "${unitInput.slice(0, 60)}". Start typing and pick one from the list.`);
    return reply(formatHolders(result.unit, result.holders, minStars, result.totalMembers));
  }

  return reply("I don't know that command.");
}
