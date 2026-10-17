CREATE TABLE "MemberSignInLink" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  CONSTRAINT "MemberSignInLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MemberSignInLink_tokenHash_key" ON "MemberSignInLink"("tokenHash");
CREATE INDEX "MemberSignInLink_playerId_idx" ON "MemberSignInLink"("playerId");
