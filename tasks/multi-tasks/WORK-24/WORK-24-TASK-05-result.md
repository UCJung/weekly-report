# WORK-24-TASK-05 수행 결과 보고서

> 작업일: 2026-03-05
> 작업자: Claude Code
> 상태: **완료**
> Commit: 42f9ed6

---

## 1. 작업 개요

하드코딩된 3단계 상태(TODO/IN_PROGRESS/DONE)를 제거하고 팀별 TaskStatusDef 기반 동적 칸반/목록/필터로 전환했다. `PersonalTask` 타입에 `statusId` + `taskStatus` 객체를 추가하고, 모든 컴포넌트의 `task.status` 직접 비교를 `task.taskStatus.category` 기반으로 변경했다.

---

## 2. 완료 기준 달성 현황

| 항목 | 결과 |
|------|------|
| TASK MD 체크리스트 전 항목 완료 | ✅ |
| 스타일 가이드 색상 하드코딩 없음 (CSS 변수 사용) | ✅ |
| 빌드 오류 0건 (`bun run build`) | ✅ |
| 린트 오류 0건 (`bun run lint`) | ✅ (경고는 기존 코드의 pre-existing 항목만) |
| 단위 테스트 통과 (TaskItem.test.tsx 9건) | ✅ |
| 전체 테스트 통과 (frontend 53건, backend 185건) | ✅ |

---

## 3. 체크리스트 완료 현황

### 2.1 PersonalTask API 타입 변경
| 항목 | 상태 |
|------|------|
| PersonalTask: statusId + taskStatus 객체 추가 | ✅ |
| PersonalTask: status? 선택적으로 변경(@deprecated) | ✅ |
| CreatePersonalTaskDto: statusId? 추가 | ✅ |
| UpdatePersonalTaskDto: statusId? 추가, status? 유지(@deprecated) | ✅ |
| ListPersonalTasksParams: statusId?, category? 추가 | ✅ |
| TaskStatusSnapshot 인터페이스 정의 | ✅ |
| TaskStatusCategory를 team.api.ts에서 import | ✅ |

### 2.2 TaskKanban 동적 컬럼
| 항목 | 상태 |
|------|------|
| 하드코딩 COLUMNS 제거 | ✅ |
| useTaskStatuses(currentTeamId) 호출 | ✅ |
| Droppable ID: column-{statusId} | ✅ |
| DnD 이동: { statusId: targetStatusId } | ✅ |
| 컬럼 헤더 색상: category 기반 + status.color dot 표시 | ✅ |

### 2.3 TaskKanbanCard 상태 표시
| 항목 | 상태 |
|------|------|
| task.status 참조 → task.taskStatus.category | ✅ |
| 상태 색상 인디케이터 배지 추가 (status.color) | ✅ |

### 2.4 TaskItem 상태 배지
| 항목 | 상태 |
|------|------|
| isDone: task.taskStatus.category === 'COMPLETED' | ✅ |
| isOverdue: task.taskStatus.category !== 'COMPLETED' | ✅ |
| 상태 배지 추가 (color + name) | ✅ |

### 2.5 TaskFilterBar 동적 탭
| 항목 | 상태 |
|------|------|
| 하드코딩 STATUS_OPTIONS 제거 | ✅ |
| useTaskStatuses 기반 동적 탭 | ✅ |
| 선택 시 statusId 필터 | ✅ |
| TaskFilters 타입: status? → statusId? 변경 | ✅ |

### 2.6 TaskDetailPanel 동적 드롭다운
| 항목 | 상태 |
|------|------|
| 고정 select → useTaskStatuses 기반 동적 select | ✅ |
| statusId로 업데이트 | ✅ |
| 헤더의 상태 표시: TASK_STATUS_LABEL → taskStatus.name | ✅ |

### 2.7 labels.ts 정리
| 항목 | 상태 |
|------|------|
| TASK_STATUS_LABEL @deprecated 주석 | ✅ |
| TASK_STATUS_VARIANT @deprecated 주석 | ✅ |

### 2.8 TaskWeeklyView 수정
| 항목 | 상태 |
|------|------|
| task.status === 'DONE' → task.taskStatus.category === 'COMPLETED' | ✅ |
| task.status === 'IN_PROGRESS' → task.taskStatus.category === 'IN_PROGRESS' | ✅ |

### 2.9 테스트 수정
| 항목 | 상태 |
|------|------|
| TaskItem.test.tsx: makeTask에 statusId + taskStatus 추가 | ✅ |
| DONE 상태 테스트: taskStatus.category === 'COMPLETED' | ✅ |
| TODO 상태 테스트: taskStatus.category === 'BEFORE_START' | ✅ |

### 추가 수정 (task.status 참조 제거)
| 파일 | 항목 | 상태 |
|------|------|------|
| TaskList.tsx | activeTasks/doneTasks: taskStatus.category 기반 | ✅ |
| ImportFromTasksModal.tsx | status: 'DONE' → category: 'COMPLETED' 등 | ✅ |
| usePersonalTasks.ts | toggleDone 낙관적 업데이트: taskStatus.category 기반 | ✅ |
| MyTasks.tsx | incompleteTasks: taskStatus.category 기반, statusId 필터 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — TaskList.tsx 및 ImportFromTasksModal.tsx의 task.status 잔존 참조
**증상**: 수정 대상 파일 목록에 없었으나 `task.status` 직접 참조 잔존
**원인**: 초기 체크리스트에 포함되지 않은 파일들
**수정**: TaskList.tsx (activeTasks/doneTasks 필터), ImportFromTasksModal.tsx (isOverdue, category 파라미터, 스타일 조건) 모두 `taskStatus.category` 기반으로 변경

### 이슈 #2 — usePersonalTasks.ts toggleDone 낙관적 업데이트
**증상**: 기존 코드가 `task.status === 'DONE'` 비교로 낙관적 업데이트 수행
**원인**: status 필드 제거에 따른 업데이트 필요
**수정**: `task.taskStatus.category === 'COMPLETED'` 기반으로 변경, category 토글 로직으로 전환

---

## 5. 최종 검증 결과

```
Build: 3 successful (frontend TypeScript 컴파일 + Vite 빌드 성공)
Lint: 0 errors, 11 warnings (모두 pre-existing 경고)

Frontend Tests:
  Test Files  10 passed (10)
  Tests       53 passed (53)

Backend Tests:
  185 pass, 0 fail

Shared Tests:
  8 pass, 0 fail
```

---

## 6. 후속 TASK 유의사항

- TASK-06(통합 검증 + seed 정리)에서 백엔드 API가 실제로 `taskStatus` 객체를 응답에 포함하는지 E2E 레벨에서 확인 필요
- 프론트엔드는 `task.taskStatus`가 항상 존재한다고 가정함 — 백엔드 응답에 include 구문이 누락되면 런타임 오류 발생 가능
- `PersonalTask.status` 필드는 `@deprecated`로 표시되었으나 아직 타입에 남아있음. 백엔드가 해당 필드를 응답에 포함하지 않으면 제거 가능

---

## 7. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/frontend/src/api/personal-task.api.ts` | TaskStatus @deprecated, TaskStatusSnapshot 추가, PersonalTask.statusId + taskStatus 추가, DTO/Query 타입 변경 |
| `packages/frontend/src/components/personal-task/TaskKanban.tsx` | 하드코딩 COLUMNS 제거, useTaskStatuses 기반 동적 컬럼, statusId 기반 DnD |
| `packages/frontend/src/components/personal-task/TaskKanbanCard.tsx` | taskStatus.category 기반 isDone/isOverdue, 상태 배지 추가 |
| `packages/frontend/src/components/personal-task/TaskItem.tsx` | taskStatus.category 기반 isDone/isOverdue, 상태 배지 추가 |
| `packages/frontend/src/components/personal-task/TaskFilterBar.tsx` | 하드코딩 STATUS_OPTIONS 제거, useTaskStatuses 기반 동적 탭, TaskFilters.statusId 변경 |
| `packages/frontend/src/components/personal-task/TaskDetailPanel.tsx` | 고정 status select → useTaskStatuses 기반 동적 select, statusId 업데이트 |
| `packages/frontend/src/components/personal-task/TaskWeeklyView.tsx` | task.status → taskStatus.category 기반 분류 로직 |
| `packages/frontend/src/components/personal-task/TaskList.tsx` | taskStatus.category 기반 activeTasks/doneTasks 분리 |
| `packages/frontend/src/components/personal-task/ImportFromTasksModal.tsx` | category 파라미터 사용, taskStatus.category 기반 스타일 조건 |
| `packages/frontend/src/constants/labels.ts` | TASK_STATUS_LABEL, TASK_STATUS_VARIANT @deprecated 주석 |
| `packages/frontend/src/hooks/usePersonalTasks.ts` | toggleDone 낙관적 업데이트 taskStatus.category 기반 |
| `packages/frontend/src/pages/MyTasks.tsx` | statusId 필터, incompleteTasks taskStatus.category 기반 |
| `packages/frontend/src/components/personal-task/TaskItem.test.tsx` | makeTask에 statusId + taskStatus 추가, 테스트 케이스 업데이트 |
