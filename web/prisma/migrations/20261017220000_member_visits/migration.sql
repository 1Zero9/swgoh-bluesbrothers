CREATE TABLE "MemberVisit" (
  "id" TEXT NOT NULL,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "playerId" TEXT,
  "playerName" TEXT NOT NULL,
  "country" TEXT,
  "region" TEXT,
  "city" TEXT,
  "device" TEXT,
  "path" TEXT,
  CONSTRAINT "MemberVisit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MemberVisit_at_idx" ON "MemberVisit"("at");
CREATE INDEX "MemberVisit_playerId_at_idx" ON "MemberVisit"("playerId", "at");
