/** What to tell a member when linking their ally code does not work, and what they can do next. */

export type LinkNextStep = "retry" | "sign-in-again" | "ask-officer";

export type LinkProblem = { message: string; next: LinkNextStep; hint: string };

/** Turns the link route's answer into a message and one clear next step. `serverMessage` is shown as given. */
export function linkProblem(status: number, serverMessage: string | null): LinkProblem {
  const message = serverMessage || "That didn't work.";
  switch (status) {
    case 401:
      return { message, next: "sign-in-again", hint: "Your Discord sign-in only lasts about ten minutes. Sign in again and it will remember you." };
    case 400:
      return { message, next: "retry", hint: "It's nine digits, shown in the game as 123-456-789." };
    case 404:
      return { message, next: "retry", hint: "Check each digit. You can copy it from your profile in the game." };
    case 403:
    case 409:
      return { message, next: "ask-officer", hint: "An officer can sort this out in a minute. Say hello in the Discord and tell them your in-game name." };
    case 502:
      return { message, next: "retry", hint: "The game data service is slow. Wait a moment and try again." };
    default:
      return { message, next: "retry", hint: "Try again. If it keeps happening, ask an officer in the Discord." };
  }
}
