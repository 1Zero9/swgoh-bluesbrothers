-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GuildEventType" AS ENUM ('TERRITORY_BATTLE', 'TERRITORY_WAR', 'RAID');

-- CreateEnum
CREATE TYPE "MembershipState" AS ENUM ('ACTIVE', 'LEFT');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'ACKNOWLEDGED');

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discordGuildId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "allyCode" TEXT,
    "currentName" TEXT NOT NULL,
    "discordUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerName" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipTerm" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "state" "MembershipState" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "welcomeSentAt" TIMESTAMP(3),
    "departureNotifiedAt" TIMESTAMP(3),

    CONSTRAINT "MembershipTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildSnapshot" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "galacticPower" BIGINT NOT NULL,
    "characterPower" BIGINT NOT NULL,
    "shipPower" BIGINT NOT NULL,
    "raidTickets" INTEGER,
    "rawPayload" JSONB,

    CONSTRAINT "GuildSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberSnapshot" (
    "id" TEXT NOT NULL,
    "guildSnapshotId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "galacticPower" BIGINT NOT NULL,
    "raidTickets" INTEGER,
    "lastActivityAt" TIMESTAMP(3),

    CONSTRAINT "MemberSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildEvent" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "externalId" TEXT,
    "type" "GuildEventType" NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "finalResult" JSONB,

    CONSTRAINT "GuildEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSnapshot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "phase" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "EventSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationEvent" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "playerId" TEXT,
    "kind" TEXT NOT NULL,
    "status" "AutomationStatus" NOT NULL DEFAULT 'PENDING',
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "discordChannelId" TEXT,
    "discordMessageId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "AutomationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_discordGuildId_key" ON "Guild"("discordGuildId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_allyCode_key" ON "Player"("allyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Player_discordUserId_key" ON "Player"("discordUserId");

-- CreateIndex
CREATE INDEX "PlayerName_playerId_lastSeen_idx" ON "PlayerName"("playerId", "lastSeen");

-- CreateIndex
CREATE INDEX "MembershipTerm_guildId_state_idx" ON "MembershipTerm"("guildId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipTerm_guildId_playerId_joinedAt_key" ON "MembershipTerm"("guildId", "playerId", "joinedAt");

-- CreateIndex
CREATE INDEX "GuildSnapshot_capturedAt_idx" ON "GuildSnapshot"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuildSnapshot_guildId_capturedAt_key" ON "GuildSnapshot"("guildId", "capturedAt");

-- CreateIndex
CREATE INDEX "MemberSnapshot_playerId_idx" ON "MemberSnapshot"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSnapshot_guildSnapshotId_playerId_key" ON "MemberSnapshot"("guildSnapshotId", "playerId");

-- CreateIndex
CREATE INDEX "GuildEvent_guildId_type_startsAt_idx" ON "GuildEvent"("guildId", "type", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuildEvent_guildId_type_externalId_key" ON "GuildEvent"("guildId", "type", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSnapshot_eventId_capturedAt_key" ON "EventSnapshot"("eventId", "capturedAt");

-- CreateIndex
CREATE INDEX "AutomationEvent_guildId_occurredAt_idx" ON "AutomationEvent"("guildId", "occurredAt");

-- CreateIndex
CREATE INDEX "AutomationEvent_status_occurredAt_idx" ON "AutomationEvent"("status", "occurredAt");

-- AddForeignKey
ALTER TABLE "PlayerName" ADD CONSTRAINT "PlayerName_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipTerm" ADD CONSTRAINT "MembershipTerm_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipTerm" ADD CONSTRAINT "MembershipTerm_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSnapshot" ADD CONSTRAINT "GuildSnapshot_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSnapshot" ADD CONSTRAINT "MemberSnapshot_guildSnapshotId_fkey" FOREIGN KEY ("guildSnapshotId") REFERENCES "GuildSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSnapshot" ADD CONSTRAINT "MemberSnapshot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildEvent" ADD CONSTRAINT "GuildEvent_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSnapshot" ADD CONSTRAINT "EventSnapshot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GuildEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationEvent" ADD CONSTRAINT "AutomationEvent_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationEvent" ADD CONSTRAINT "AutomationEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
