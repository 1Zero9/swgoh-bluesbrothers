CREATE TABLE "BlueQuestion" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "playerId" TEXT,
  "playerName" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "verdict" TEXT NOT NULL DEFAULT 'OK',
  "reason" TEXT,
  "answer" TEXT,
  CONSTRAINT "BlueQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BlueQuestion_createdAt_idx" ON "BlueQuestion"("createdAt");
CREATE INDEX "BlueQuestion_playerId_createdAt_idx" ON "BlueQuestion"("playerId", "createdAt");
CREATE INDEX "BlueQuestion_verdict_createdAt_idx" ON "BlueQuestion"("verdict", "createdAt");

CREATE TABLE "BlueCutoff" (
  "playerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlueCutoff_pkey" PRIMARY KEY ("playerId")
);
