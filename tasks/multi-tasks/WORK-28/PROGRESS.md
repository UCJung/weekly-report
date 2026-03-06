# WORK-28 진행 현황

> 업무-작업 연계 및 주간보고 통합
> 마지막 업데이트: 2026-03-07 15:45 KST
> 진행 모드: 자동

| TASK | 제목 | 상태 | 커밋 |
|------|------|------|------|
| TASK-01 | 백엔드: WorkItem별 연관 PersonalTask 조회 API | ✅ Done | aabcd2d |
| TASK-02 | 백엔드: PersonalTask 내용 → WorkItem 반영 API | ✅ Done | 68e6569 |
| TASK-03 | 프론트엔드: ExpandedEditor 연관 작업 패널 | ✅ Done | 53a0a7d |
| TASK-04 | 프론트엔드: 그리드 작업 연동 버튼 | ✅ Done | c894348 |
| TASK-05 | 프론트엔드: TaskDetailPanel 주간보고 연계 | ✅ Done | cd84d53 |

## 완료 요약

모든 5개 TASK가 완료되었습니다. 다음 기능들이 구현되었습니다:

### 백엔드 (TASK-01, TASK-02)
- WorkItem별 연관 PersonalTask 조회 API: `GET /api/v1/work-items/:id/linked-tasks`
  - 같은 프로젝트 + 해당 주차의 작업 목록 조회
  - `linkedWeekLabel` 또는 주차 범위 기준으로 필터링

- PersonalTask 내용 → WorkItem 반영 API: `POST /api/v1/work-items/:id/apply-tasks`
  - 선택한 작업의 내용을 WorkItem의 한일/할일에 자동 추가
  - append/replace 모드 지원

### 프론트엔드 (TASK-03, TASK-04, TASK-05)

1. **ExpandedEditor 연관 작업 패널 (TASK-03)**
   - LinkedTasksPanel 컴포넌트: WorkItem 확대 편집기 우측에 사이드 패널
   - 탭: 완료/진행중/예정
   - 체크박스로 다중 선택 + "한일에 추가"/"할일에 추가" 버튼

2. **그리드 작업 연동 버튼 (TASK-04)**
   - LinkedTasksPopover 컴포넌트: 팝오버 스타일 작업 목록
   - EditableGrid 액션 컬럼에 체크마크 버튼 추가
   - projectId 없는 행은 버튼 비활성화
   - 팝오버 바깥 클릭 시 자동 닫기

3. **TaskDetailPanel 주간보고 연계 (TASK-05)**
   - 주간보고 연계 섹션 추가
   - linkedWeekLabel 있으면: 연결된 주차 표시 + 주간보고로 이동
   - linkedWeekLabel 없으면: 주차 선택 + 내보내기
   - useImportSingleTaskToWeekly 훅: 개별 작업 내보내기

## 로그

- [15:00] TASK-03 구현 시작
- [15:05] LinkedTasksPanel 컴포넌트 작성
- [15:10] ExpandedEditor에 패널 통합
- [15:15] API 및 훅 추가 (getLinkedTasks, applyTasksToWorkItem, useLinkedTasks, useApplyTasksToWorkItem)
- [15:20] 빌드 및 린트 검증 완료
- [15:22] TASK-03 커밋: 53a0a7d
- [15:25] TASK-04 구현 시작
- [15:30] LinkedTasksPopover 컴포넌트 작성
- [15:35] EditableGrid 액션 컬럼 수정 + 팝오버 통합
- [15:40] 빌드 및 린트 검증 완료
- [15:42] TASK-04 커밋: c894348
- [15:45] TASK-05 구현 시작
- [15:50] useImportSingleTaskToWeekly 훅 추가
- [15:55] TaskDetailPanel 주간보고 연계 섹션 추가
- [16:00] 빌드 및 린트 검증 완료
- [16:02] TASK-05 커밋: cd84d53
- [16:05] WORK-28 완료
