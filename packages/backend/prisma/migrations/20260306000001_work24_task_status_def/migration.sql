-- WORK-24 Phase 1: Add TaskStatusDef table + nullable statusId column on personal_tasks

-- CreateEnum
CREATE TYPE "task_status_category" AS ENUM ('BEFORE_START', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable: task_status_defs
CREATE TABLE "task_status_defs" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "task_status_category" NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B5CE7',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_status_defs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: task_status_defs.teamId -> teams.id
ALTER TABLE "task_status_defs" ADD CONSTRAINT "task_status_defs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "task_status_defs_teamId_sortOrder_idx" ON "task_status_defs"("teamId", "sortOrder");
CREATE INDEX "task_status_defs_teamId_category_idx" ON "task_status_defs"("teamId", "category");

-- AddColumn: nullable statusId on personal_tasks
ALTER TABLE "personal_tasks" ADD COLUMN "statusId" TEXT;
