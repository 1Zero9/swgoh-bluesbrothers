import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { explicitSsl, isAccelerateUrl } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalForPrisma.prisma) {
    // A pooled (Accelerate) address goes through Prisma's own pool, so the database's low connection limit is not used up.
    if (isAccelerateUrl(connectionString)) {
      globalForPrisma.prisma = new PrismaClient({ accelerateUrl: connectionString.trim() });
      return globalForPrisma.prisma;
    }
    const adapter = new PrismaPg({ connectionString: explicitSsl(connectionString), max: 2, idleTimeoutMillis: 3_000, connectionTimeoutMillis: 15_000 });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}
