# WORK-18-TASK-06 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

팀원이 월별 근무시간표를 작성하는 프론트엔드 페이지와 API/Hook을 구현했다. 타임시트 API 클라이언트(`timesheet.api.ts`), TanStack Query 훅(`useTimesheet.ts`), MyTimesheet 달력 그리드 페이지를 새로 생성했고, App.tsx 라우트와 Sidebar 메뉴를 추가했다.

---

## 2. 완료 기준 달성 현황

| 완료 기준 | 상태 |
|-----------|------|
| TASK MD 체크리스트 전 항목 완료 | ✅ |
| API 클라이언트 구현 (6개 함수) | ✅ |
| TanStack Query 훅 구현 (5개) | ✅ |
| MyTimesheet 페이지 구현 | ✅ |
| 라우팅 추가 (`/timesheet`) | ✅ |
| 사이드바 메뉴 추가 (Clock 아이콘) | ✅ |
| 빌드 오류 0건 | ✅ (프론트엔드) |
| 린트 오류 0건 | ✅ (신규 파일 오류 없음) |
| HEX 하드코딩 없음 (CSS 변수 사용) | ✅ |
| `teamStore.currentTeamId` 사용 | ✅ |
| staleTime 설정 (30s) | ✅ |

---

## 3. 체크리스트 완료 현황

### 2.1 API 클라이언트

| 항목 | 상태 |
|------|------|
| `createTimesheet(yearMonth, teamId)` | ✅ |
| `getMyTimesheet(yearMonth, teamId)` | ✅ |
| `getTimesheetById(id)` | ✅ |
| `saveEntry(entryId, data)` | ✅ |
| `batchSaveEntries(entries)` | ✅ |
| `submitTimesheet(id)` | ✅ |

### 2.2 TanStack Query 훅

| 항목 | 상태 |
|------|------|
| `useMyTimesheet(yearMonth, teamId)` — staleTime: 30s | ✅ |
| `useCreateTimesheet()` — 시간표 생성 mutation | ✅ |
| `useSaveEntry()` — 엔트리 저장 mutation | ✅ |
| `useBatchSaveEntries()` — 배치 저장 mutation | ✅ |
| `useSubmitTimesheet()` — 제출 mutation | ✅ |

### 2.3 MyTimesheet.tsx 페이지

| 항목 | 상태 |
|------|------|
| 월 선택 UI (이전/다음 월 탐색, 현재 월 기본값) | ✅ |
| 시간표 자동 생성 (해당 월 처음 접근 시) | ✅ |
| 달력 그리드 렌더링 (날짜/요일/근태/프로젝트열/합계) | ✅ |
| 주말 행 회색 배경 (`var(--row-alt)`) | ✅ |
| 근태 선택 드롭다운 (ATTENDANCE_LABEL 사용) | ✅ |
| 프로젝트별 투입시간 입력 (0.5 단위) | ✅ |
| 프로젝트별 업무방식 선택 (WORK_TYPE_LABEL 사용) | ✅ |
| 프로젝트 추가/제거 버튼 | ✅ |
| 일별 합계 실시간 표시 + 검증 표시 | ✅ |
| 월간 총계 표시 | ✅ |
| 자동저장 (debounce 500ms) | ✅ |
| 제출 버튼 + 검증 오류 표시 | ✅ |
| 제출 후 읽기 전용 모드 | ✅ |

### 2.4 라우팅 + 사이드바

| 항목 | 상태 |
|------|------|
| `App.tsx`: `/timesheet` → MyTimesheet 라우트 추가 | ✅ |
| `Sidebar.tsx`: "근무시간표" 메뉴 추가 (Clock 아이콘, 전체 역할) | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — 백엔드 빌드 오류 (기존 이슈)

**증상**: `packages/backend/src/timesheet/timesheet-export.service.ts`에서 14개 TypeScript 오류 발생
**원인**: 이전 TASK(WORK-18 TASK-03 이전)에서 생성된 `timesheet-export.service.ts` 파일이 Prisma include 없이 관계 필드(`entries`, `approvals`, `team`, `member`)에 직접 접근
**수정**: 이 파일은 WORK-18-TASK-06 범위 밖의 파일로, TASK-06 변경사항과 무관한 pre-existing 오류임. 프론트엔드 빌드는 정상 통과 (`bun run build` 기준 프론트엔드 패키지 성공)

---

## 5. 최종 검증 결과

### 프론트엔드 빌드

```
$ tsc -b && vite build
vite v6.4.1 building for production...
transforming...
✓ 1762 modules transformed.
dist/index.html                   0.54 kB │ gzip:   0.36 kB
dist/assets/index-B6S_2Pqz.css  25.21 kB │ gzip:   5.99 kB
dist/assets/index-QORsqrOs.js  667.52 kB │ gzip: 200.55 kB
✓ built in 19.39s
```

### 프론트엔드 린트

```
✖ 7 problems (0 errors, 7 warnings)
```
7개 warnings 모두 기존 파일의 pre-existing 경고이며, TASK-06 신규 파일은 오류/경고 0건.

### 수동 확인 필요

- [ ] `/timesheet` 페이지 접속 → 달력 그리드 렌더링 확인
- [ ] 월 탐색 (이전/다음) → 달력 날짜 변경 확인
- [ ] 근태 변경 → 합계 색상 실시간 반영 확인 (8h=green, 불일치=red)
- [ ] 프로젝트 추가/제거 → 컬럼 동적 변경 확인
- [ ] 투입시간 입력 → debounce 500ms 후 자동저장 확인
- [ ] 제출 버튼 → 검증 통과 후 읽기 전용 전환 확인
- [ ] 사이드바 "근무시간표" 메뉴 → `/timesheet` 라우팅 확인

---

## 6. 후속 TASK 유의사항

- 백엔드 `timesheet-export.service.ts` 빌드 오류는 별도 TASK에서 수정 필요
- `useCreateTimesheet` 자동 생성 로직: `timesheet === null`일 때만 POST 호출하므로, 백엔드 GET 응답이 `{ data: null }`을 반환할 때 정상 동작함
- `useSaveEntry` mutation은 `entryId`가 있을 때만 호출됨 — 백엔드가 시간표 생성 시 엔트리를 자동 생성해야 하며, 엔트리가 없는 날짜는 저장이 스킵됨

---

## 7. 산출물 목록

### 신규 생성 파일

| 파일 | 설명 |
|------|------|
| `packages/frontend/src/api/timesheet.api.ts` | 시간표 CRUD API 클라이언트 (Axios 기반) |
| `packages/frontend/src/hooks/useTimesheet.ts` | TanStack Query 훅 5개 |
| `packages/frontend/src/pages/MyTimesheet.tsx` | 달력 그리드 작성 화면 (달력 그리드 + 자동저장 + 제출) |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/frontend/src/App.tsx` | `/timesheet` 라우트 추가 + `MyTimesheet` import |
| `packages/frontend/src/components/layout/Sidebar.tsx` | `Clock` 아이콘 import + "근무시간표" 메뉴 항목 추가 |
