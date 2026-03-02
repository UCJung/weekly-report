# WORK-16-TASK-06 수행 결과 보고서

> 작업일: 2026-03-03
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

팀 프로젝트 관리 프론트엔드를 구현한다. 기존 `ProjectMgmt.tsx` (팀 내 CRUD)를 팀-프로젝트 연결 관리 화면으로 전환한다. 팀에 등록된 프로젝트 목록을 DnD로 순서 조정하고, 전역 프로젝트 풀에서 팀에 추가/해제할 수 있다.

---

## 2. 완료 기준 달성 현황

| 기준 | 상태 |
|------|------|
| project.api.ts TeamProject API 연동 | ✅ |
| useProjects.ts 팀 프로젝트 훅 구현 | ✅ |
| ProjectMgmt.tsx 팀 프로젝트 선택 화면 | ✅ |
| DnD 순서 조정 기능 | ✅ |
| 프로젝트 추가 모달 (전역 풀에서 선택) | ✅ |
| 프로젝트 해제 확인 모달 | ✅ |
| 요약 카드 (등록 수, 공통/수행, 사용중/사용안함) | ✅ |
| 카테고리 필터 (필터 활성 시 DnD 비활성) | ✅ |
| 프론트엔드 테스트 통과 (44/44) | ✅ |
| 빌드 오류 0건 | ✅ |
| 린트 오류 0건 | ✅ |

---

## 3. 체크리스트 완료 현황

### API 레이어
| 항목 | 상태 |
|------|------|
| project.api.ts: TeamProject 타입 정의 | ✅ |
| project.api.ts: getTeamProjects() | ✅ |
| project.api.ts: addTeamProjects() | ✅ |
| project.api.ts: removeTeamProject() | ✅ |
| project.api.ts: reorderTeamProjects() | ✅ |

### 훅 레이어
| 항목 | 상태 |
|------|------|
| useTeamProjects() - 팀 프로젝트 조회 | ✅ |
| useAddTeamProjects() - 프로젝트 추가 뮤테이션 | ✅ |
| useRemoveTeamProject() - 프로젝트 해제 뮤테이션 | ✅ |
| useReorderTeamProjects() - 순서 변경 뮤테이션 | ✅ |

### UI 컴포넌트
| 항목 | 상태 |
|------|------|
| ProjectDndTable.tsx - DnD 테이블 컴포넌트 (분리) | ✅ |
| SortableRow - @dnd-kit/sortable useSortable | ✅ |
| AddProjectModal - 전역 프로젝트 선택 체크박스 | ✅ |
| ConfirmModal - 해제 확인 모달 | ✅ |
| 요약 카드 (SummaryCard) | ✅ |

### 테스트
| 항목 | 상태 |
|------|------|
| ProjectMgmt.test.tsx - 3 tests | ✅ |
| 전체 프론트엔드 테스트 44/44 통과 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — Vitest Worker 크래시 (무한 재렌더링)

**증상**: `ProjectMgmt.test.tsx` 실행 시 Vitest 워커가 멈추거나 "Worker exited unexpectedly" 오류 발생. 테스트가 아예 실행되지 않음.

**원인**: `vi.mock('../hooks/useProjects', () => ({ useTeamProjects: vi.fn(() => ({ data: [], isLoading: false })) }))` 형태로 mock할 경우, 매 호출마다 `[]` (새 배열 참조)가 반환됨. `ProjectMgmt.tsx`가 `useEffect(() => { setLocalProjects(teamProjects); }, [teamProjects])` 패턴으로 teamProjects를 로컬 상태에 복사하는데, teamProjects 레퍼런스가 매 렌더마다 바뀌어 무한 re-render 루프 발생 → 워커 프로세스 OOM/크래시.

**수정**:
1. `vi.mock` 내부에서 안정적인(stable) 배열 레퍼런스를 사용하도록 수정:
   ```typescript
   vi.mock('../hooks/useProjects', () => {
     const STABLE_DATA: never[] = [];
     return {
       useTeamProjects: vi.fn(() => ({ data: STABLE_DATA, isLoading: false })),
       ...
     };
   });
   ```
2. DnD kit(@dnd-kit/core, @dnd-kit/sortable)이 브라우저 API(PointerEvent 등)를 모듈 초기화 시 사용하는 문제를 회피하기 위해 DnD 관련 코드를 `ProjectDndTable.tsx`로 분리하고, 테스트에서 해당 컴포넌트를 mock으로 대체.

### 이슈 #2 — Git stash 충돌

**증상**: 이전 컨텍스트에서 디버깅 중 `git stash`가 실행되어 TASK-06 작업 내용이 stash에 저장됨.

**원인**: 디버깅 과정에서 이전 버전 테스트와 비교하기 위해 stash 실행.

**수정**: `git stash pop`으로 TASK-06 작업 내용 복구 후 테스트 수정 진행.

---

## 5. 최종 검증 결과

### 프론트엔드 테스트
```
 Test Files  9 passed (9)
      Tests  44 passed (44)
   Start at  07:30:58
   Duration  32.84s
```

### 빌드
```
@weekly-report/frontend:build: ✓ 1756 modules transformed.
@weekly-report/frontend:build: ✓ built in 13.23s
 Tasks:    3 successful, 3 total
```

### 린트
```
✖ 9 problems (0 errors, 9 warnings)
(모든 warning은 기존 파일의 사전 존재 이슈, TASK-06 신규 파일에는 없음)
```

---

## 6. 후속 TASK 유의사항

- TASK-07 통합 검증 시, 실제 백엔드 DB와 연결하여 팀 프로젝트 CRUD를 E2E 확인 필요
- DnD 순서 조정은 브라우저에서 직접 드래그-드롭으로 수동 확인 필요
- `ProjectDndTable.tsx`는 테스트에서 mock되므로, DnD 로직 자체는 별도 수동 확인 권장

### 수동 확인 필요 항목
- 브라우저에서 팀 프로젝트 목록 DnD 드래그-드롭 순서 변경 동작
- AddProjectModal에서 전역 프로젝트 체크박스 선택 후 추가 동작
- 프로젝트 해제 시 확인 모달 및 _warning 메시지 표시

---

## 7. 산출물 목록

### 신규 생성 파일
| 파일 | 설명 |
|------|------|
| `packages/frontend/src/pages/ProjectDndTable.tsx` | DnD 테이블 컴포넌트 (분리) |
| `tasks/WORK-16/WORK-16-TASK-06-result.md` | 본 보고서 |

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `packages/frontend/src/api/project.api.ts` | TeamProject 타입 추가, 팀 프로젝트 API 메서드 추가 |
| `packages/frontend/src/hooks/useProjects.ts` | 팀 프로젝트 훅 4종 추가 |
| `packages/frontend/src/pages/ProjectMgmt.tsx` | 팀 프로젝트 선택 화면으로 전면 재작성 |
| `packages/frontend/src/pages/ProjectMgmt.test.tsx` | 새 UI에 맞게 테스트 업데이트 + stable mock 수정 |
| `tasks/WORK-16/PROGRESS.md` | TASK-06 완료 상태 업데이트 |
