import { google } from "@ai-sdk/google";
import { generateText, isStepCount } from "ai";
import { BLUE_INSTRUCTIONS } from "@/lib/blue/prompt";
import type { ChatTurn } from "@/lib/blue/limits";
import { buildBlueTools, type BlueViewer } from "@/lib/blue/tools";

/** Cheap and quick is right for lookups. Change either with BLUE_MODEL. */
const DEFAULT_GEMINI = "gemini-flash-latest";
const DEFAULT_GATEWAY_MODEL = "anthropic/claude-haiku-5-5";

/** A Google key (GOOGLE_GENERATIVE_AI_API_KEY) is used directly; otherwise the Vercel AI Gateway, which wants a "provider/model" id. */
function blueModel() {
  const chosen = process.env.BLUE_MODEL?.trim();
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(chosen || DEFAULT_GEMINI) : chosen || DEFAULT_GATEWAY_MODEL;
}

/** B-LU3's AI chat is off until BLUE_AI=on is set on the server, so nothing is billed by accident. */
export function blueEnabled() {
  return process.env.BLUE_AI === "on";
}

export async function askBlue(viewer: BlueViewer, conversation: ChatTurn[]): Promise<string> {
  const result = await generateText({
    model: blueModel(),
    instructions: BLUE_INSTRUCTIONS,
    messages: conversation,
    tools: buildBlueTools(viewer),
    stopWhen: isStepCount(6),
    maxOutputTokens: 700,
    timeout: 45_000,
  });
  return result.text.trim() || "I came up empty on that one. Try asking it another way.";
}
