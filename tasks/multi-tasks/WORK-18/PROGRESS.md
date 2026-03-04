# WORK-18 Progress

> WORK: 월별 근무시간표 기능 전체 구현
> Last updated: 2026-03-04

| TASK | Title | Depends | Status | Commit | Note |
|------|-------|---------|--------|--------|------|
| WORK-18-TASK-01 | DB 스키마 변경 + 마이그레이션 | — | Done | f96f90f | |
| WORK-18-TASK-02 | 공유 타입 + 유틸리티 + 상수 | TASK-01 | Done | c53131c | |
| WORK-18-TASK-03 | 백엔드 — 근무시간표 CRUD + 제출 검증 | TASK-01, TASK-02 | Done | 1f3bf0a | |
| WORK-18-TASK-04 | 백엔드 — 프로젝트 변경 + 생성 요청/승인 | TASK-01, TASK-02 | Done | 41ede0a | |
| WORK-18-TASK-05 | 백엔드 — 취합/승인/통계/엑셀 | TASK-03, TASK-04 | Done | 39a58fd | |
| WORK-18-TASK-06 | 프론트엔드 — 근무시간표 작성 페이지 | TASK-03 | Done | 6a3d94e | |
| WORK-18-TASK-07 | 프론트엔드 — 팀장/PM/관리자 페이지 | TASK-05, TASK-06 | Done | 7012c94 | |
| WORK-18-TASK-08 | 기존 코드 수정 + 통합 빌드 검증 | TASK-06, TASK-07 | Done | 1e45362 | |
| WORK-18-TASK-09 | 시간표 작성 화면 버그 수정 + 프로젝트 다중 선택 | TASK-06, TASK-08 | Done | f1f5cd4 | |
| WORK-18-TASK-10 | 이전 일자 복사 + 횡스크롤 | TASK-09 | Done | — | |

## Log
- [2026-03-04] WORK-18-TASK-01 완료: Prisma 스키마 변경 (Position enum, 4 신규 모델, Member/Project 필드 추가), 마이그레이션, 시드 업데이트
- [2026-03-04] WORK-18-TASK-02 완료: shared/types/timesheet.ts, shared/constants/timesheet-utils.ts 생성, team.ts/project.ts 수정, labels.ts 확장
- [2026-03-04] WORK-18-TASK-03 + TASK-04 병렬 시작
- [2026-03-04] WORK-18-TASK-03 완료: timesheet NestJS 모듈 (CRUD + 제출 검증 6 API)
- [2026-03-04] WORK-18-TASK-04 완료: 프로젝트 생성 요청/승인 API, managerId/department/description 반영
- [2026-03-04] WORK-18-TASK-05 + TASK-06 병렬 시작
- [2026-03-04] WORK-18-TASK-06 완료: MyTimesheet.tsx 달력 그리드 작성 페이지, API/Hook, 라우트/사이드바
- [2026-03-04] WORK-18-TASK-05 완료: 취합/승인/통계/엑셀 (승인3서비스, 통계서비스, 엑셀서비스, 10 API)
- [2026-03-04] WORK-18-TASK-07 완료: 팀장/PM/관리자 프론트엔드 페이지 3개, API/Hook 확장, 사이드바 메뉴
- [2026-03-04] WORK-18-TASK-08 완료: 기존 페이지 직위/직책/책임자 반영, 프로젝트 생성 요청/승인 UI, 통합 빌드 0 에러
- [2026-03-04] **WORK-18 전체 완료** (8/8 TASK Done)
