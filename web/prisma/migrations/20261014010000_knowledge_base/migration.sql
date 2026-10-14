CREATE TABLE "KbTeam" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "aliases" TEXT[],
  "kind" TEXT NOT NULL DEFAULT 'SQUAD',
  "leaderUnitId" TEXT,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KbTeam_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KbTeam_key_key" ON "KbTeam"("key");
CREATE INDEX "KbTeam_leaderUnitId_idx" ON "KbTeam"("leaderUnitId");

CREATE TABLE "KbVariant" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT,
  "members" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KbVariant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KbVariant_key_key" ON "KbVariant"("key");
CREATE INDEX "KbVariant_teamId_idx" ON "KbVariant"("teamId");
ALTER TABLE "KbVariant" ADD CONSTRAINT "KbVariant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "KbTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "KbMatchup" (
  "id" TEXT NOT NULL,
  "defenderId" TEXT NOT NULL,
  "attackerId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "strategy" TEXT,
  "opening" TEXT,
  "targetPriority" TEXT,
  "failureConditions" TEXT,
  "relicGuidance" TEXT,
  "speedNotes" TEXT,
  "oneShot" BOOLEAN,
  "freshEnemyOnly" BOOLEAN,
  "requirements" JSONB,
  "datacronDependent" BOOLEAN NOT NULL DEFAULT false,
  "datacronExpiresAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
  "via" TEXT NOT NULL,
  "submittedById" TEXT,
  "submittedByName" TEXT NOT NULL,
  "importKey" TEXT,
  "supersedesId" TEXT,
  "reviewedByName" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KbMatchup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KbMatchup_importKey_key" ON "KbMatchup"("importKey");
CREATE INDEX "KbMatchup_status_mode_idx" ON "KbMatchup"("status", "mode");
CREATE INDEX "KbMatchup_defenderId_mode_idx" ON "KbMatchup"("defenderId", "mode");
CREATE INDEX "KbMatchup_attackerId_idx" ON "KbMatchup"("attackerId");
ALTER TABLE "KbMatchup" ADD CONSTRAINT "KbMatchup_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "KbVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "KbMatchup" ADD CONSTRAINT "KbMatchup_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "KbVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "KbEvidence" (
  "id" TEXT NOT NULL,
  "matchupId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sourceProvider" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceRef" TEXT,
  "attribution" TEXT,
  "publishedAt" TIMESTAMP(3),
  "observedAt" TIMESTAMP(3),
  "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "mode" TEXT,
  "season" TEXT,
  "gameVersion" TEXT,
  "conditions" TEXT,
  "battles" INTEGER,
  "wins" INTEGER,
  "losses" INTEGER,
  "banners" DOUBLE PRECISION,
  "summary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KbEvidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KbEvidence_matchupId_idx" ON "KbEvidence"("matchupId");
ALTER TABLE "KbEvidence" ADD CONSTRAINT "KbEvidence_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "KbMatchup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "KbEvent" (
  "id" TEXT NOT NULL,
  "matchupId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KbEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KbEvent_matchupId_idx" ON "KbEvent"("matchupId");
ALTER TABLE "KbEvent" ADD CONSTRAINT "KbEvent_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "KbMatchup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "KbUse" (
  "id" TEXT NOT NULL,
  "matchupId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KbUse_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KbUse_matchupId_playerId_key" ON "KbUse"("matchupId", "playerId");
CREATE INDEX "KbUse_playerId_idx" ON "KbUse"("playerId");
ALTER TABLE "KbUse" ADD CONSTRAINT "KbUse_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "KbMatchup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "KbRequest" (
  "id" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "leaderUnitId" TEXT NOT NULL,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "requestedById" TEXT NOT NULL,
  "requestedByName" TEXT NOT NULL,
  "discordPosted" BOOLEAN NOT NULL DEFAULT false,
  "answeredById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KbRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KbRequest_status_mode_idx" ON "KbRequest"("status", "mode");
CREATE INDEX "KbRequest_leaderUnitId_idx" ON "KbRequest"("leaderUnitId");
