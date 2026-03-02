# WORK-10 수행 결과 보고서

> 작업일: 2026-03-02
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

"파트업무현황" 페이지를 "업무현황"으로 개명하고 기능을 전면 개편했다.
Project.sortOrder 필드를 DB에 추가하고, 백엔드 API를 확장하여 LEADER가 팀 전체 팀원의 업무현황을 조회할 수 있도록 했으며, PartStatus.tsx를 필터 두 그룹 분리 + 뷰 모드 토글로 전면 재작성했다.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| TASK-01: schema.prisma Project.sortOrder 필드 추가 | Done |
| TASK-01: Prisma 마이그레이션 파일 생성 및 적용 | Done |
| TASK-01: ProjectService.findAll 정렬 [sortOrder, category, name] | Done |
| TASK-01: UpdateProjectDto에 sortOrder 추가 | Done |
| TASK-01: frontend project.api.ts Project 인터페이스에 sortOrder 포함 | Done |
| TASK-02: getPartWeeklyStatus member에 partId, partName 포함 | Done |
| TASK-02: GET /api/v1/teams/:teamId/members-weekly-status 엔드포인트 추가 | Done |
| TASK-02: part.api.ts MemberWeeklyStatus.member 타입 업데이트 | Done |
| TASK-03: 필터 두 그룹 분리 (인원/프로젝트) | Done |
| TASK-03: 파트 선택 필터 (LEADER: 전체, PART_LEADER: 자기 파트 고정) | Done |
| TASK-03: 팀원 필터가 파트 선택에 종속 | Done |
| TASK-03: 프로젝트 필터 독립 동작 | Done |
| TASK-03: 상태 필터 및 상태 컬럼 제거 | Done |
| TASK-03: 뷰 모드 토글 (프로젝트별/팀원별) | Done |
| TASK-03: 프로젝트명+코드 통합 표시 | Done |
| TASK-03: 프로젝트별 보기 컬럼 순서 | Done |
| TASK-03: 팀원별 보기 컬럼 순서 | Done |
| TASK-03: bun run build 오류 없음 | Done |
| TASK-04: Sidebar.tsx label "업무현황" | Done |
| TASK-04: Header.tsx PAGE_TITLES['/part-status'].title "업무현황" | Done |
| TASK-04: bun run build 오류 없음 | Done |

---

## 3. 체크리스트 완료 현황

### TASK-01: Project.sortOrder 필드 추가
| 항목 | 상태 |
|------|------|
| schema.prisma Project 모델에 sortOrder Int @default(0) 추가 | Done |
| 마이그레이션 파일 생성 (20260302060629_add_project_sort_order) | Done |
| ProjectService.findAll orderBy [sortOrder asc, category asc, name asc] | Done |
| UpdateProjectDto에 sortOrder 필드 추가 | Done |
| frontend project.api.ts Project/UpdateProjectDto에 sortOrder 추가 | Done |

### TASK-02: 백엔드 API 확장
| 항목 | 상태 |
|------|------|
| getPartWeeklyStatus: member에 part include, partId/partName 반환 | Done |
| getTeamMembersWeeklyStatus: teamId 기반 전체 파트원 조회 메서드 추가 | Done |
| PartSummaryController: GET teams/:teamId/members-weekly-status 엔드포인트 | Done |
| part.api.ts: MemberWeeklyStatus.member에 partId, partName 타입 추가 | Done |
| part.api.ts: getTeamMembersWeeklyStatus API 함수 추가 | Done |
| 백엔드 빌드 오류 없음 | Done |

### TASK-03: PartStatus.tsx 전면 재작성
| 항목 | 상태 |
|------|------|
| 그룹 A 필터: 파트 선택 드롭다운 (LEADER), 고정 텍스트 (PART_LEADER) | Done |
| 그룹 A 필터: 팀원 선택 (파트 변경 시 팀원 목록 재구성) | Done |
| 그룹 B 필터: 프로젝트 선택 (독립, 전체 파트 기준) | Done |
| 목록 필터링: 그룹 A AND 그룹 B 조합 | Done |
| 상태 필터 제거, 상태 컬럼 제거 | Done |
| 뷰 모드 토글 버튼 (프로젝트별 / 팀원별) | Done |
| 프로젝트별 보기: 프로젝트 / 팀원 / 파트 / 진행업무 / 예정업무 / 비고 | Done |
| 팀원별 보기: 팀원 / 파트 / 프로젝트 / 진행업무 / 예정업무 / 비고 | Done |
| 프로젝트 컬럼: name + code 통합 표시 | Done |
| sortOrder 기반 프로젝트 정렬 | Done |
| LEADER: getTeamMembersWeeklyStatus 사용 / 그 외: getPartWeeklyStatus 사용 | Done |
| 프론트엔드 빌드 오류 없음 | Done |

### TASK-04: Sidebar/Header 메뉴명 변경
| 항목 | 상태 |
|------|------|
| Sidebar.tsx label: "파트 업무 현황" → "업무현황" | Done |
| Header.tsx PAGE_TITLES['/part-status'].title: "업무현황" | Done |
| Header.tsx PAGE_TITLES['/part-status'].subtitle 업데이트 | Done |
| 프론트엔드 빌드 오류 없음 | Done |

---

## 4. 발견 이슈 및 수정 내역

발견된 이슈 없음.

---

## 5. 최종 검증 결과

### 백엔드 Prisma 검증
```
The schema at prisma\schema.prisma is valid
Applying migration `20260302060629_add_project_sort_order` — 성공
```

### 프론트엔드 빌드
```
vite v6.4.1 building for production...
✓ 1742 modules transformed.
✓ built in 18.41s (TASK-03 완료 후)
✓ built in 8.38s (TASK-04 완료 후)
```

### 코드 검증
- `sortOrder` in schema.prisma (line 71): Project 모델에 추가 확인
- `sortOrder` in project.service.ts (line 24): orderBy 정렬 포함 확인
- `partId|partName` in part-summary.service.ts: member 응답에 포함 확인
- `members-weekly-status` in part-summary.controller.ts (line 70): 엔드포인트 추가 확인
- Sidebar.tsx line 45: label = "업무현황" 확인
- Header.tsx line 18: title = "업무현황" 확인

### 수동 확인 필요
- PartStatus.tsx 파트 필터 → 팀원 목록 재구성 동작 (브라우저 인터랙션)
- 프로젝트별/팀원별 뷰 모드 토글 전환 렌더링
- LEADER 계정으로 전체 파트 데이터 조회 동작
- PART_LEADER 계정으로 자기 파트 고정 표시 동작

---

## 6. 후속 TASK 유의사항

- Project.sortOrder 기본값은 0이므로, 기존 프로젝트들의 순서 정렬이 필요한 경우 seed 또는 관리 UI를 통해 sortOrder를 설정해야 한다.
- ProjectMgmt.tsx에서 sortOrder 편집 기능을 추가하면 업무현황의 프로젝트 정렬을 관리할 수 있다.

---

## 7. 산출물 목록

### 신규 생성 파일
| 파일 | 설명 |
|------|------|
| `packages/backend/prisma/migrations/20260302060629_add_project_sort_order/migration.sql` | sortOrder 컬럼 추가 마이그레이션 |
| `tasks/WORK-10/PROGRESS.md` | WORK-10 진행 상황 |
| `tasks/WORK-10/WORK-10-result.md` | 이 보고서 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `packages/backend/prisma/schema.prisma` | Project 모델에 sortOrder Int @default(0) 추가 |
| `packages/backend/src/project/project.service.ts` | findAll orderBy에 sortOrder asc 추가 |
| `packages/backend/src/project/dto/update-project.dto.ts` | sortOrder 필드 추가 |
| `packages/backend/src/weekly-report/part-summary.service.ts` | getPartWeeklyStatus member에 partId/partName 추가, getTeamMembersWeeklyStatus 메서드 신규 추가 |
| `packages/backend/src/weekly-report/part-summary.controller.ts` | GET teams/:teamId/members-weekly-status 엔드포인트 추가 |
| `packages/frontend/src/api/project.api.ts` | Project 인터페이스에 sortOrder 추가, UpdateProjectDto에 sortOrder 추가 |
| `packages/frontend/src/api/part.api.ts` | MemberWeeklyStatus.member에 partId/partName 추가, getTeamMembersWeeklyStatus API 함수 추가 |
| `packages/frontend/src/pages/PartStatus.tsx` | 전면 재작성 (필터 2그룹, 뷰 모드 토글, 상태 컬럼 제거) |
| `packages/frontend/src/components/layout/Sidebar.tsx` | "파트 업무 현황" → "업무현황" |
| `packages/frontend/src/components/layout/Header.tsx` | PAGE_TITLES['/part-status'] 제목/서브타이틀 변경 |
