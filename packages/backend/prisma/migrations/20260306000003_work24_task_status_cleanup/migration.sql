-- WORK-24 Phase 3: Make statusId NOT NULL, add FK, drop old status column and TaskStatus enum

-- AddForeignKey: personal_tasks.statusId -> task_status_defs.id
ALTER TABLE "personal_tasks" ADD CONSTRAINT "personal_tasks_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "task_status_defs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Make statusId NOT NULL
ALTER TABLE "personal_tasks" ALTER COLUMN "statusId" SET NOT NULL;

-- Drop old index on status
DROP INDEX IF EXISTS "personal_tasks_memberId_teamId_status_idx";

-- CreateIndex: new index on statusId
CREATE INDEX "personal_tasks_memberId_teamId_statusId_idx" ON "personal_tasks"("memberId", "teamId", "statusId");

-- Drop old status column
ALTER TABLE "personal_tasks" DROP COLUMN "status";

-- Drop old TaskStatus enum
DROP TYPE IF EXISTS "TaskStatus";
