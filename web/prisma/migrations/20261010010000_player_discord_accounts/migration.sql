CREATE TABLE "PlayerDiscordAccount" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "discordUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlayerDiscordAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlayerDiscordAccount_discordUserId_key" ON "PlayerDiscordAccount"("discordUserId");
CREATE INDEX "PlayerDiscordAccount_playerId_idx" ON "PlayerDiscordAccount"("playerId");

ALTER TABLE "PlayerDiscordAccount" ADD CONSTRAINT "PlayerDiscordAccount_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
