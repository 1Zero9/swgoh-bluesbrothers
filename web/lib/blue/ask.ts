import { google } from "@ai-sdk/google";
import { generateText, isStepCount } from "ai";
import { BLUE_INSTRUCTIONS } from "@/lib/blue/prompt";
import type { ChatTurn } from "@/lib/blue/limits";
import { cleanSources, type AnswerSource } from "@/lib/blue/sources";
import { buildBlueTools, type BlueViewer } from "@/lib/blue/tools";

/** Cheap and quick is right for lookups. Change either with BLUE_MODEL. */
const DEFAULT_GEMINI = "gemini-flash-latest";
const DEFAULT_GATEWAY_MODEL = "anthropic/claude-haiku-5-5";

/** A Google key (GOOGLE_GENERATIVE_AI_API_KEY) is used directly; otherwise the Vercel AI Gateway, which wants a "provider/model" id. */
function blueModel() {
  const chosen = process.env.BLUE_MODEL?.trim();
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(chosen || DEFAULT_GEMINI) : chosen || DEFAULT_GATEWAY_MODEL;
}

/** B-Lue3's AI chat is off until BLUE_AI=on is set on the server, so nothing is billed by accident. */
export function blueEnabled() {
  return process.env.BLUE_AI === "on";
}

/** With a Google key, B-Lue3 may search the web for current counters. BLUE_WEB_SEARCH=off turns that off. */
function webSearchOn() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) && process.env.BLUE_WEB_SEARCH !== "off";
}

export type BlueAnswer = { text: string; sources: AnswerSource[] };

async function run(viewer: BlueViewer, conversation: ChatTurn[], withSearch: boolean): Promise<BlueAnswer> {
  const result = await generateText({
    model: blueModel(),
    instructions: BLUE_INSTRUCTIONS,
    messages: conversation,
    tools: { ...buildBlueTools(viewer), ...(withSearch ? { google_search: google.tools.googleSearch({}) } : {}) },
    stopWhen: isStepCount(6),
    maxOutputTokens: 900,
    timeout: 45_000,
  });
  const sources = cleanSources(result.steps.flatMap((step) => step.sources));
  return { text: result.text.trim() || "I came up empty on that one. Try asking it another way.", sources };
}

export async function askBlue(viewer: BlueViewer, conversation: ChatTurn[]): Promise<BlueAnswer> {
  if (!webSearchOn()) return run(viewer, conversation, false);
  try {
    return await run(viewer, conversation, true);
  } catch (error) {
    // Some models can't mix web search with the roster tools. Don't fail the member's question: answer without it.
    console.error("blue: web search run failed, retrying without it", error instanceof Error ? error.message : "unknown error");
    return run(viewer, conversation, false);
  }
}
