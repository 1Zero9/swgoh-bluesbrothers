CREATE TABLE "FeedbackItem" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "reply" TEXT,
  "submittedById" TEXT,
  "submittedByName" TEXT NOT NULL,
  "statusByName" TEXT,
  "doneAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedbackItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FeedbackItem_status_createdAt_idx" ON "FeedbackItem"("status", "createdAt");
CREATE INDEX "FeedbackItem_submittedById_idx" ON "FeedbackItem"("submittedById");

CREATE TABLE "FeedbackVote" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedbackVote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeedbackVote_itemId_playerId_key" ON "FeedbackVote"("itemId", "playerId");
CREATE INDEX "FeedbackVote_playerId_idx" ON "FeedbackVote"("playerId");
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FeedbackItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
