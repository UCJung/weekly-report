# WORK-21 Progress

> WORK: DB 쿼리 성능 최적화
> Last updated: 2026-03-04 (TASK-04 완료)

| TASK | Title | Depends | Status | Commit | Note |
|------|-------|---------|--------|--------|------|
| WORK-21-TASK-01 | Prisma 스키마 인덱스 추가 + 마이그레이션 | - | Done | 5afad9b | |
| WORK-21-TASK-02 | timesheet-stats.service.ts CRITICAL/HIGH 최적화 | TASK-01 | Done | c5af01e | |
| WORK-21-TASK-03 | 주간업무/취합보고 쿼리 최적화 | TASK-01 | Done | a67c80f | |
| WORK-21-TASK-04 | 시간표/Admin 서비스 쿼리 최적화 | TASK-01, TASK-02 | Done | 60cb379 | |

## Log

- 2026-03-04: TASK-01 완료 — 5개 성능 인덱스 추가 (PartSummary, TeamJoinRequest, Project, Part, TimesheetApproval), 마이그레이션 20260304125832_add_perf_indexes 적용, 빌드 및 153개 테스트 통과
- 2026-03-04: TASK-02 완료 — checkAndAutoApprove createMany 전환 + GET 부수효과 제거, getTeamMembersStatus select 최소화, getAdminOverview Promise.all 병렬화 (4+2쿼리), POST /api/v1/timesheets/auto-approve 엔드포인트 추가
- 2026-03-04: TASK-03 완료 — ISSUE-03 getTeamMembersWeeklyStatus/getTeamWeeklyOverview 4단계 중첩 JOIN → 2단계 쿼리 분리, ISSUE-05 중복 weeklyReport SELECT 제거, ISSUE-17 findById summaryWorkItems include 제거, ISSUE-18 aggregate → findFirst 교체, ISSUE-20 assertLeaderOrPartLeader Promise.all 병렬화, 153개 테스트 통과
- 2026-03-04: TASK-04 완료 — ISSUE-07 timesheet-export select 최소화, ISSUE-13 batchSave N*deleteMany → 1*deleteMany 최적화, ISSUE-10 admin listTeams _count correlated subquery 제거, ISSUE-06 reorder 상한선 50개 가드 추가, 153개 테스트 통과
