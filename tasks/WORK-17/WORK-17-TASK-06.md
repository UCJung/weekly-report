# WORK-17-TASK-06: FE — 상수 파일 통합 + useQuery 캐시 전략 설정

## WORK
WORK-17: 코드 품질 개선 — CRITICAL/HIGH 이슈 수정

## Dependencies
- WORK-17-TASK-04 (required)

## Scope

수정 대상 이슈: #3 (CRITICAL), #7 (HIGH)

### 1. [CRITICAL #3] 상수 파일 통합

Dashboard.tsx, PartStatus.tsx, ReportConsolidation.tsx 등 여러 파일에 동일한 상수 객체가 중복 선언되어 있음.

**중복 상수 현황** (Dashboard.tsx 예시):
```typescript
const ROLE_LABEL: Record<string, string> = {
  LEADER: '팀장',
  PART_LEADER: '파트장',
  MEMBER: '팀원',
};
const STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'danger' | 'gray'> = {
  SUBMITTED: 'ok',
  DRAFT: 'warn',
  NOT_STARTED: 'gray',
};
const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: '제출완료',
  DRAFT: '임시저장',
  NOT_STARTED: '미작성',
};
```

**생성할 파일**: `packages/frontend/src/constants/labels.ts`

내용:
```typescript
export const ROLE_LABEL: Record<string, string> = {
  ADMIN: '관리자',
  LEADER: '팀장',
  PART_LEADER: '파트장',
  MEMBER: '팀원',
};

export const REPORT_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: '제출완료',
  DRAFT: '임시저장',
  NOT_STARTED: '미작성',
};

export const REPORT_STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'danger' | 'gray'> = {
  SUBMITTED: 'ok',
  DRAFT: 'warn',
  NOT_STARTED: 'gray',
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
};
```

### 2. [HIGH #7] useQuery staleTime 설정

현재 모든 useQuery 훅에 staleTime 미설정 → 매 포커스마다 불필요한 재요청 발생.

**설정 기준**:
| 데이터 유형 | staleTime | 근거 |
|------------|-----------|------|
| 주간업무, 업무항목 | 30_000 (30초) | 실시간성 중요, 자동저장 있음 |
| 팀, 파트, 프로젝트 | 60_000 (1분) | 변경 빈도 낮음 |
| Admin 데이터 | 30_000 (30초) | 관리 화면 적당한 신선도 |

**수정 대상 훅**:
- useWeeklyReport.ts: useMyWeeklyReport → staleTime: 30_000
- useWorkItems.ts: useWorkItems → staleTime: 30_000
- useTeamMembers.ts: useTeamMembers → staleTime: 60_000
- useProjects.ts: useProjects, useTeamProjects → staleTime: 60_000
- useTeams.ts: useTeams, useMyTeams → staleTime: 60_000
- useAdmin.ts: useAdminAccounts, useAdminTeams, useAdminProjects → staleTime: 30_000
- 페이지 내 인라인 useQuery (Dashboard.tsx, PartStatus.tsx, ReportConsolidation.tsx 등): 동일 기준 적용

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/frontend/src/constants/labels.ts` | CREATE | 공통 라벨 상수 |
| `packages/frontend/src/pages/Dashboard.tsx` | MODIFY | 인라인 상수 제거, import + staleTime |
| `packages/frontend/src/pages/MyWeeklyReport.tsx` | MODIFY | 인라인 상수 제거, import |
| `packages/frontend/src/pages/PartStatus.tsx` | MODIFY | 인라인 상수 제거, import + staleTime |
| `packages/frontend/src/pages/ReportConsolidation.tsx` | MODIFY | 인라인 상수 제거, import + staleTime |
| `packages/frontend/src/hooks/useWeeklyReport.ts` | MODIFY | staleTime: 30_000 추가 |
| `packages/frontend/src/hooks/useWorkItems.ts` | MODIFY | staleTime: 30_000 추가 |
| `packages/frontend/src/hooks/useTeamMembers.ts` | MODIFY | staleTime: 60_000 추가 |
| `packages/frontend/src/hooks/useProjects.ts` | MODIFY | staleTime: 60_000 추가 |
| `packages/frontend/src/hooks/useTeams.ts` | MODIFY | staleTime: 60_000 추가 |
| `packages/frontend/src/hooks/useAdmin.ts` | MODIFY | staleTime: 30_000 추가 |

## Acceptance Criteria

- [ ] src/constants/labels.ts 파일 존재
- [ ] ROLE_LABEL, REPORT_STATUS_LABEL, REPORT_STATUS_VARIANT export 확인
- [ ] Dashboard.tsx에 const ROLE_LABEL 인라인 선언 없음
- [ ] PartStatus.tsx에 const ROLE_LABEL 인라인 선언 없음
- [ ] 모든 useQuery 훅 파일에 staleTime 옵션 존재
- [ ] 프론트엔드 빌드 오류 0건

## Verify

```
ls packages/frontend/src/constants/labels.ts && echo "OK - file exists"
grep -rn "staleTime" packages/frontend/src/hooks/ | wc -l
grep -n "const ROLE_LABEL\|const STATUS_LABEL\|const STATUS_VARIANT" \
  packages/frontend/src/pages/Dashboard.tsx \
  packages/frontend/src/pages/PartStatus.tsx \
  packages/frontend/src/pages/ReportConsolidation.tsx || echo "OK - no inline constants"
cd packages/frontend && bun run build 2>&1 | tail -20
```
