-- WORK-24 Phase 2: Data migration
-- Insert default 3 statuses per team, then map existing personal_tasks.status → statusId

DO $$
DECLARE
  rec RECORD;
  before_start_id TEXT;
  in_progress_id TEXT;
  completed_id TEXT;
BEGIN
  FOR rec IN SELECT id FROM teams LOOP
    -- Insert BEFORE_START default status (할일)
    before_start_id := gen_random_uuid()::TEXT;
    INSERT INTO task_status_defs (id, "teamId", name, category, color, "sortOrder", "isDefault", "isDeleted", "createdAt", "updatedAt")
    VALUES (before_start_id, rec.id, '할일', 'BEFORE_START', '#6C7A89', 0, true, false, NOW(), NOW());

    -- Insert IN_PROGRESS default status (진행중)
    in_progress_id := gen_random_uuid()::TEXT;
    INSERT INTO task_status_defs (id, "teamId", name, category, color, "sortOrder", "isDefault", "isDeleted", "createdAt", "updatedAt")
    VALUES (in_progress_id, rec.id, '진행중', 'IN_PROGRESS', '#6B5CE7', 1, true, false, NOW(), NOW());

    -- Insert COMPLETED default status (완료)
    completed_id := gen_random_uuid()::TEXT;
    INSERT INTO task_status_defs (id, "teamId", name, category, color, "sortOrder", "isDefault", "isDeleted", "createdAt", "updatedAt")
    VALUES (completed_id, rec.id, '완료', 'COMPLETED', '#27AE60', 2, true, false, NOW(), NOW());

    -- Map existing personal_tasks.status → statusId for this team
    -- TODO → BEFORE_START default
    UPDATE personal_tasks
    SET "statusId" = before_start_id
    WHERE "teamId" = rec.id AND status = 'TODO' AND "statusId" IS NULL;

    -- IN_PROGRESS → IN_PROGRESS default
    UPDATE personal_tasks
    SET "statusId" = in_progress_id
    WHERE "teamId" = rec.id AND status = 'IN_PROGRESS' AND "statusId" IS NULL;

    -- DONE → COMPLETED default
    UPDATE personal_tasks
    SET "statusId" = completed_id
    WHERE "teamId" = rec.id AND status = 'DONE' AND "statusId" IS NULL;
  END LOOP;

  -- For any personal_tasks without a team match (edge case), use first available BEFORE_START status
  UPDATE personal_tasks pt
  SET "statusId" = (
    SELECT tsd.id FROM task_status_defs tsd
    WHERE tsd."teamId" = pt."teamId" AND tsd."isDefault" = true AND tsd.category = 'BEFORE_START'
    LIMIT 1
  )
  WHERE pt."statusId" IS NULL;
END $$;
