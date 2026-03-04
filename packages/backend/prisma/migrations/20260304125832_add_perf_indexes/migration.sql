-- CreateIndex
CREATE INDEX "part_summaries_teamId_weekStart_idx" ON "part_summaries"("teamId", "weekStart");

-- CreateIndex
CREATE INDEX "parts_teamId_sortOrder_idx" ON "parts"("teamId", "sortOrder");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "team_join_requests_memberId_teamId_status_idx" ON "team_join_requests"("memberId", "teamId", "status");

-- CreateIndex
CREATE INDEX "timesheet_approvals_approverId_approvalType_idx" ON "timesheet_approvals"("approverId", "approvalType");
