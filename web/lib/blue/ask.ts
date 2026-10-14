import { google } from "@ai-sdk/google";
import { generateText, isStepCount } from "ai";
import { instructionsFor } from "@/lib/blue/prompt";
import { safeErrorDetail, type ChatTurn } from "@/lib/blue/limits";
import { cleanSources, type AnswerSource } from "@/lib/blue/sources";
import { buildBlueTools, type BlueViewer } from "@/lib/blue/tools";

/** Cheap and quick is right for lookups. Change either with BLUE_MODEL. */
const MAX_STEPS = 8;
const DEFAULT_GEMINI = "gemini-flash-latest";
const DEFAULT_GATEWAY_MODEL = "anthropic/claude-haiku-5-5";

/** A Google key (GOOGLE_GENERATIVE_AI_API_KEY) is used directly; otherwise the Vercel AI Gateway, which wants a "provider/model" id. */
export function blueModel() {
  const chosen = process.env.BLUE_MODEL?.trim();
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(chosen || DEFAULT_GEMINI) : chosen || DEFAULT_GATEWAY_MODEL;
}

/** Reads the BLUE_AI switch forgivingly: any case, stray spaces or line breaks from pasting, and on/true/yes/1 all count as on. */
export function isSwitchOn(value: string | undefined) {
  return ["on", "true", "yes", "1"].includes((value ?? "").replace(/[\s"'\u00a0\u200b\ufeff]/g, "").toLowerCase());
}

/** B-Lue3's AI chat is off until BLUE_AI is switched on at the server, so nothing is billed by accident. */
export function blueEnabled() {
  return isSwitchOn(process.env.BLUE_AI);
}

/** With a Google key, B-Lue3 may search the web for current counters. BLUE_WEB_SEARCH=off turns that off. */
export function webSearchOn() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) && process.env.BLUE_WEB_SEARCH !== "off";
}

/** "used": the web search tool was on for this answer. "unavailable": it was meant to be on but failed, so he answered without it. "off": not configured. */
export type WebSearchState = "used" | "unavailable" | "off";
export type BlueAnswer = { text: string; sources: AnswerSource[]; webSearch: WebSearchState; searchError?: string };

async function run(viewer: BlueViewer, conversation: ChatTurn[], withSearch: boolean): Promise<BlueAnswer> {
  const result = await generateText({
    model: blueModel(),
    instructions: instructionsFor(withSearch),
    messages: conversation,
    tools: { ...buildBlueTools(viewer), ...(withSearch ? { google_search: google.tools.googleSearch({}) } : {}) },
    stopWhen: isStepCount(MAX_STEPS),
    // On the last step he must write the answer, not call another tool (an unfinished tool loop used to end with no text at all).
    prepareStep: ({ stepNumber }) => (stepNumber >= MAX_STEPS - 1 ? { toolChoice: "none" as const } : undefined),
    maxOutputTokens: 900,
    timeout: withSearch ? 30_000 : 40_000,
  });
  const sources = cleanSources(result.steps.flatMap((step) => step.sources));
  if (!result.text.trim() && withSearch) {
    // An empty answer from the search run is a failed run: fall back, and keep the reason for officers.
    const tools = [...new Set(result.steps.flatMap((step) => step.toolCalls.map((call) => call?.toolName ?? "?")))].join(", ") || "none";
    throw new Error(`empty answer (finish=${result.finishReason}, steps=${result.steps.length}, tools=${tools})`);
  }
  return { text: result.text.trim() || "I came up empty on that one. Try asking it another way.", sources, webSearch: withSearch ? "used" : "off" };
}

export async function askBlue(viewer: BlueViewer, conversation: ChatTurn[]): Promise<BlueAnswer> {
  if (!webSearchOn()) return run(viewer, conversation, false);
  try {
    return await run(viewer, conversation, true);
  } catch (error) {
    // Some models can't mix web search with the roster tools, and Google can be overloaded. Don't fail the member's question: answer without it, and say so.
    const searchError = safeErrorDetail(error);
    console.error("blue: web search run failed, retrying without it", searchError);
    const answer = await run(viewer, conversation, false);
    return { ...answer, webSearch: "unavailable", searchError };
  }
}
