# WORK-17-TASK-04: FE — 주차 유틸 중복 제거 (4개 파일 -> shared import)

## WORK
WORK-17: 코드 품질 개선 — CRITICAL/HIGH 이슈 수정

## Dependencies
- WORK-17-TASK-01 (shared 타입 정합 완료 필요)

## Scope

수정 대상 이슈: #2 (CRITICAL)

4개 페이지 파일에 각각 복사된 인라인 주차 유틸 함수를
`packages/shared/constants/week-utils.ts`의 export 함수로 교체한다.

### 중복 현황

| 파일 | 인라인 함수 | 위치 |
|------|------------|------|
| Dashboard.tsx | getWeekLabel, addWeeks, formatWeekLabel | 12-44줄 |
| MyWeeklyReport.tsx | getWeekLabel, addWeeks, formatWeekLabel | 25-57줄 |
| PartStatus.tsx | getWeekLabel, addWeeks, formatWeekLabel | 19-51줄 |
| ReportConsolidation.tsx | getWeekLabel, addWeeks, formatWeekLabel | 13-45줄 |

### 작업 순서

1. shared week-utils.ts에 `addWeeks(weekLabel: string, n: number): string` 추가
   - 인라인 구현과 동일한 로직 (jan4 기반 ISO 주차 계산)
   - export 키워드 추가

2. 프론트엔드에서 shared import 경로 확인
   - `packages/frontend/package.json`에서 shared 패키지 의존성 확인
   - import 경로: `'@weekly-report/shared/constants/week-utils'` 또는 상대경로

3. 4개 파일에서 인라인 함수 블록 제거 후 import 구문 추가

### addWeeks 구현 (shared에 추가)

```typescript
export function addWeeks(weekLabel: string, n: number): string {
  const match = weekLabel.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekLabel;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day + 1));
  const monday = new Date(week1Monday.getTime() + (week - 1 + n) * 7 * 86400000);
  return getWeekLabel(monday);
}
```

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/shared/constants/week-utils.ts` | MODIFY | addWeeks 함수 export 추가 |
| `packages/frontend/src/pages/Dashboard.tsx` | MODIFY | 인라인 함수 제거, shared import |
| `packages/frontend/src/pages/MyWeeklyReport.tsx` | MODIFY | 인라인 함수 제거, shared import |
| `packages/frontend/src/pages/PartStatus.tsx` | MODIFY | 인라인 함수 제거, shared import |
| `packages/frontend/src/pages/ReportConsolidation.tsx` | MODIFY | 인라인 함수 제거, shared import |
| `packages/frontend/tsconfig.json` | MODIFY | paths 설정 추가 (필요 시) |
| `packages/frontend/vite.config.ts` | MODIFY | alias 추가 (필요 시) |

## Acceptance Criteria

- [ ] week-utils.ts에 addWeeks 함수 export
- [ ] Dashboard.tsx에 getWeekLabel/addWeeks/formatWeekLabel function 선언 없음
- [ ] MyWeeklyReport.tsx에 getWeekLabel/addWeeks/formatWeekLabel function 선언 없음
- [ ] PartStatus.tsx에 getWeekLabel/addWeeks/formatWeekLabel function 선언 없음
- [ ] ReportConsolidation.tsx에 getWeekLabel/addWeeks/formatWeekLabel function 선언 없음
- [ ] 4개 파일 모두 shared에서 import 구문 확인
- [ ] 프론트엔드 빌드 오류 0건

## Verify

```
grep -n "function getWeekLabel\|function addWeeks\|function formatWeekLabel" \
  packages/frontend/src/pages/Dashboard.tsx \
  packages/frontend/src/pages/MyWeeklyReport.tsx \
  packages/frontend/src/pages/PartStatus.tsx \
  packages/frontend/src/pages/ReportConsolidation.tsx || echo "OK - no inline functions"
grep -n "addWeeks" packages/shared/constants/week-utils.ts
cd packages/frontend && bun run build 2>&1 | tail -20
```
