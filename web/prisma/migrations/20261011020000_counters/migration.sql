CREATE TABLE "Counter" (
  "id" TEXT NOT NULL,
  "enemyLeaderId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'BOTH',
  "squad" JSONB NOT NULL,
  "notes" TEXT,
  "createdById" TEXT,
  "createdByName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Counter_enemyLeaderId_idx" ON "Counter"("enemyLeaderId");
CREATE INDEX "Counter_createdAt_idx" ON "Counter"("createdAt");
