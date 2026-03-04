# WORK-19 Progress

> WORK: 근무시간표 기능 개선 (Require-07)
> Last updated: 2026-03-04

| TASK | Title | Depends | Status | Commit | Note |
|------|-------|---------|--------|--------|------|
| WORK-19-TASK-01 | 백엔드 — 팀원현황 API 파트정보 추가 + 일괄승인 API | — | Done | 17d823b | |
| WORK-19-TASK-02 | 팀 근무시간 검토 — 필터/목록/카운트 개선 | TASK-01 | Done | fe81cc2 | |
| WORK-19-TASK-03 | 팀 근무시간 검토 — 행선택 시간표 팝업 + 일괄승인 + 액션열 | TASK-01, TASK-02 | Done | f48400b | |
| WORK-19-TASK-04 | 대시보드 — 주간업무보고/근무시간표 토글 + 카드 필터링 | TASK-01 | Done | 963c2ed | |
| WORK-19-TASK-05 | 프로젝트투입현황 월간승인 400 오류 수정 | — | Done | — | 추가 작업 |
| WORK-19-TASK-06 | 프로젝트투입현황 목록에 승인여부 컬럼 추가 | TASK-05 | Done | b478290 | 기능개선 |
| WORK-19-TASK-07 | Backend 빌드 아티팩트 불일치 500 에러 수정 | — | Done | — | clean 빌드로 해결, 코드변경 없음 |

## Log
- TASK-01: 백엔드 팀원현황 API 파트/직책 필드 추가, 일괄승인 API + 프론트 API/훅
- TASK-02: 팀 근무시간 검토 필터/목록/카운트 개선 (파트·팀원 필터, 컬럼 추가, 총원/제출/미제출 카운트)
- TASK-03: 행 클릭 시간표 팝업 + 체크박스 일괄승인 + 액션열 분리
- TASK-04: 대시보드 주간업무보고/근무시간표 뷰 토글 + 요약카드 필터링 + SummaryCard highlighted/onClick 확장
- TASK-05: 프로젝트투입현황 월간승인 400 오류 — apiClient.post body null → {} 수정
- TASK-06: 프로젝트투입현황 목록에 PM 승인여부(pmApprovalStatus) 컬럼 추가 — 백엔드 조회 + 프론트 Badge 표시
- TASK-07: Backend dist 빌드 캐시 불일치로 `Cannot find module './app.module'` 에러 — clean 빌드(rm -rf dist)로 해결
