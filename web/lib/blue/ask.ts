import { generateText, isStepCount } from "ai";
import { BLUE_INSTRUCTIONS } from "@/lib/blue/prompt";
import type { ChatTurn } from "@/lib/blue/limits";
import { buildBlueTools, type BlueViewer } from "@/lib/blue/tools";

/** Cheap and quick is right for lookups; change it with BLUE_MODEL (an AI Gateway "provider/model" id). */
const DEFAULT_MODEL = "anthropic/claude-haiku-5-5";

/** B-LU3's AI chat is off until BLUE_AI=on is set on the server, so nothing is billed by accident. */
export function blueEnabled() {
  return process.env.BLUE_AI === "on";
}

export async function askBlue(viewer: BlueViewer, conversation: ChatTurn[]): Promise<string> {
  const result = await generateText({
    model: process.env.BLUE_MODEL?.trim() || DEFAULT_MODEL,
    instructions: BLUE_INSTRUCTIONS,
    messages: conversation,
    tools: buildBlueTools(viewer),
    stopWhen: isStepCount(6),
    maxOutputTokens: 700,
    timeout: 45_000,
  });
  return result.text.trim() || "I came up empty on that one. Try asking it another way.";
}
