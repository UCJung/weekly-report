# WORK-23-TASK-04: 프론트엔드 — 내 작업 페이지 구현

> **Phase:** 3
> **선행 TASK:** WORK-23-TASK-02
> **목표:** 개인 작업 관리를 위한 내 작업 페이지(/my-tasks)와 관련 컴포넌트를 구현하고, API 클라이언트 및 TanStack Query 훅을 작성하며 App.tsx에 라우트를 추가한다

---

## Step 1 — 계획서

### 1.1 작업 범위

`personal-task.api.ts` API 클라이언트, `usePersonalTasks.ts` 커스텀 훅, `MyTasks.tsx` 페이지 컴포넌트를 신규 생성한다. 페이지에는 빠른 등록 입력란(`TaskQuickInput`), 필터 바(`TaskFilterBar`), 작업 목록(`TaskList`), 개별 작업 행(`TaskItem`), 우측 상세 패널(`TaskDetailPanel`)을 구현한다. @dnd-kit을 활용한 DnD 정렬을 `TaskList`에 적용하고, App.tsx에 `/my-tasks` 라우트를 추가한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| API | `packages/frontend/src/api/personal-task.api.ts` |
| Hook | `packages/frontend/src/hooks/usePersonalTasks.ts` |
| Page | `packages/frontend/src/pages/MyTasks.tsx` |
| Component | `packages/frontend/src/components/personal-task/TaskQuickInput.tsx` |
| Component | `packages/frontend/src/components/personal-task/TaskFilterBar.tsx` |
| Component | `packages/frontend/src/components/personal-task/TaskList.tsx` |
| Component | `packages/frontend/src/components/personal-task/TaskItem.tsx` |
| Component | `packages/frontend/src/components/personal-task/TaskDetailPanel.tsx` |
| 수정 | `packages/frontend/src/App.tsx` — /my-tasks 라우트 추가 |

---

## Step 2 — 체크리스트

### 2.1 API 클라이언트 구현 (personal-task.api.ts)

- [ ] `getPersonalTasks(params)`: GET `/api/v1/personal-tasks` — teamId, status, projectId, priority, period, q, sortBy 쿼리 파라미터 전달
- [ ] `createPersonalTask(dto)`: POST `/api/v1/personal-tasks`
- [ ] `updatePersonalTask(id, dto)`: PATCH `/api/v1/personal-tasks/:id`
- [ ] `deletePersonalTask(id)`: DELETE `/api/v1/personal-tasks/:id`
- [ ] `toggleDonePersonalTask(id)`: PATCH `/api/v1/personal-tasks/:id/toggle-done`
- [ ] `reorderPersonalTasks(dto)`: PATCH `/api/v1/personal-tasks/reorder`
- [ ] `getPersonalTaskSummary(teamId)`: GET `/api/v1/personal-tasks/summary?teamId=...`

### 2.2 TanStack Query 훅 구현 (usePersonalTasks.ts)

- [ ] `usePersonalTasks(params)`: `useQuery` 훅 — staleTime: 30000, queryKey: `['personal-tasks', params]`
- [ ] `useCreatePersonalTask()`: `useMutation` 훅 — 성공 시 `['personal-tasks']` 캐시 무효화
- [ ] `useUpdatePersonalTask()`: `useMutation` 훅 — debounce 500ms 적용, 낙관적 업데이트 (`onMutate`)
- [ ] `useDeletePersonalTask()`: `useMutation` 훅 — 성공 시 캐시 무효화
- [ ] `useToggleDonePersonalTask()`: `useMutation` 훅 — 낙관적 업데이트로 즉시 체크박스 상태 반영
- [ ] `useReorderPersonalTasks()`: `useMutation` 훅 — 낙관적 업데이트
- [ ] `usePersonalTaskSummary(teamId)`: `useQuery` 훅 — staleTime: 60000, queryKey: `['personal-task-summary', teamId]`
- [ ] 팀 전환 시 캐시 무효화: teamId 변경 감지 시 `queryClient.invalidateQueries(['personal-tasks'])`

### 2.3 TaskQuickInput 컴포넌트 구현

- [ ] 한 줄 텍스트 입력 (`placeholder: "작업 추가... (Enter로 등록)"`)
- [ ] Enter 키 입력 시 `useCreatePersonalTask` 호출 후 입력란 초기화
- [ ] 빈 입력 시 미등록 (클라이언트 유효성 검사)
- [ ] 등록 완료 시 sonner Toast 알림 ("작업이 추가되었습니다")

### 2.4 TaskFilterBar 컴포넌트 구현

- [ ] 상태 필터 탭: ALL / 할일 / 진행중 / 완료 (버튼 그룹)
- [ ] 기간 필터 선택: 전체 / 오늘 / 이번 주 / 이번 달 / 마감 지남 (드롭다운)
- [ ] 프로젝트 필터 선택: 전체 + 팀 프로젝트 목록 (드롭다운)
- [ ] 우선순위 필터: 전체 / 높음 / 보통 / 낮음 (드롭다운)
- [ ] 텍스트 검색 입력란 (debounce 300ms)
- [ ] 필터 상태는 URL 쿼리 파라미터 또는 로컬 state로 관리

### 2.5 TaskItem 컴포넌트 구현

- [ ] 좌측 체크박스: 클릭 시 `useToggleDonePersonalTask` 호출, DONE이면 checked
- [ ] 제목: DONE이면 취소선(`line-through`) + `--text-sub` 색상 적용
- [ ] 프로젝트 태그 배지 (있을 때만 표시, `--primary-bg` 배경)
- [ ] 마감일 표시: 오늘 이전 + 미완료이면 `--danger` 색상 강조
- [ ] 우선순위 배지: HIGH=`--danger`, MEDIUM=`--warn`, LOW=`--text-sub`
- [ ] 행 클릭 시 `TaskDetailPanel` 열기
- [ ] `@dnd-kit/sortable`의 `useSortable` 훅 사용 — 드래그 핸들 아이콘 좌측 배치

### 2.6 TaskList 컴포넌트 구현

- [ ] `DndContext` + `SortableContext` 로 `TaskItem` 목록 감싸기
- [ ] DnD 드롭 완료(`onDragEnd`) 시 `useReorderPersonalTasks` 호출
- [ ] 완료 작업은 목록 하단 별도 그룹("완료된 작업 N건") 접기/펼치기로 표시
- [ ] 빈 목록일 때 안내 메시지 표시 ("등록된 작업이 없습니다")

### 2.7 TaskDetailPanel 컴포넌트 구현

- [ ] 우측 슬라이드인 패널 (position: fixed, 가로 400px, 애니메이션)
- [ ] 제목 인라인 편집 (클릭 시 텍스트 → input 전환, blur 시 자동저장)
- [ ] 상태 셀렉터: TODO / IN_PROGRESS / DONE 선택
- [ ] 우선순위 셀렉터: HIGH / MEDIUM / LOW 선택
- [ ] 프로젝트 셀렉터: 팀 프로젝트 드롭다운
- [ ] 마감일 date input
- [ ] 반복 설정 간단 표시 (repeatConfig 있으면 "반복: 주간" 등 텍스트)
- [ ] 메모 textarea (debounce 500ms 자동저장)
- [ ] `linkedWeekLabel` 있으면 "주간업무 YYYY-WNN에 반영됨" 텍스트 표시
- [ ] 삭제 버튼: 확인 후 `useDeletePersonalTask` 호출 후 패널 닫기
- [ ] X 버튼 또는 패널 외 영역 클릭 시 닫기

### 2.8 MyTasks 페이지 구현

- [ ] 페이지 제목 ("내 작업") + 설명 텍스트
- [ ] `TaskQuickInput` 최상단 배치
- [ ] `TaskFilterBar` 아래 배치
- [ ] `TaskList` 필터 파라미터 전달
- [ ] `TaskDetailPanel` 상태 관리 (`selectedTaskId` state)
- [ ] `teamStore.currentTeamId` 사용 (authStore 사용 금지)
- [ ] CSS 변수 사용 (HEX 하드코딩 금지)

### 2.9 App.tsx 라우트 추가

- [ ] `/my-tasks` 라우트 추가 — `MyTasks` 컴포넌트 연결, 인증 보호 라우트 적용

### 2.10 테스트

- [ ] 프론트엔드 빌드 오류 없음 (`bun run build`)
- [ ] 린트 오류 없음 (`bun run lint`)
- [ ] MyTasks 페이지 라우트 접근 확인 (수동)
- [ ] 작업 추가 → 목록 표시 확인 (수동)
- [ ] 체크박스 클릭 → 완료 전환 확인 (수동)

---

## Step 3 — 완료 검증

```bash
# 1. 프론트엔드 빌드
cd packages/frontend
bun run build

# 2. 린트 검사
bun run lint

# 3. 타입 체크
bunx tsc --noEmit

# 4. 전체 빌드
cd ../..
bun run build

# 5. 개발 서버 실행 후 수동 확인
bun run dev
# 브라우저에서 http://localhost:5173/my-tasks 접속 확인
```
