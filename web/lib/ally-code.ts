/** Ally codes are nine digits, shown as 123-456-789. Pure helpers for the sign-in form. */

/** Keeps digits only (max nine) and adds dashes as the member types. */
export function formatAllyCode(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 9);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean).join("-");
}

export function isCompleteAllyCode(input: string): boolean {
  return input.replace(/\D/g, "").length === 9;
}
