CREATE TABLE "MemberPresence" (
  "playerId" TEXT NOT NULL,
  "playerName" TEXT NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  "path" TEXT,
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "MemberPresence_pkey" PRIMARY KEY ("playerId")
);
CREATE INDEX "MemberPresence_lastSeenAt_idx" ON "MemberPresence"("lastSeenAt");
