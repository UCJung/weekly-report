# WORK-10: 업무현황 페이지 개편 (파트업무현황 → 업무현황)

> Created: 2026-03-02
> Project: 주간업무보고 시스템
> Tech Stack: NestJS 11 + Prisma 6 (Backend) / React 18 + TanStack Query v5 (Frontend)
> Status: PLANNED
> Tasks: 4

---

## 개요

"파트업무현황" 페이지를 "업무현황"으로 개명하고, 기능을 전면 개편한다.
주요 변경: 제목/메뉴명 변경, 필터를 두 그룹으로 분리(파트→팀원 종속 필터 | 프로젝트 독립 필터),
두 그룹의 조합으로 목록 필터링, 뷰 모드(프로젝트별/팀원별) 추가,
상태 컬럼 제거, 프로젝트명+코드 통합 표시, Project.sortOrder 기반 정렬 도입.

---

## 현재 상태 분석

### PartStatus.tsx (packages/frontend/src/pages/PartStatus.tsx)
- `user.partId`를 고정 사용 → 자신의 파트 데이터만 조회 가능 (파트 선택 불가)
- 필터: 팀원 / 프로젝트 / 상태 3개 (파트 선택 없음)
- 테이블 컬럼: 성명 | 상태 | 프로젝트 | 코드 | 진행업무 | 예정업무 | 비고 (상태 컬럼 별도 존재, 프로젝트/코드 분리)
- 뷰 모드 선택 없음 (팀원별 rowspan 고정)
- partApi.getPartWeeklyStatus(partId, week) 단일 파트만 조회

### Sidebar.tsx (packages/frontend/src/components/layout/Sidebar.tsx)
- 메뉴 라벨: "파트 업무 현황" (line 45)
- 그룹 "파트 관리" 내 위치

### Header.tsx (packages/frontend/src/components/layout/Header.tsx)
- PAGE_TITLES['/part-status'].title = "파트 업무 현황" (line 18)
- PAGE_TITLES['/part-status'].subtitle = "파트 구성원의 이번 주 업무 현황을 확인합니다"

### part-summary.service.ts (getPartWeeklyStatus)
- member 응답에 partId/partName 없음 (id, name, role만 반환)
- 단일 partId 고정
- 팀장(LEADER)이 전체 파트 조회 시 별도 엔드포인트 없음

### schema.prisma — Project 모델
- sortOrder 필드 없음 (id, name, code, category, status, teamId만 존재)
- project.service.ts 정렬: [category asc, name asc] — sortOrder 없음

### part.api.ts (Frontend)
- MemberWeeklyStatus.member: { id, name, role } — partId/partName 없음
- getPartWeeklyStatus: 단일 partId 호출

---

## 변경 사항 요약

### 백엔드
1. **Project 모델에 sortOrder 필드 추가** (Prisma 마이그레이션)
2. **ProjectService.findAll 정렬 변경**: [sortOrder asc, category asc, name asc]
3. **getPartWeeklyStatus 응답 확장**: member에 partId, partName 포함
4. **팀장용 전체 파트 조회 지원**: teamId + week 파라미터로 전체 팀원 조회 엔드포인트 추가 (또는 partId=all 지원)

### 프론트엔드
1. **Sidebar 메뉴명**: "파트 업무 현황" → "업무현황"
2. **Header PAGE_TITLES**: "파트 업무 현황" → "업무현황"
3. **PartStatus.tsx 전면 재작성**:
   - **필터 두 그룹으로 분리**:
     - 그룹 A (인원 필터): 파트 선택 → 팀원 선택 (파트 선택에 종속, 파트 변경 시 팀원 목록 재구성)
     - 그룹 B (프로젝트 필터): 프로젝트 선택 (독립, 파트/팀원과 무관)
   - **목록은 두 그룹의 AND 조합으로 필터링**: 선택된 파트/팀원의 업무 중 선택된 프로젝트에 해당하는 항목만 표시
   - 상태 필터 제거
   - 뷰 모드 토글: 프로젝트별 / 팀원별
   - 프로젝트 컬럼: name + code 통합 (예: "프로젝트명 (CODE)")
   - 상태 컬럼 제거
   - 프로젝트별 보기: 프로젝트 | 팀원 | 파트 | 진행업무 | 예정업무 | 비고
   - 팀원별 보기: 팀원 | 파트 | 프로젝트 | 진행업무 | 예정업무 | 비고
   - 프로젝트 정렬: sortOrder 기반

---

## Task Dependency Graph

```
WORK-10-TASK-01 (DB: sortOrder 마이그레이션)
    │
    ▼
WORK-10-TASK-02 (Backend: API 확장)
    │
    ▼
WORK-10-TASK-03 (Frontend: PartStatus.tsx 재작성)
    │
    ▼
WORK-10-TASK-04 (Frontend: Sidebar/Header 메뉴명 변경)
```

TASK-04는 TASK-03과 독립적이나 같은 파일군이므로 TASK-03 이후 처리.

---

## Tasks

### WORK-10-TASK-01: Project.sortOrder 필드 추가 (Prisma 마이그레이션)
- **Depends on**: (none)
- **Scope**: schema.prisma에 Project.sortOrder Int @default(0) 추가 + 마이그레이션 실행 + ProjectService 정렬 변경 + project.api.ts 타입 업데이트
- **Files**:
  - `packages/backend/prisma/schema.prisma` — Project 모델에 sortOrder 필드 추가
  - `packages/backend/src/project/project.service.ts` — findAll orderBy에 sortOrder 추가
  - `packages/backend/src/project/dto/update-project.dto.ts` — sortOrder 필드 추가
  - `packages/frontend/src/api/project.api.ts` — Project 인터페이스에 sortOrder 추가
- **Acceptance Criteria**:
  - [ ] schema.prisma Project 모델에 `sortOrder Int @default(0)` 존재
  - [ ] 마이그레이션 파일 생성됨
  - [ ] projectService.findAll 정렬이 [sortOrder asc, category asc, name asc]
  - [ ] frontend project.api.ts Project 인터페이스에 sortOrder 타입 포함
- **Verify**:
  ```bash
  cd C:/rnd/weekly-report/packages/backend && bunx prisma validate
  grep -n "sortOrder" C:/rnd/weekly-report/packages/backend/prisma/schema.prisma
  grep -n "sortOrder" C:/rnd/weekly-report/packages/backend/src/project/project.service.ts
  ```

### WORK-10-TASK-02: 백엔드 API 확장 (파트 다중 조회 + member 응답 확장)
- **Depends on**: WORK-10-TASK-01
- **Scope**:
  - getPartWeeklyStatus 응답 member에 partId, partName 포함
  - LEADER가 팀 전체 파트원 조회할 수 있도록 엔드포인트 추가: GET /api/v1/teams/:teamId/members-weekly-status?week=
  - part.api.ts (frontend) 타입 업데이트
- **Files**:
  - `packages/backend/src/weekly-report/part-summary.service.ts` — getPartWeeklyStatus member 응답 확장, getTeamMembersWeeklyStatus 메서드 추가
  - `packages/backend/src/weekly-report/part-summary.controller.ts` — 새 엔드포인트 추가
  - `packages/frontend/src/api/part.api.ts` — MemberWeeklyStatus.member에 partId, partName 추가, 새 API 함수 추가
- **Acceptance Criteria**:
  - [ ] getPartWeeklyStatus 응답 member 객체에 partId, partName 포함
  - [ ] GET /api/v1/teams/:teamId/members-weekly-status?week= 엔드포인트 존재 (LEADER 전용)
  - [ ] part.api.ts MemberWeeklyStatus.member 타입에 partId, partName 포함
- **Verify**:
  ```bash
  cd C:/rnd/weekly-report/packages/backend && bun run build 2>&1 | tail -20
  grep -n "partId\|partName" C:/rnd/weekly-report/packages/backend/src/weekly-report/part-summary.service.ts
  grep -n "members-weekly-status" C:/rnd/weekly-report/packages/backend/src/weekly-report/part-summary.controller.ts
  ```

### WORK-10-TASK-03: PartStatus.tsx 전면 재작성
- **Depends on**: WORK-10-TASK-02
- **Scope**: PartStatus.tsx를 요구사항에 맞게 전면 재작성
  - **필터 두 그룹 분리**:
    - 그룹 A (인원): 파트 선택 → 팀원 선택 (파트 변경 시 팀원 목록 재구성, 팀원 초기값 "전체")
    - 그룹 B (프로젝트): 프로젝트 선택 (독립, 초기값 "전체")
  - **필터링 로직**: 그룹 A(파트/팀원)와 그룹 B(프로젝트)의 AND 조합으로 목록 필터링
    - 예: DX파트 + 홍길동 + 프로젝트A 선택 → 홍길동의 프로젝트A 업무만 표시
    - 예: DX파트 + 전체 + 전체 → DX파트 전체 팀원의 모든 프로젝트 업무 표시
  - 상태 필터 제거
  - 뷰 모드 토글 (프로젝트별 / 팀원별)
  - 프로젝트명+코드 통합 표시
  - 상태 컬럼 제거
  - 프로젝트별 보기: 프로젝트 | 팀원 | 파트 | 진행업무 | 예정업무 | 비고
  - 팀원별 보기: 팀원 | 파트 | 프로젝트 | 진행업무 | 예정업무 | 비고
  - sortOrder 기반 프로젝트 정렬
- **Files**:
  - `packages/frontend/src/pages/PartStatus.tsx` — 전면 재작성
- **Acceptance Criteria**:
  - [ ] 필터가 두 그룹으로 분리됨: (파트→팀원 종속) + (프로젝트 독립)
  - [ ] 파트 선택 필터 존재 (LEADER: 전체 파트 목록, PART_LEADER: 자기 파트 고정)
  - [ ] 팀원 필터가 파트 선택 결과에 따라 재구성됨
  - [ ] 프로젝트 필터가 독립적으로 동작함
  - [ ] 목록이 (파트/팀원) AND (프로젝트) 조합으로 필터링됨
  - [ ] 상태 필터 및 상태 컬럼 없음
  - [ ] 뷰 모드 토글(프로젝트별/팀원별) 존재
  - [ ] 프로젝트 컬럼에 name + code 통합 표시
  - [ ] 프로젝트별 보기: 프로젝트 → 팀원 → 파트 → 진행업무 → 예정업무 → 비고 순서
  - [ ] 팀원별 보기: 팀원 → 파트 → 프로젝트 → 진행업무 → 예정업무 → 비고 순서
  - [ ] `bun run build` 오류 없음
- **Verify**:
  ```bash
  cd C:/rnd/weekly-report/packages/frontend && bun run build 2>&1 | tail -30
  grep -n "프로젝트별\|팀원별\|viewMode" C:/rnd/weekly-report/packages/frontend/src/pages/PartStatus.tsx
  grep -n "partFilter\|partId" C:/rnd/weekly-report/packages/frontend/src/pages/PartStatus.tsx
  ```

### WORK-10-TASK-04: Sidebar/Header 메뉴명·제목 변경
- **Depends on**: WORK-10-TASK-03
- **Scope**: 사이드바 메뉴명, 헤더 페이지 제목/서브타이틀을 "업무현황"으로 변경
- **Files**:
  - `packages/frontend/src/components/layout/Sidebar.tsx` — "파트 업무 현황" → "업무현황"
  - `packages/frontend/src/components/layout/Header.tsx` — PAGE_TITLES['/part-status'] 변경
- **Acceptance Criteria**:
  - [ ] Sidebar.tsx label이 "업무현황"
  - [ ] Header.tsx PAGE_TITLES['/part-status'].title이 "업무현황"
  - [ ] `bun run build` 오류 없음
- **Verify**:
  ```bash
  grep -n "업무현황\|파트 업무 현황" C:/rnd/weekly-report/packages/frontend/src/components/layout/Sidebar.tsx
  grep -n "업무현황\|파트 업무 현황" C:/rnd/weekly-report/packages/frontend/src/components/layout/Header.tsx
  cd C:/rnd/weekly-report/packages/frontend && bun run build 2>&1 | tail -10
  ```
