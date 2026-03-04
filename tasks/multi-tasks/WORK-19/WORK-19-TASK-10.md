# WORK-19-TASK-10: 관리자 근무시간표 관리 팀단위 표시로 개선

> **Phase:** 기능개선
> **선행 TASK:** 없음
> **목표:** 관리자 근무시간표 관리 화면을 구성원 단위 → 팀 단위로 변경

## 요청사항
- 요약현황: 전체팀, 팀장 승인완료건, 전체 프로젝트 수, 프로젝트 승인완료건
- 팀별 제출/승인 현황: 전체 인원 기준 팀장 승인 인원 100%면 승인 완료
  - "승인인원/전체인원" + 진행중 | 완료 로 표시

---

## Step 1 — 계획서

### 1.1 현황 분석

**현재 요약 카드**: 전체 팀원(명), 제출완료(명), 팀장 승인(명), 최종 승인(명)
**현재 테이블**: 팀 이름, 전체, 미작성, 작성중, 제출, 팀장승인, 최종승인, 진행률 — 구성원 단위

**변경 후 요약 카드**: 전체 팀, 팀장 승인 완료 팀, 전체 프로젝트, PM 승인 완료 프로젝트
**변경 후 테이블**: 팀 이름, 전체 인원, 팀장 승인, 승인 상태 — 팀 단위
  - 팀장 승인: "승인인원/전체인원"
  - 승인 상태: 100% → 완료(ok), 아니면 진행중(warn)

### 1.2 구현 방안

1. 백엔드 `getAdminOverview` 응답에 프로젝트 승인 정보 추가 (전체 프로젝트 수, PM 승인 완료 프로젝트 수)
2. 프론트 `AdminOverviewData` 인터페이스에 프로젝트 승인 필드 추가
3. 프론트 `AdminTimesheetOverview` 요약 카드 및 테이블 UI 전면 변경

### 1.3 산출물 목록

| 구분 | 산출물 |
|------|--------|
| 수정 | `packages/backend/src/timesheet/timesheet-stats.service.ts` — `getAdminOverview`에 프로젝트 승인 정보 추가 |
| 수정 | `packages/frontend/src/api/timesheet.api.ts` — `AdminOverviewData` 인터페이스 확장 |
| 수정 | `packages/frontend/src/pages/admin/AdminTimesheetOverview.tsx` — UI 전면 변경 |

---

## Step 2 — 체크리스트

### 2.1 백엔드
- [ ] `getAdminOverview` 응답에 `totalProjects`, `approvedProjects` 추가
- [ ] 프로젝트별 PM 승인 여부 조회 (TimesheetApproval approvalType=PROJECT_MANAGER)

### 2.2 프론트엔드
- [ ] `AdminOverviewData`에 `totalProjects`, `approvedProjects` 필드 추가
- [ ] 요약 카드: 전체 팀 / 팀장 승인 완료 팀 / 전체 프로젝트 / PM 승인 완료 프로젝트
- [ ] 테이블: 팀 이름, 전체 인원, 팀장 승인(승인인원/전체인원), 승인 상태(완료/진행중)

### 2.3 검증
- [ ] 빌드 0 에러
