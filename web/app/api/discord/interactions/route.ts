import { after } from "next/server";
import { EPHEMERAL, InteractionType, ResponseType } from "@/lib/discord-commands";
import { discordPublicKey, verifyDiscordSignature } from "@/lib/discord-signature";
import { searchUnits } from "@/lib/who-has";
import { answerWhoHas, editOriginalResponse, type CommandOption } from "@/lib/whohas-command";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

type Interaction = {
  type: number;
  token?: string;
  application_id?: string;
  member?: { user?: { id?: string } };
  user?: { id?: string };
  data?: { name?: string; options?: CommandOption[] };
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
    const discordId = interaction.member?.user?.id ?? interaction.user?.id;
    const applicationId = interaction.application_id ?? process.env.DISCORD_CLIENT_ID;
    const token = interaction.token;
    if (!applicationId || !token) return reply("Something is missing from that request. Try again.");

    // Discord gives us 3 seconds to answer. Reading every roster can take longer on a cold start, so we
    // reply "thinking..." (private to the asker) straight away and fill in the answer when it is ready.
    after(async () => {
      let content: string;
      try {
        content = await answerWhoHas(discordId, options);
      } catch (error) {
        console.error("whohas failed", error);
        content = "Something went wrong looking that up. Try again in a moment.";
      }
      try {
        await editOriginalResponse(applicationId, token, content);
      } catch (error) {
        console.error("whohas follow-up failed", error);
      }
    });
    return Response.json({ type: ResponseType.Deferred, data: { flags: EPHEMERAL } });
  }

  return reply("I don't know that command.");
}
