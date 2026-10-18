/**
 * The Postgres driver currently treats sslmode=prefer, require and verify-ca as verify-full, and warns that this will change
 * in its next major version. Saying verify-full out loud keeps today's behaviour exactly and silences the warning.
 */
/** Prisma's pooled address (Accelerate) starts with prisma:// or prisma+postgres://; the plain database address starts with postgres://. */
export function isAccelerateUrl(connectionString: string): boolean {
  return /^prisma(\+postgres)?:\/\//i.test(connectionString.trim());
}

export function explicitSsl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get("sslmode");
    if (!mode || url.searchParams.has("uselibpqcompat")) return connectionString;
    if (["prefer", "require", "verify-ca"].includes(mode)) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
    return connectionString;
  } catch {
    return connectionString;
  }
}
