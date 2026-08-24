CREATE TYPE "TwPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "TwAssignmentStatus" AS ENUM ('SUGGESTED', 'ASSIGNED', 'ACKNOWLEDGED', 'PLACED', 'CHANGED', 'MISSING', 'EXEMPT');
CREATE TYPE "TwAssignmentSource" AS ENUM ('RECOMMENDED', 'MANUAL');
CREATE TYPE "TwAttackStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'FAILED', 'NEEDS_SPECIALIST', 'CLEARED', 'HOLD');

CREATE TABLE "StrategyTemplate" (
  "id" TEXT NOT NULL,
  "guildId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
  "rules" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StrategyTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TerritoryWarPlan" (
  "id" TEXT NOT NULL,
  "guildId" TEXT NOT NULL,
  "eventId" TEXT,
  "templateId" TEXT,
  "clonedFromId" TEXT,
  "name" TEXT NOT NULL,
  "status" "TwPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TerritoryWarPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ZonePlan" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "zoneId" INTEGER NOT NULL,
  "purpose" TEXT,
  "targetCapacity" INTEGER NOT NULL DEFAULT 25,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ZonePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerAssignment" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "zonePlanId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "squadKey" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "officerNote" TEXT,
  "status" "TwAssignmentStatus" NOT NULL DEFAULT 'SUGGESTED',
  "source" "TwAssignmentSource" NOT NULL DEFAULT 'RECOMMENDED',
  "locked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlayerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AttackAssignment" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "zoneLabel" TEXT NOT NULL,
  "enemySquad" TEXT,
  "assignedPlayerId" TEXT,
  "status" "TwAttackStatus" NOT NULL DEFAULT 'UNASSIGNED',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttackAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StrategyTemplate_guildId_idx" ON "StrategyTemplate"("guildId");

CREATE INDEX "TerritoryWarPlan_guildId_status_idx" ON "TerritoryWarPlan"("guildId", "status");
CREATE INDEX "TerritoryWarPlan_eventId_idx" ON "TerritoryWarPlan"("eventId");

CREATE UNIQUE INDEX "ZonePlan_planId_zoneId_key" ON "ZonePlan"("planId", "zoneId");

CREATE INDEX "PlayerAssignment_planId_zonePlanId_idx" ON "PlayerAssignment"("planId", "zonePlanId");
CREATE INDEX "PlayerAssignment_playerId_idx" ON "PlayerAssignment"("playerId");

CREATE INDEX "AttackAssignment_planId_idx" ON "AttackAssignment"("planId");

ALTER TABLE "StrategyTemplate" ADD CONSTRAINT "StrategyTemplate_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TerritoryWarPlan" ADD CONSTRAINT "TerritoryWarPlan_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TerritoryWarPlan" ADD CONSTRAINT "TerritoryWarPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GuildEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TerritoryWarPlan" ADD CONSTRAINT "TerritoryWarPlan_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "StrategyTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TerritoryWarPlan" ADD CONSTRAINT "TerritoryWarPlan_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "TerritoryWarPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ZonePlan" ADD CONSTRAINT "ZonePlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TerritoryWarPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlayerAssignment" ADD CONSTRAINT "PlayerAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TerritoryWarPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerAssignment" ADD CONSTRAINT "PlayerAssignment_zonePlanId_fkey" FOREIGN KEY ("zonePlanId") REFERENCES "ZonePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerAssignment" ADD CONSTRAINT "PlayerAssignment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttackAssignment" ADD CONSTRAINT "AttackAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TerritoryWarPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttackAssignment" ADD CONSTRAINT "AttackAssignment_assignedPlayerId_fkey" FOREIGN KEY ("assignedPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
