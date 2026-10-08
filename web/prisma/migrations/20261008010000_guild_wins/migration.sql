CREATE TABLE "GuildWin" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "subject" TEXT NOT NULL DEFAULT '',
  "value" INTEGER NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuildWin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuildWin_playerId_kind_subject_value_key" ON "GuildWin"("playerId", "kind", "subject", "value");
CREATE INDEX "GuildWin_occurredAt_idx" ON "GuildWin"("occurredAt");

ALTER TABLE "GuildWin" ADD CONSTRAINT "GuildWin_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill headline wins from stored profile history (counts only, so no unit names).
INSERT INTO "GuildWin" ("id", "playerId", "kind", "subject", "value", "occurredAt")
SELECT 'bf_gl_' || "playerId" || '_' || "galacticLegends", "playerId", 'GL_UNLOCK', '', "galacticLegends", "capturedAt"
FROM (
  SELECT *, LAG("galacticLegends") OVER (PARTITION BY "playerId" ORDER BY "capturedAt") AS prev
  FROM "PlayerProfileSnapshot"
) s WHERE prev IS NOT NULL AND "galacticLegends" > prev
ON CONFLICT DO NOTHING;

INSERT INTO "GuildWin" ("id", "playerId", "kind", "subject", "value", "occurredAt")
SELECT 'bf_ult_' || "playerId" || '_' || "unlockedUltimates", "playerId", 'ULTIMATE', '', "unlockedUltimates", "capturedAt"
FROM (
  SELECT *, LAG("unlockedUltimates") OVER (PARTITION BY "playerId" ORDER BY "capturedAt") AS prev
  FROM "PlayerProfileSnapshot"
) s WHERE prev IS NOT NULL AND "unlockedUltimates" > prev
ON CONFLICT DO NOTHING;
