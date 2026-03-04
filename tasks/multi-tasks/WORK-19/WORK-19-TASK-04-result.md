# WORK-19-TASK-04 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요
대시보드에 주간업무보고/근무시간표 뷰 토글 추가, 각 뷰별 요약카드 + 카드 클릭 필터링 구현.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| 상단 배너 탭 토글 (기본값: 주간업무보고) | ✅ |
| 주간업무보고 선택 시 주차 선택 + 기존 콘텐츠 | ✅ |
| 타이틀: "팀원 작성현황 - 주간업무보고" | ✅ |
| 컬럼 순서: 성명, 직급, 파트, 직책, 이하 기존 동일 | ✅ |
| 근무시간표 선택 시 월 선택 + 시간표 콘텐츠 | ✅ |
| 집계카드: 전체, 제출, 미제출, 작성중, 미작성 — 5개 카드 | ✅ |
| 타이틀: "팀원 작성현황 - 근무시간표" | ✅ |
| 목록: 팀 근무시간표 검토의 팀원제출현황과 동일 표시 | ✅ |
| 카드 클릭 → 목록 필터링 (선택/해제 토글) | ✅ |
| 빌드 0 에러 | ✅ |

---

## 3. 체크리스트 완료 현황

| # | 항목 | 상태 |
|---|------|------|
| 1 | 뷰 토글 (주간업무보고/근무시간표) | ✅ |
| 2 | 주간업무보고 뷰: 주차 네비게이션 + 4개 카드 + 팀원 테이블 | ✅ |
| 3 | 근무시간표 뷰: 월 네비게이션 + 5개 카드 + 팀원 테이블 | ✅ |
| 4 | SummaryCard 컴포넌트 highlighted + onClick 확장 | ✅ |
| 5 | 카드 클릭 필터링 (토글 방식) | ✅ |
| 6 | 백엔드 getTeamWeeklyOverview 파트/직책 정보 추가 | ✅ |
| 7 | 프론트 MemberWeeklyStatus 인터페이스 확장 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — SummaryCard에 highlighted 프로퍼티 없음
**증상**: TS2322 — Property 'highlighted' does not exist on type 'SummaryCardProps'
**원인**: SummaryCard 컴포넌트에 highlighted, onClick 프로퍼티가 정의되지 않음
**수정**: `SummaryCard.tsx`에 `highlighted?: boolean`, `onClick?: () => void` 프로퍼티 추가, ring-2 스타일 적용

---

## 5. 최종 검증 결과

```
$ bun run build
 Tasks:    3 successful, 3 total
 Time:    23.386s
```

빌드 성공, 에러 0건.

### 수동 확인 필요
- 뷰 토글 전환 시 카드/테이블 정상 전환 확인
- 카드 클릭 필터링 동작 (선택/해제 토글) 확인
- 월 네비게이션 시 근무시간표 데이터 로딩 확인
- SummaryCard highlighted 상태 ring 스타일 확인

---

## 6. 후속 TASK 유의사항
없음. WORK-19 전체 TASK 완료.

---

## 7. 산출물 목록

| 구분 | 파일 |
|------|------|
| 수정 | `packages/frontend/src/pages/Dashboard.tsx` |
| 수정 | `packages/frontend/src/components/ui/SummaryCard.tsx` |
| 수정 | `packages/frontend/src/api/part.api.ts` |
| 수정 | `packages/backend/src/weekly-report/part-summary.service.ts` |
| 수정 | `tasks/multi-tasks/WORK-19/PROGRESS.md` |
| 신규 | `tasks/multi-tasks/WORK-19/WORK-19-TASK-04-result.md` |
