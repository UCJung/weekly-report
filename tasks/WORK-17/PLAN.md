# WORK-17: 코드 품질 개선 — CRITICAL/HIGH 이슈 수정

> Created: 2026-03-03
> Project: 주간업무보고 시스템
> Tech Stack: NestJS 11 + Prisma 6 / React 18 + TanStack Query v5 / Turborepo
> Status: PLANNED
> Tasks: 7

## Goal

코드 품질 검증에서 발견된 CRITICAL 3건, HIGH 8건(총 11건, 대형 컴포넌트 분리 제외)을
체계적으로 수정한다. 공유 타입 정합성 확보 → 백엔드 개선 → 프론트엔드 개선 →
DB 인덱스 추가 순으로 진행하여 각 단계가 다음 단계에 필요한 기반을 제공한다.

---
## 수정 대상 이슈 목록

| 번호 | 심각도 | 위치 | 내용 | 담당 TASK |
|------|--------|------|------|-----------|
| #1 | CRITICAL | BE admin.service.ts:160 | 'password123' 하드코딩 | TASK-02 |
| #2 | CRITICAL | FE 4개 파일 | 주차 유틸 함수 중복 | TASK-04 |
| #3 | CRITICAL | FE 3개 이상 파일 | 상태/역할 상수 중복 | TASK-06 |
| #4 | HIGH | BE ListAccountsDto/ListTeamsDto | PaginationDto 미상속 | TASK-02 |
| #5 | HIGH | BE admin.service, part-summary.service | any 타입 사용 | TASK-02/03 |
| #6 | HIGH | BE part-summary.service.ts | 동일 쿼리 패턴 5회 반복 | TASK-03 |
| #7 | HIGH | FE 모든 useQuery 훅 | staleTime/gcTime 미설정 | TASK-06 |
| #8 | HIGH | — | 대형 컴포넌트 분리 | 이번 WORK 제외 |
| #9 | HIGH | shared/types/team.ts | MemberRole에 ADMIN 누락 | TASK-01 |
| #10 | HIGH | shared/types/project.ts | ProjectStatus 스키마 불일치 | TASK-01 |
| #11 | HIGH | useTeams.ts, team-join.service.ts | 필드명 불일치 | TASK-03 |
| #12 | HIGH | schema.prisma | 주요 인덱스 누락 | TASK-05 |

---

## Task Dependency Graph

```
TASK-01 (공유 타입 정합)
    |
    +---> TASK-02 (BE: 보안/페이지네이션/any 타입)
    |         |
    |         +---> TASK-03 (BE: part-summary 리팩토링 + 필드명 정규화)
    |                   |
    |                   +---> TASK-05 (BE: DB 인덱스 마이그레이션)
    |                             |
    |                             +---> TASK-07 (통합 검증)
    |
    +---> TASK-04 (FE: 주차 유틸 중복 제거)
              |
              +---> TASK-06 (FE: 상수 통합 + useQuery 캐시 전략)
                        |
                        +---> TASK-07 (통합 검증)
```

---

## Tasks

### WORK-17-TASK-01: 공유 타입 정합성 확보 (shared/types)

- **Depends on**: (없음)
- **Scope**:
  - `packages/shared/types/team.ts` — MemberRole에 'ADMIN' 추가 (Prisma MemberRole enum과 일치)
  - `packages/shared/types/project.ts` — ProjectStatus를 'ACTIVE' | 'INACTIVE'로 수정 (HOLD/COMPLETED 제거)
  - 타입 변경이 프론트엔드에 미치는 파일 grep 전수 확인 후 일괄 수정
- **Files**:
  - `packages/shared/types/team.ts` — MODIFY
  - `packages/shared/types/project.ts` — MODIFY
  - `packages/frontend/src/pages/*.tsx` — MODIFY (영향 파일)
- **Acceptance Criteria**:
  - [ ] MemberRole이 'ADMIN' | 'LEADER' | 'PART_LEADER' | 'MEMBER' 4종 포함
  - [ ] ProjectStatus가 Prisma enum과 동일 (ACTIVE, INACTIVE)
  - [ ] 프론트엔드 TypeScript 빌드 오류 0건
- **Verify**:
  ```
  cd packages/frontend && bun run build 2>&1 | tail -20
  cd packages/shared && bunx tsc --noEmit 2>&1
  ```

---

### WORK-17-TASK-02: BE — 보안/페이지네이션 DTO/any 타입 개선

- **Depends on**: WORK-17-TASK-01
- **Scope**:
  1. [CRITICAL #1] admin.service.ts:160 하드코딩 'password123' 제거 — ConfigService를 AdminModule에 주입, 환경변수 DEFAULT_PASSWORD 사용
  2. [HIGH #4] ListAccountsDto → PaginationDto 상속, 직접 선언한 page/limit 필드 제거
  3. [HIGH #4] ListTeamsDto (admin dto) → PaginationDto 상속, 직접 선언한 page/limit 필드 제거
  4. [HIGH #5] admin.service.ts의 `where: any` → Prisma.MemberWhereInput 타입 적용
- **Files**:
  - `packages/backend/src/admin/admin.service.ts` — MODIFY
  - `packages/backend/src/admin/admin.module.ts` — MODIFY (ConfigModule 추가)
  - `packages/backend/src/admin/dto/list-accounts.dto.ts` — MODIFY
  - `packages/backend/src/admin/dto/list-teams.dto.ts` — MODIFY
  - `packages/backend/.env.example` — MODIFY (DEFAULT_PASSWORD 항목 추가)
- **Acceptance Criteria**:
  - [ ] admin.service.ts에 'password123' 문자열 리터럴 없음
  - [ ] ListAccountsDto, ListTeamsDto가 PaginationDto extends
  - [ ] admin.service.ts에서 any 타입 사용 0건
  - [ ] 백엔드 빌드 및 단위 테스트 통과
- **Verify**:
  ```
  grep -r "password123" packages/backend/src/
  cd packages/backend && bun run build 2>&1 | tail -20
  cd packages/backend && bun run test 2>&1 | tail -30
  ```

---

### WORK-17-TASK-03: BE — part-summary 공통 메서드 추출 + API 필드명 정규화

- **Depends on**: WORK-17-TASK-02
- **Scope**:
  1. [HIGH #6] part-summary.service.ts 반복 쿼리 패턴을 private 헬퍼 메서드로 추출 — WeeklyReport+member+workItems+project include 패턴, 예: findReportsWithWorkItems(partId, weekStart)
  2. [HIGH #11] team-join.service.ts listTeams 응답 필드명 정규화 — isJoined → isMember
  3. [HIGH #11] 프론트엔드 useTeams.ts 방어적 매핑 제거 — t.isMember ?? t.isJoined → t.isMember, t.teamId ?? t.id → t.id
- **Files**:
  - `packages/backend/src/weekly-report/part-summary.service.ts` — MODIFY
  - `packages/backend/src/team/team-join.service.ts` — MODIFY
  - `packages/frontend/src/hooks/useTeams.ts` — MODIFY
- **Acceptance Criteria**:
  - [ ] part-summary.service.ts에서 동일 include 패턴이 private 메서드 1회 정의
  - [ ] team-join.service.ts 응답에 isMember 존재, isJoined 없음
  - [ ] useTeams.ts에 isJoined, teamId ?? 방어 코드 없음
  - [ ] 백엔드 및 프론트엔드 빌드 통과
- **Verify**:
  ```
  grep -n "isJoined" packages/backend/src/team/team-join.service.ts || echo "OK"
  grep -n "isJoined" packages/frontend/src/hooks/useTeams.ts || echo "OK"
  cd packages/backend && bun run build 2>&1 | tail -10
  cd packages/frontend && bun run build 2>&1 | tail -10
  ```

---

### WORK-17-TASK-04: FE — 주차 유틸 중복 제거 (4개 파일 -> shared import)

- **Depends on**: WORK-17-TASK-01
- **Scope**:
  [CRITICAL #2] 4개 페이지 파일의 인라인 주차 유틸 함수를 shared import로 교체.
  대상: Dashboard.tsx(12-44줄), MyWeeklyReport.tsx(25-57줄), PartStatus.tsx(19-51줄), ReportConsolidation.tsx(13-45줄).
  교체 함수: getWeekLabel, addWeeks, formatWeekLabel.
  - addWeeks는 shared week-utils.ts에 미존재하므로 export 추가 필요
  - shared 패키지를 프론트엔드에서 import 가능한지 workspace 설정 확인
- **Files**:
  - `packages/shared/constants/week-utils.ts` — MODIFY (addWeeks export 추가)
  - `packages/frontend/src/pages/Dashboard.tsx` — MODIFY
  - `packages/frontend/src/pages/MyWeeklyReport.tsx` — MODIFY
  - `packages/frontend/src/pages/PartStatus.tsx` — MODIFY
  - `packages/frontend/src/pages/ReportConsolidation.tsx` — MODIFY
  - `packages/frontend/tsconfig.json` / `vite.config.ts` — MODIFY (경로 설정 필요 시)
- **Acceptance Criteria**:
  - [ ] 4개 파일에서 getWeekLabel/addWeeks/formatWeekLabel function 인라인 선언 없음
  - [ ] 4개 파일 모두 shared에서 import
  - [ ] addWeeks 함수가 week-utils.ts에 export됨
  - [ ] 프론트엔드 빌드 통과
- **Verify**:
  ```
  grep -rn "function getWeekLabel" packages/frontend/src/pages/Dashboard.tsx packages/frontend/src/pages/MyWeeklyReport.tsx packages/frontend/src/pages/PartStatus.tsx packages/frontend/src/pages/ReportConsolidation.tsx || echo "OK"
  cd packages/frontend && bun run build 2>&1 | tail -20
  ```

---

### WORK-17-TASK-05: BE — DB 인덱스 마이그레이션

- **Depends on**: WORK-17-TASK-03
- **Scope**:
  [HIGH #12] schema.prisma에 쿼리 성능 개선용 @@index 추가:
  - WorkItem: @@index([weeklyReportId]), @@index([projectId])
  - WeeklyReport: @@index([weekStart])
  - TeamMembership: @@index([memberId]), @@index([teamId])
  - PartSummary: @@index([weekStart])
  - SummaryWorkItem: @@index([partSummaryId])
  - TeamJoinRequest: @@index([memberId]), @@index([teamId])
  bunx prisma migrate dev 실행. Docker DB 미구동 시 prisma validate로 스키마 검증만 수행.
- **Files**:
  - `packages/backend/prisma/schema.prisma` — MODIFY
  - `packages/backend/prisma/migrations/YYYYMMDDHHMMSS_add_performance_indexes/migration.sql` — CREATE
- **Acceptance Criteria**:
  - [ ] schema.prisma에 @@index 선언 최소 9개 추가
  - [ ] bunx prisma validate 성공
  - [ ] 백엔드 빌드 통과
- **Verify**:
  ```
  cd packages/backend && bunx prisma validate 2>&1
  grep -c "@@index" packages/backend/prisma/schema.prisma
  cd packages/backend && bun run build 2>&1 | tail -10
  ```

---

### WORK-17-TASK-06: FE — 상수 파일 통합 + useQuery 캐시 전략 설정

- **Depends on**: WORK-17-TASK-04
- **Scope**:
  1. [CRITICAL #3] 반복 상수 통합
     — packages/frontend/src/constants/labels.ts 생성
     — ROLE_LABEL, STATUS_LABEL, STATUS_VARIANT export
     — Dashboard.tsx, PartStatus.tsx, ReportConsolidation.tsx 등 인라인 상수 제거 후 import
  2. [HIGH #7] 모든 useQuery 훅 staleTime 설정
     — useWeeklyReport.ts, useWorkItems.ts: staleTime: 30_000
     — useProjects.ts, useTeams.ts, useTeamMembers.ts: staleTime: 60_000
     — useAdmin.ts: staleTime: 30_000
     — 페이지 내 인라인 useQuery도 동일 기준 적용
- **Files**:
  - `packages/frontend/src/constants/labels.ts` — CREATE
  - `packages/frontend/src/pages/Dashboard.tsx` — MODIFY
  - `packages/frontend/src/pages/MyWeeklyReport.tsx` — MODIFY
  - `packages/frontend/src/pages/PartStatus.tsx` — MODIFY
  - `packages/frontend/src/pages/ReportConsolidation.tsx` — MODIFY
  - `packages/frontend/src/hooks/useWeeklyReport.ts` — MODIFY
  - `packages/frontend/src/hooks/useWorkItems.ts` — MODIFY
  - `packages/frontend/src/hooks/useTeamMembers.ts` — MODIFY
  - `packages/frontend/src/hooks/useProjects.ts` — MODIFY
  - `packages/frontend/src/hooks/useTeams.ts` — MODIFY
  - `packages/frontend/src/hooks/useAdmin.ts` — MODIFY
- **Acceptance Criteria**:
  - [ ] src/constants/labels.ts 파일 존재, ROLE_LABEL/STATUS_LABEL/STATUS_VARIANT export
  - [ ] 4개 페이지에서 ROLE_LABEL/STATUS 인라인 선언 없음
  - [ ] 모든 useQuery 훅에 staleTime 옵션 존재
  - [ ] 프론트엔드 빌드 통과
- **Verify**:
  ```
  ls packages/frontend/src/constants/labels.ts
  grep -rn "staleTime" packages/frontend/src/hooks/
  grep -n "const ROLE_LABEL\|const STATUS_LABEL\|const STATUS_VARIANT" packages/frontend/src/pages/Dashboard.tsx packages/frontend/src/pages/PartStatus.tsx || echo "OK"
  cd packages/frontend && bun run build 2>&1 | tail -20
  ```

---

### WORK-17-TASK-07: 통합 검증 + PROGRESS 업데이트

- **Depends on**: WORK-17-TASK-05, WORK-17-TASK-06
- **Scope**:
  - 전체 모노레포 빌드(bun run build) 최종 통과 확인
  - 백엔드 전체 단위 테스트 통과 확인
  - CRITICAL 3건, HIGH 8건 수정 사항 재검증 (grep/빌드로 확인)
  - tasks/PROGRESS.md에 WORK-17 완료 현황 갱신
  - tasks/WORK-17/WORK-17-수행결과.md 작성 (CLAUDE.md 섹션 14 템플릿 준수)
- **Files**:
  - `tasks/PROGRESS.md` — MODIFY
  - `tasks/WORK-17/WORK-17-수행결과.md` — CREATE
- **Acceptance Criteria**:
  - [ ] bun run build (루트) 성공
  - [ ] bun run test (루트) 전체 통과
  - [ ] grep "password123" packages/backend/src/ 결과 없음
  - [ ] grep "function getWeekLabel" packages/frontend/src/pages/ 결과 없음
  - [ ] grep "isJoined" packages/frontend/src/hooks/useTeams.ts 결과 없음
  - [ ] PROGRESS.md WORK-17 항목 갱신 완료
- **Verify**:
  ```
  cd /c/rnd/weekly-report && bun run build 2>&1 | tail -30
  cd /c/rnd/weekly-report && bun run test 2>&1 | tail -30
  grep -r "password123" packages/backend/src/ || echo "OK - no hardcoded password"
  grep -rn "function getWeekLabel" packages/frontend/src/pages/ || echo "OK - no duplicates"
  grep -n "isJoined" packages/frontend/src/hooks/useTeams.ts || echo "OK - cleaned"
  ```

---

## 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| ProjectStatus HOLD/COMPLETED 제거로 프론트엔드 매핑 누락 | 빌드/런타임 오류 | TASK-01에서 grep으로 영향 파일 사전 확인 후 일괄 수정 |
| isJoined → isMember 변경 시 다른 페이지 참조 누락 | 런타임 undefined | TASK-03에서 전체 파일 grep 스캔 후 수정 |
| addWeeks 함수 shared 이식 시 인라인 구현과 동작 차이 | 주차 계산 오류 | 기존 인라인 코드와 동일 로직 이식, 출력값 동등성 확인 |
| DB 인덱스 마이그레이션 실패 (Docker DB 미구동) | 로컬 DB 불일치 | Docker 상태 확인 후 구동, 미구동 시 prisma validate만 수행 |
| PaginationDto 상속 시 @Max(100) 제약이 기존 limit 요청 차단 | API 호환성 저하 | PaginationDto의 Max 값 확인 후 필요 시 제약 상향 조정 |
