CREATE TYPE "TbStrategy" AS ENUM ('PRELOAD', 'THREE_STAR', 'HOLD', 'SKIP');

CREATE TABLE "TwCommand" (
  "id" TEXT NOT NULL,
  "guildId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "squadKey" TEXT,
  "kitNotes" TEXT,
  "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TwCommand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TerritoryBattlePlan" (
  "id" TEXT NOT NULL,
  "guildId" TEXT NOT NULL,
  "eventId" TEXT,
  "name" TEXT NOT NULL,
  "status" "TwPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TerritoryBattlePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanetPlan" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "planetName" TEXT NOT NULL,
  "phase" INTEGER NOT NULL DEFAULT 1,
  "strategy" "TbStrategy" NOT NULL DEFAULT 'PRELOAD',
  "commandId" TEXT,
  "note" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanetPlan_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ZonePlan" ADD COLUMN "commandId" TEXT;

CREATE INDEX "TwCommand_guildId_idx" ON "TwCommand"("guildId");

CREATE INDEX "TerritoryBattlePlan_guildId_status_idx" ON "TerritoryBattlePlan"("guildId", "status");
CREATE INDEX "TerritoryBattlePlan_eventId_idx" ON "TerritoryBattlePlan"("eventId");

CREATE INDEX "PlanetPlan_planId_phase_idx" ON "PlanetPlan"("planId", "phase");
CREATE INDEX "PlanetPlan_commandId_idx" ON "PlanetPlan"("commandId");

CREATE INDEX "ZonePlan_commandId_idx" ON "ZonePlan"("commandId");

ALTER TABLE "TwCommand" ADD CONSTRAINT "TwCommand_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TerritoryBattlePlan" ADD CONSTRAINT "TerritoryBattlePlan_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TerritoryBattlePlan" ADD CONSTRAINT "TerritoryBattlePlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GuildEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanetPlan" ADD CONSTRAINT "PlanetPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TerritoryBattlePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanetPlan" ADD CONSTRAINT "PlanetPlan_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "TwCommand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ZonePlan" ADD CONSTRAINT "ZonePlan_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "TwCommand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
