# WORK-19-TASK-02: 팀 근무시간 검토 — 필터/목록/카운트 개선

> WORK: 근무시간표 기능 개선 (Require-07)
> 의존: TASK-01
> 작성일: 2026-03-04

---

## 1. 목적

팀 근무시간 검토(TeamTimesheetReview) 화면의 필터링, 테이블 컬럼, 카운트 표시를 개선하여 팀장/파트장이 팀원 시간표 현황을 효율적으로 파악할 수 있도록 한다.

---

## 2. 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/frontend/src/pages/TeamTimesheetReview.tsx` | 필터 드롭다운, 컬럼 추가, 카운트 표시 |
| `packages/frontend/src/api/timesheet.api.ts` | TeamSummaryMatrixRow에 partId, partName, jobTitle 추가 |
| `packages/backend/src/timesheet/timesheet-stats.service.ts` | getTeamSummary에 partId/partName/jobTitle 추가 |

---

## 3. 체크리스트

- [ ] 툴바에 파트 선택 드롭다운 (기본값: 전체)
- [ ] 파트 선택 시 팀원 선택 드롭다운 연동
- [ ] 제출현황 테이블 컬럼 순서: 성명, 직급, 파트, 직책, 상태, 총근무시간, 근무일수, 제출일, 팀장승인, 액션
- [ ] 매트릭스 테이블도 이름 열에 직급/파트/직책 추가
- [ ] "팀원 제출현황" 타이틀 우측: 총원 N명 · 제출 N명 · 미제출 N명
- [ ] 빌드 0 에러
