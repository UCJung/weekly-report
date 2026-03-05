# WORK-27-TASK-04 수행 결과 보고서

> 작업일: 2026-03-05
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요
주간뷰 시간 그리드의 행 단위를 1시간→30분으로 전환, 카드 이동 시 소요시간 유지, DragOverlay 카드 크기를 원본과 동일하게 수정.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| 행 단위 30분 전환 (25행) | ✅ |
| 카드 이동 시 소요시간 유지 | ✅ |
| DragOverlay 원본 카드 크기 유지 | ✅ |
| 빌드 오류 0건 | ✅ |
| 테스트 통과 | ✅ (88 tests) |

---

## 3. 주요 변경사항

### 3.1 30분 행 단위 전환
- TIME_ROWS: 14행 → 25행 (종일, ~07:59, 08:00~18:30 30분 간격, 19:00~)
- ROW_HEIGHT_PX: 48px → 32px
- hourToRow(hour, minute): minute 파라미터 추가
- rowToTime(rowIndex): rowToHour 대체, {hour, minute} 반환
- :30 행은 dashed 테두리 + 연한 라벨로 시각 구분

### 3.2 소요시간 유지
- handleDragEnd: 이동 시 기존 duration(dueDate - scheduledDate) 계산 후 새 위치에 적용
- 종일 이동 시에만 dueDate를 null로 초기화

### 3.3 DragOverlay 크기
- handleDragStart에서 원본 카드의 getBoundingClientRect() 캡처
- DragOverlay에 원본 width/height 적용 (기존 고정 120px 제거)

### 3.4 리사이즈 단순화
- HALF_ROW_PX 제거 → ROW_HEIGHT_PX 기준 (1행 = 30분)
- rowSpan 계산: exclusive end (dueRow - rowStart)

---

## 4. 발견 이슈 및 수정 내역
발견된 이슈 없음

---

## 5. 최종 검증 결과

```
빌드: ✓ 3 packages 빌드 성공
프론트엔드 테스트: 11 test files, 88 tests passed (35 WeeklyTimeGrid tests)
```

### 수동 확인 필요
- 30분 단위 행 표시 확인 (08:00, 08:30, ...)
- 카드 이동 후 소요시간 유지 확인
- DragOverlay 크기가 원본과 동일한지 확인
- :30 행의 dashed 테두리 시각 확인

---

## 6. 산출물 목록

| 구분 | 파일 |
|------|------|
| 수정 | packages/frontend/src/components/personal-task/WeeklyTimeGrid.tsx |
| 수정 | packages/frontend/src/components/personal-task/WeeklyTimeGrid.test.tsx |
| 신규 | tasks/multi-tasks/WORK-27/WORK-27-TASK-04.md |
| 신규 | tasks/multi-tasks/WORK-27/WORK-27-TASK-04-result.md |
