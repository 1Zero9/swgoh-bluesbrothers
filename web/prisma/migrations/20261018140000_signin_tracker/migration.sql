CREATE TABLE "SignInEvent" (
  "id" TEXT NOT NULL,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "kind" TEXT NOT NULL,
  "device" TEXT,
  "browser" TEXT,
  "inApp" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "SignInEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SignInEvent_at_idx" ON "SignInEvent"("at");

CREATE TABLE "SignInHelp" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" TEXT NOT NULL,
  "contact" TEXT,
  "problem" TEXT NOT NULL,
  "note" TEXT,
  "device" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "doneBy" TEXT,
  "doneAt" TIMESTAMP(3),
  CONSTRAINT "SignInHelp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SignInHelp_status_createdAt_idx" ON "SignInHelp"("status", "createdAt");
