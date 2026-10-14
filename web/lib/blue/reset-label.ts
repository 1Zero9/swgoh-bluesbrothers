/** "Monday 20 Oct" for the day the weekly question allowance resets. `iso` is a YYYY-MM-DD date in UTC. */
export function resetLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
}
