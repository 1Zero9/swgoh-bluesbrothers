import { getPrisma } from "@/lib/prisma";
import { DEFAULT_ZONES, type SquadKey } from "@/lib/tw-squads";
import type { Recommendation } from "@/lib/tw-planning-engine";
import type {
  TwAssignmentStatus,
  TwAssignmentSource,
  TwAttackStatus,
  TwPlanStatus,
} from "@/app/generated/prisma/client";

/**
 * Prisma-backed persistence layer for the Territory War command tool.
 * Keeps DB access and shaping in one place so API routes stay thin and the
 * pure engine in lib/tw-planning-engine.ts never has to import Prisma.
 */

export async function getOrCreateActivePlan(
  guildId: string,
  eventId: string | null,
  name: string,
  createdBy?: string
) {
  const prisma = getPrisma();

  const existing = await prisma.territoryWarPlan.findFirst({
    where: {
      guildId,
      eventId: eventId ?? undefined,
      status: { in: ["DRAFT", "ACTIVE"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return prisma.territoryWarPlan.create({
    data: {
      guildId,
      eventId,
      name,
      status: "DRAFT",
      version: 1,
      createdBy: createdBy ?? null,
      zonePlans: {
        create: DEFAULT_ZONES.map((zone) => ({
          zoneId: zone.id,
          purpose: zone.purpose,
          targetCapacity: zone.type === "fleet" ? 15 : 25,
        })),
      },
    },
  });
}

export async function listPlansForGuild(guildId: string) {
  const prisma = getPrisma();
  return prisma.territoryWarPlan.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, status: true, version: true, createdAt: true, eventId: true },
  });
}

export async function getPlanDetail(planId: string) {
  const prisma = getPrisma();
  return prisma.territoryWarPlan.findUnique({
    where: { id: planId },
    include: {
      zonePlans: { orderBy: { zoneId: "asc" } },
      assignments: { orderBy: { priority: "asc" } },
      attackAssignments: { orderBy: { zoneLabel: "asc" } },
      template: true,
    },
  });
}

export async function setPlanStatus(planId: string, status: TwPlanStatus) {
  const prisma = getPrisma();
  return prisma.territoryWarPlan.update({ where: { id: planId }, data: { status } });
}

export async function clonePlan(planId: string, name: string, createdBy?: string) {
  const prisma = getPrisma();
  const source = await prisma.territoryWarPlan.findUnique({
    where: { id: planId },
    include: { zonePlans: true, assignments: true },
  });
  if (!source) throw new Error("plan not found");

  return prisma.$transaction(async (tx) => {
    const clone = await tx.territoryWarPlan.create({
      data: {
        guildId: source.guildId,
        eventId: source.eventId,
        templateId: source.templateId,
        clonedFromId: source.id,
        name,
        status: "DRAFT",
        version: source.version + 1,
        createdBy: createdBy ?? null,
      },
    });

    const zoneIdMap = new Map<string, string>();
    for (const zonePlan of source.zonePlans) {
      const newZone = await tx.zonePlan.create({
        data: {
          planId: clone.id,
          zoneId: zonePlan.zoneId,
          purpose: zonePlan.purpose,
          targetCapacity: zonePlan.targetCapacity,
          note: zonePlan.note,
        },
      });
      zoneIdMap.set(zonePlan.id, newZone.id);
    }

    for (const assignment of source.assignments) {
      const zonePlanId = zoneIdMap.get(assignment.zonePlanId);
      if (!zonePlanId) continue;
      await tx.playerAssignment.create({
        data: {
          planId: clone.id,
          zonePlanId,
          playerId: assignment.playerId,
          squadKey: assignment.squadKey,
          priority: assignment.priority,
          officerNote: assignment.officerNote,
          status: assignment.status,
          source: assignment.source,
          locked: assignment.locked,
          createdBy: createdBy ?? null,
        },
      });
    }

    return clone;
  });
}

export async function upsertZonePlan(
  planId: string,
  zoneId: number,
  updates: { purpose?: string | null; targetCapacity?: number; note?: string | null },
  updatedBy?: string
) {
  const prisma = getPrisma();
  return prisma.zonePlan.upsert({
    where: { planId_zoneId: { planId, zoneId } },
    create: { planId, zoneId, ...updates, updatedBy: updatedBy ?? null },
    update: { ...updates, updatedBy: updatedBy ?? null },
  });
}

export async function createAssignment(input: {
  planId: string;
  zoneId: number;
  playerId: string;
  squadKey: SquadKey;
  priority?: number;
  officerNote?: string | null;
  status?: TwAssignmentStatus;
  source?: TwAssignmentSource;
  locked?: boolean;
  createdBy?: string;
}) {
  const prisma = getPrisma();
  const zonePlan = await prisma.zonePlan.upsert({
    where: { planId_zoneId: { planId: input.planId, zoneId: input.zoneId } },
    create: { planId: input.planId, zoneId: input.zoneId },
    update: {},
  });
  return prisma.playerAssignment.create({
    data: {
      planId: input.planId,
      zonePlanId: zonePlan.id,
      playerId: input.playerId,
      squadKey: input.squadKey,
      priority: input.priority ?? 0,
      officerNote: input.officerNote ?? null,
      status: input.status ?? "SUGGESTED",
      source: input.source ?? "MANUAL",
      locked: input.locked ?? false,
      createdBy: input.createdBy ?? null,
      updatedBy: input.createdBy ?? null,
    },
  });
}

export async function updateAssignment(
  assignmentId: string,
  updates: {
    status?: TwAssignmentStatus;
    officerNote?: string | null;
    locked?: boolean;
    squadKey?: SquadKey;
    zoneId?: number;
    planId?: string;
    updatedBy?: string;
  }
) {
  const prisma = getPrisma();
  const data: Record<string, unknown> = { ...updates };
  delete data.zoneId;
  delete data.planId;

  if (updates.zoneId !== undefined && updates.planId !== undefined) {
    const zonePlan = await prisma.zonePlan.upsert({
      where: { planId_zoneId: { planId: updates.planId, zoneId: updates.zoneId } },
      create: { planId: updates.planId, zoneId: updates.zoneId },
      update: {},
    });
    data.zonePlanId = zonePlan.id;
  }

  return prisma.playerAssignment.update({ where: { id: assignmentId }, data });
}

export async function deleteAssignment(assignmentId: string) {
  const prisma = getPrisma();
  return prisma.playerAssignment.delete({ where: { id: assignmentId } });
}

export async function applyRecommendations(planId: string, recommendations: Recommendation[]) {
  const prisma = getPrisma();
  const existing = await prisma.playerAssignment.findMany({
    where: { planId, OR: [{ locked: true }, { source: "MANUAL" }] },
    select: { playerId: true },
  });
  const protectedPlayers = new Set(existing.map((a) => a.playerId));

  await prisma.playerAssignment.deleteMany({
    where: { planId, source: "RECOMMENDED", locked: false },
  });

  const toCreate = recommendations.filter((r) => !protectedPlayers.has(r.playerId));

  const zonePlans = await prisma.zonePlan.findMany({ where: { planId } });
  const zonePlanByZoneId = new Map(zonePlans.map((z) => [z.zoneId, z.id]));

  for (const zoneId of new Set(toCreate.map((r) => r.zoneId))) {
    if (!zonePlanByZoneId.has(zoneId)) {
      const zonePlan = await prisma.zonePlan.upsert({
        where: { planId_zoneId: { planId, zoneId } },
        create: { planId, zoneId },
        update: {},
      });
      zonePlanByZoneId.set(zoneId, zonePlan.id);
    }
  }

  if (toCreate.length === 0) return { created: 0 };

  await prisma.playerAssignment.createMany({
    data: toCreate.map((r) => ({
      planId,
      zonePlanId: zonePlanByZoneId.get(r.zoneId)!,
      playerId: r.playerId,
      squadKey: r.squadKey,
      priority: r.priority,
      status: "SUGGESTED" as const,
      source: "RECOMMENDED" as const,
      locked: false,
    })),
  });

  return { created: toCreate.length };
}

export async function upsertAttackAssignment(input: {
  id?: string;
  planId: string;
  zoneLabel: string;
  enemySquad?: string | null;
  assignedPlayerId?: string | null;
  status?: TwAttackStatus;
  note?: string | null;
  updatedBy?: string;
}) {
  const prisma = getPrisma();
  if (input.id) {
    return prisma.attackAssignment.update({
      where: { id: input.id },
      data: {
        zoneLabel: input.zoneLabel,
        enemySquad: input.enemySquad ?? null,
        assignedPlayerId: input.assignedPlayerId ?? null,
        status: input.status,
        note: input.note ?? null,
        updatedBy: input.updatedBy ?? null,
      },
    });
  }
  return prisma.attackAssignment.create({
    data: {
      planId: input.planId,
      zoneLabel: input.zoneLabel,
      enemySquad: input.enemySquad ?? null,
      assignedPlayerId: input.assignedPlayerId ?? null,
      status: input.status ?? "UNASSIGNED",
      note: input.note ?? null,
      updatedBy: input.updatedBy ?? null,
    },
  });
}

export async function deleteAttackAssignment(id: string) {
  const prisma = getPrisma();
  return prisma.attackAssignment.delete({ where: { id } });
}

export async function listTemplates(guildId: string) {
  const prisma = getPrisma();
  return prisma.strategyTemplate.findMany({ where: { guildId }, orderBy: { createdAt: "asc" } });
}

export async function createTemplate(input: {
  guildId: string;
  name: string;
  description?: string | null;
  rules: unknown;
}) {
  const prisma = getPrisma();
  return prisma.strategyTemplate.create({
    data: {
      guildId: input.guildId,
      name: input.name,
      description: input.description ?? null,
      rules: input.rules as object,
    },
  });
}

export async function updateTemplate(
  templateId: string,
  updates: { name?: string; description?: string | null; rules?: unknown }
) {
  const prisma = getPrisma();
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.rules !== undefined) data.rules = updates.rules as object;
  return prisma.strategyTemplate.update({ where: { id: templateId }, data });
}

export async function deleteTemplate(templateId: string) {
  const prisma = getPrisma();
  return prisma.strategyTemplate.delete({ where: { id: templateId } });
}

export async function setPlanTemplate(planId: string, templateId: string | null) {
  const prisma = getPrisma();
  return prisma.territoryWarPlan.update({ where: { id: planId }, data: { templateId } });
}

export async function getDefaultGuildId() {
  const prisma = getPrisma();
  const guild = await prisma.guild.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  return guild?.id ?? null;
}

export async function getCurrentTwEventId() {
  const prisma = getPrisma();
  const event = await prisma.guildEvent.findFirst({
    where: { type: "TERRITORY_WAR" },
    orderBy: { startsAt: "desc" },
    select: { id: true },
  });
  return event?.id ?? null;
}
