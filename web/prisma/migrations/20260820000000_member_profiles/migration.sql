-- Preserve the complete latest player profile and track useful member/profile history.
ALTER TABLE "Player"
ADD COLUMN "level" INTEGER,
ADD COLUMN "portraitId" TEXT,
ADD COLUMN "titleId" TEXT,
ADD COLUMN "profileSyncedAt" TIMESTAMP(3),
ADD COLUMN "profilePayload" JSONB;

ALTER TABLE "MemberSnapshot"
ADD COLUMN "characterPower" BIGINT,
ADD COLUMN "shipPower" BIGINT,
ADD COLUMN "playerLevel" INTEGER,
ADD COLUMN "memberRole" TEXT,
ADD COLUMN "squadPower" INTEGER,
ADD COLUMN "lifetimeSeasonScore" BIGINT,
ADD COLUMN "leagueId" TEXT,
ADD COLUMN "guildXp" INTEGER,
ADD COLUMN "rawPayload" JSONB;

CREATE TABLE "PlayerProfileSnapshot" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "galacticLegends" INTEGER NOT NULL,
  "unlockedUltimates" INTEGER NOT NULL,
  "relicUnits" INTEGER NOT NULL,
  "rosterUnits" INTEGER NOT NULL,
  "datacrons" INTEGER NOT NULL,
  "lifetimeSeasonScore" BIGINT,
  CONSTRAINT "PlayerProfileSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlayerProfileSnapshot_playerId_capturedAt_key"
ON "PlayerProfileSnapshot"("playerId", "capturedAt");

CREATE INDEX "PlayerProfileSnapshot_capturedAt_idx"
ON "PlayerProfileSnapshot"("capturedAt");

ALTER TABLE "PlayerProfileSnapshot"
ADD CONSTRAINT "PlayerProfileSnapshot_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
