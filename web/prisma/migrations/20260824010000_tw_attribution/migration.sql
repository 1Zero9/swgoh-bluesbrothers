-- Best-effort officer attribution for the Territory War command tool.
-- Additive/nullable only; see docs/knowledge-base.md §5.9 and §13.

ALTER TABLE "ZonePlan" ADD COLUMN "updatedBy" TEXT;
ALTER TABLE "PlayerAssignment" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "PlayerAssignment" ADD COLUMN "updatedBy" TEXT;
ALTER TABLE "AttackAssignment" ADD COLUMN "updatedBy" TEXT;
