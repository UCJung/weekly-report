# WORK-27-TASK-05 수행 결과 보고서

> 작업일: 2026-03-05
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요
DnD 이동/리사이즈 후 카드 선택 방지, 상세패널 예정일시→마감일시 순서 변경, 시간 입력을 시/분(00·30) 셀렉트로 전환.

---

## 2. 오류 원인 및 수정 방법

### 이슈 #1 — 이동/리사이즈 후 카드 선택됨
**원인**: @dnd-kit의 DragEnd 이벤트 후 마우스 버튼 릴리스 시 카드의 onClick이 연쇄 발생하여 `onSelectTask(task)` 호출됨.
**수정**: WeeklyTimeGrid에 `suppressClickRef` 추가. handleDragEnd와 resize handlePointerUp에서 플래그를 설정하고 200ms 후 해제. `handleSelectTask` 래퍼 함수에서 플래그 확인 후 무시.

### 이슈 #2 — 예정일/마감일 순서
**원인**: TaskDetailPanel에서 마감일(dueDate) 섹션이 예정일(scheduledDate) 보다 먼저 렌더링됨.
**수정**: JSX 순서 교체 — 예정일시 → 마감일시. 라벨을 "예정일" → "예정일시", "마감일" → "마감일시"로 변경.

### 이슈 #3 — 시간 입력 1분 단위
**원인**: `<input type="time" step="1800">`은 브라우저에 따라 분 단위 선택이 1분 간격으로 표시됨.
**수정**: `<input type="time">`을 `TimeSelect` 컴포넌트로 교체. 시(00~23) select + 분(00, 30) select 조합으로 30분 간격만 선택 가능.

---

## 3. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| 이동/리사이즈 후 카드 선택 방지 | ✅ |
| 상세패널 예정일시 → 마감일시 순서 | ✅ |
| 시간 입력 00/30분 셀렉트 | ✅ |
| 빌드 오류 0건 | ✅ |
| 테스트 통과 | ✅ (88 tests) |

---

## 4. 발견 이슈 및 수정 내역
발견된 이슈 없음

---

## 5. 최종 검증 결과

```
빌드: ✓ 3 packages 빌드 성공
프론트엔드 테스트: 11 test files, 88 tests passed
```

### 수동 확인 필요
- 카드 이동 후 상세 패널이 뜨지 않는지 확인
- 카드 리사이즈 후 상세 패널이 뜨지 않는지 확인
- 상세 패널에서 예정일시가 마감일시보다 위에 표시되는지 확인
- 시간 선택 시 분 옵션이 00, 30 두 가지만 보이는지 확인

---

## 6. 산출물 목록

| 구분 | 파일 |
|------|------|
| 수정 | packages/frontend/src/components/personal-task/WeeklyTimeGrid.tsx |
| 수정 | packages/frontend/src/components/personal-task/TaskDetailPanel.tsx |
| 신규 | tasks/multi-tasks/WORK-27/WORK-27-TASK-05.md |
| 신규 | tasks/multi-tasks/WORK-27/WORK-27-TASK-05-result.md |
