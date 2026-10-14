CREATE TABLE "KbNote" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "topic" TEXT,
  "howKnown" TEXT,
  "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
  "via" TEXT NOT NULL,
  "submittedById" TEXT,
  "submittedByName" TEXT NOT NULL,
  "reviewedByName" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KbNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KbNote_status_kind_idx" ON "KbNote"("status", "kind");
CREATE INDEX "KbNote_submittedById_idx" ON "KbNote"("submittedById");

CREATE TABLE "KbNoteHelpful" (
  "id" TEXT NOT NULL,
  "noteId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KbNoteHelpful_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KbNoteHelpful_noteId_playerId_key" ON "KbNoteHelpful"("noteId", "playerId");
CREATE INDEX "KbNoteHelpful_playerId_idx" ON "KbNoteHelpful"("playerId");
ALTER TABLE "KbNoteHelpful" ADD CONSTRAINT "KbNoteHelpful_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "KbNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
