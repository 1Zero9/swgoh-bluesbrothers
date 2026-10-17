CREATE TABLE "MemberCardSnapshot" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "headline" TEXT NOT NULL,
  "strengths" INTEGER NOT NULL,
  "watches" INTEGER NOT NULL,
  "galacticPower" BIGINT,
  "payload" JSONB NOT NULL,
  CONSTRAINT "MemberCardSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MemberCardSnapshot_playerId_capturedAt_idx" ON "MemberCardSnapshot"("playerId", "capturedAt");
CREATE INDEX "MemberCardSnapshot_capturedAt_idx" ON "MemberCardSnapshot"("capturedAt");
