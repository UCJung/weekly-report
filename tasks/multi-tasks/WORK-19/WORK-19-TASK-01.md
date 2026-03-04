# WORK-19-TASK-01: 백엔드 — 팀원현황 API 파트정보 추가 + 일괄승인 API

> WORK: 근무시간표 기능 개선 (Require-07)
> 의존: 없음
> 작성일: 2026-03-04

---

## 1. 목적

팀 근무시간 검토 화면과 대시보드에서 팀원의 파트·직책 정보를 표시하고, 팀장이 다수 시간표를 한 번에 승인할 수 있도록 백엔드 API를 확장한다.

---

## 2. 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/backend/src/timesheet/timesheet-stats.service.ts` | getTeamMembersStatus에 partId, partName, jobTitle 추가 |
| `packages/backend/src/timesheet/timesheet.controller.ts` | PART_LEADER 접근 허용, 일괄승인 엔드포인트 추가 |
| `packages/backend/src/timesheet/timesheet-approval.service.ts` | batchLeaderApprove 메서드 추가 |
| `packages/frontend/src/api/timesheet.api.ts` | TeamMemberStatusRow에 partId, partName, jobTitle 추가, batchApprove API 추가 |
| `packages/frontend/src/hooks/useTimesheet.ts` | useBatchApproveTimesheets 훅 추가 |

---

## 3. 체크리스트

- [ ] getTeamMembersStatus 응답에 partId, partName, jobTitle(직책) 필드 추가
- [ ] getTeamMembersStatus에 PART_LEADER 역할 접근 허용
- [ ] POST /timesheets/batch-approve { timesheetIds: string[] } 신규 엔드포인트
- [ ] batchLeaderApprove 서비스 메서드 (트랜잭션)
- [ ] 프론트 TeamMemberStatusRow 인터페이스 확장
- [ ] 프론트 batchApprove API + useBatchApproveTimesheets 훅
- [ ] 빌드 0 에러
