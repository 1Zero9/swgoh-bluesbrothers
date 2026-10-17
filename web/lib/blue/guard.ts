/**
 * The free first line of defence for B-Lue3: obvious misuse is stopped before any AI question is spent.
 * He is for Star Wars: Galaxy of Heroes, this guild and this site, and nothing else. The AI itself is also told to refuse
 * anything off-topic (see prompt.ts); this catches the blatant cases cheaply and reliably.
 */

export const OFF_TOPIC_MARKER = "OFF_TOPIC";

export type GuardResult = { ok: true } | { ok: false; reason: string };

const norm = (text: string) => ` ${text.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim()} `;

const CODE_TERMS = "script|code|coding|program|function|app|website|bot|macro|query|algorithm|regex|class|component|plugin|extension|api|software";
const LANGUAGES = "python|javascript|typescript|java|c\\+\\+|c#|php|ruby|rust|golang|sql|html|css|bash|powershell|react|node|swift|kotlin";
const WRITE_VERBS = "write|create|make|generate|build|code|debug|fix|give me|show me|produce|draft|compose";

const RULES: { reason: string; test: (t: string) => boolean }[] = [
  {
    reason: "asking for code or programming help",
    test: (t) => new RegExp(` (${LANGUAGES}) `).test(t) && !/ (swgoh|datacron|squad|raid|gac|tb|tw) /.test(t)
      || new RegExp(` (${WRITE_VERBS}) (me )?(a |an |the |some |this |my )?(\\w+ )?(${CODE_TERMS}) `).test(t) && !/ ally code /.test(t) && !/ (swgoh|squad|raid|gac|territory|datacron) /.test(t),
  },
  {
    reason: "asking for writing that is not about the game",
    test: (t) => / (write|compose|draft) (me )?(a |an |the |some )?(\w+ )?(poem|essay|story|song|email|letter|joke|speech|cover letter|article|blog|report|resume|cv) /.test(t) && !/ (swgoh|guild|squad|raid|gac|territory|tb|tw|datacron) /.test(t),
  },
  {
    reason: "trying to change B-Lue3's rules",
    test: (t) => / (ignore|disregard|forget|override|bypass) (all |any |your |the |these |previous |prior |above |earlier )*(instructions|rules|prompt|guidelines|restrictions|limits|limit|safeguards|guardrails) /.test(t)
      || / (reveal|show|print|repeat|leak|tell me) (me )?(your |the )?(system |hidden |secret |initial )(prompt|instructions|message) /.test(t)
      || / (jailbreak|dan mode|developer mode|do anything now) /.test(t)
      || / (pretend|act|behave|roleplay) (to be|as|like) (an? )?(unrestricted|unfiltered|different|evil|hacker|developer|admin|chatgpt|gpt|ai) /.test(t)
      || / you are now (an? )?(unrestricted|unfiltered|different|new) /.test(t),
  },
  {
    reason: "a question that is not about the game, the guild or this site",
    test: (t) => / (bitcoin|crypto|stock market|stocks|forex|weather forecast|football score|election|homework|tax return|mortgage|recipe for|medical advice|legal advice|diagnose) /.test(t)
      || / (what is|whats|what s|tell me) (the )?(capital of|weather|time in|news|president|prime minister) /.test(t),
  },
  {
    reason: "trying to get round the limits",
    test: (t) => / (unlimited|infinite) (questions|queries|requests|answers) /.test(t) || / (reset|remove|disable|turn off|get rid of) (my )?(the )?(question )?(limit|limits|cap|quota|allowance) /.test(t),
  },
];

/** Is this question something B-Lue3 may answer? Cheap and instant; does not call the AI. */
export function checkQuestion(question: string): GuardResult {
  const t = norm(question);
  if (t.trim().length < 2) return { ok: false, reason: "an empty question" };
  // One long run of the same character is spam, not a question.
  if (/(.)\1{29,}/.test(question)) return { ok: false, reason: "spam" };
  for (const rule of RULES) if (rule.test(t)) return { ok: false, reason: rule.reason };
  return { ok: true };
}

/** The model is told to answer exactly OFF_TOPIC when a question is outside the game; detect that. */
export function isModelRefusal(answer: string): boolean {
  return answer.trim().toUpperCase().startsWith(OFF_TOPIC_MARKER);
}

export const REFUSAL_MESSAGE = "B-Lue3 only answers questions about Star Wars: Galaxy of Heroes, this guild and this site. That one is outside his job, so it did not use a question. Misuse means the droid gets switched off for you.";
