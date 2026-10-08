CREATE TABLE "TbCallout" (
  "id" TEXT NOT NULL,
  "guildId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "unitName" TEXT NOT NULL,
  "minStars" INTEGER NOT NULL DEFAULT 7,
  "minRelic" INTEGER NOT NULL DEFAULT 0,
  "needed" INTEGER,
  "phase" INTEGER,
  "planetName" TEXT,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "TbCallout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TbCallout_guildId_status_idx" ON "TbCallout"("guildId", "status");

ALTER TABLE "TbCallout" ADD CONSTRAINT "TbCallout_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
