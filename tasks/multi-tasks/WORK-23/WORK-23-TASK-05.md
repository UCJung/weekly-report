# WORK-23-TASK-05: 프론트엔드 — 주간업무 연동 + 대시보드 위젯 + 사이드바

> **Phase:** 4
> **선행 TASK:** WORK-23-TASK-03, WORK-23-TASK-04
> **목표:** 주간업무 작성 화면에 "내 작업에서 가져오기" 기능을 추가하고, 대시보드에 개인 작업 요약 위젯 4개를 추가하며, 사이드바에 "내 작업" 메뉴 항목을 추가한다

---

## Step 1 — 계획서

### 1.1 작업 범위

세 개의 기존 파일을 수정하고 `ImportFromTasksModal` 컴포넌트를 신규 생성한다. `MyWeeklyReport.tsx`에는 "내 작업에서 가져오기" 버튼과 모달 연동을 추가한다. `Dashboard.tsx`에는 `usePersonalTaskSummary` 훅을 사용하는 작업 요약 위젯 4개를 추가한다. `Sidebar.tsx`에는 "업무관리" 그룹에 "내 작업" 메뉴 항목을 추가한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| Component | `packages/frontend/src/components/personal-task/ImportFromTasksModal.tsx` |
| 수정 | `packages/frontend/src/pages/MyWeeklyReport.tsx` — "내 작업에서 가져오기" 버튼 + 모달 |
| 수정 | `packages/frontend/src/pages/Dashboard.tsx` — 작업 요약 위젯 4개 추가 |
| 수정 | `packages/frontend/src/components/layout/Sidebar.tsx` — "내 작업" 메뉴 항목 추가 |

---

## Step 2 — 체크리스트

### 2.1 ImportFromTasksModal 컴포넌트 구현

- [ ] Modal 제목: "내 작업에서 가져오기"
- [ ] 탭 구성: "한일 (완료)" / "할일 (진행중)" 탭 전환
- [ ] "한일" 탭: `status=DONE`인 개인 작업 목록 표시 (`usePersonalTasks({ status: 'DONE', teamId })` 사용)
- [ ] "할일" 탭: `status=IN_PROGRESS,TODO`인 개인 작업 목록 표시
- [ ] 각 작업 행: 체크박스 + 제목 + 프로젝트 태그 + 마감일
- [ ] 다중 선택 가능 (체크박스 개별 선택)
- [ ] "가져오기" 버튼 클릭 시 `importToWeeklyReport(dto)` API 호출 (`personal-task.api.ts`)
  - 선택된 작업 ID 목록(`taskIds`)과 현재 `weekLabel`, `teamId` 전달
- [ ] 성공 시 Toast "N개 작업이 주간업무에 반영되었습니다", WeeklyReport 캐시 무효화 후 모달 닫기
- [ ] 빈 선택 상태에서 "가져오기" 버튼 비활성화
- [ ] 로딩/에러 상태 처리

### 2.2 MyWeeklyReport.tsx 수정

- [ ] 기존 "전주 불러오기" 버튼 근처에 "내 작업에서 가져오기" 버튼 추가 (CheckSquare 아이콘 사용)
- [ ] `importModalOpen` state 관리 (boolean)
- [ ] 버튼 클릭 시 `ImportFromTasksModal` 열기
- [ ] `ImportFromTasksModal`에 `weekLabel`, `teamId`, `onClose` props 전달
- [ ] 기존 주간업무 기능(전주 불러오기, 자동저장 등) 동작에 영향 없음 확인

### 2.3 Dashboard.tsx 수정

- [ ] `usePersonalTaskSummary(teamId)` 훅 추가 (`teamStore.currentTeamId` 사용)
- [ ] 기존 SummaryCard 행 하단에 새 "내 작업 현황" 섹션 추가 (섹션 타이틀 포함)
- [ ] 4개 SummaryCard 추가:
  - "오늘 할 작업" — `summary.todayCount`건, 기본 색상
  - "마감 임박" — `summary.dueSoonCount`건, `--warn` 색상 (3일 이내)
  - "이번 주 완료" — `summary.thisWeekDoneCount`건, `--ok` 색상
  - "마감 지남" — `summary.overdueCount`건, `--danger` 색상 (강조)
- [ ] 각 카드 클릭 시 `/my-tasks?period=...` 로 이동 (선택적)
- [ ] summary 데이터 로딩 중 스켈레톤 또는 0 표시

### 2.4 Sidebar.tsx 수정

- [ ] "업무관리" 그룹에서 "내 주간업무" 메뉴 항목 다음 위치에 "내 작업" 항목 추가
- [ ] 아이콘: `CheckSquare` (lucide-react)
- [ ] 경로: `/my-tasks`
- [ ] 기존 MENU_GROUPS 상수 구조 유지 (상수/배열 방식이면 해당 위치에 항목 삽입)
- [ ] 활성 상태(active) 스타일 기존 메뉴와 동일하게 적용

### 2.5 테스트

- [ ] 사이드바에 "내 작업" 메뉴 항목 표시 확인 (수동)
- [ ] Dashboard 작업 요약 위젯 4개 표시 확인 (수동)
- [ ] MyWeeklyReport에서 "내 작업에서 가져오기" 버튼 클릭 → 모달 열림 확인 (수동)
- [ ] 모달에서 작업 선택 → "가져오기" 클릭 → 주간업무에 WorkItem 반영 확인 (수동)
- [ ] 프론트엔드 빌드 오류 없음
- [ ] 린트 오류 없음

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

# 5. 개발 서버 실행 후 수동 확인 항목
bun run dev
# - http://localhost:5173 사이드바 "내 작업" 메뉴 표시 확인
# - http://localhost:5173/dashboard 작업 요약 위젯 4개 표시 확인
# - http://localhost:5173/my-weekly-report "내 작업에서 가져오기" 버튼 + 모달 동작 확인
```
