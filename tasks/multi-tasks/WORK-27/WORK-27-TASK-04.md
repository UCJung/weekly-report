# WORK-27-TASK-04: 30분 행 단위 전환 + 이동 소요시간 유지 + DragOverlay 크기 수정

> **Phase:** 0
> **선행 TASK:** WORK-27-TASK-03
> **목표:** 주간뷰 시간 그리드 행 단위를 1시간→30분 전환, 카드 이동 시 소요시간 보존, DragOverlay 크기 원본 유지

## 요청사항

- 리사이즈 및 카드 이동 단위가 시간단위임 -> 30분단위로 변경 (한행의 단위를 시간에서 30분으로 변경)
- 소요시간 두시간 짜리 작업의 경우 이동 후에 마감시간이 한시간 차이로 변경됨
- 이동을 위해 마우스를 클릭하고 드래그 하면 카드의 사이즈가 축소된 형태로 이동함 이동시에 목록에서 표시해주는 크기를 유지하도록 수정

---

## Step 1 — 계획서

### 1.1 작업 범위

1. TIME_ROWS를 1시간 단위에서 30분 단위(25행)로 확장, ROW_HEIGHT_PX 조정
2. hourToRow/rowToTime 함수 30분 단위 대응
3. taskToCell rowSpan 계산을 30분 단위로 변경 (exclusive end)
4. handleDragEnd: 카드 이동 시 기존 소요시간(dueDate - scheduledDate) 유지
5. DragOverlay: 드래그 시작 시 원본 카드 크기 캡처하여 동일 크기로 표시
6. 리사이즈: HALF_ROW_PX 제거, ROW_HEIGHT_PX 기준으로 단순화

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| 수정 | WeeklyTimeGrid.tsx — 30분 행 단위 전환 + 이동/DragOverlay 수정 |
| 수정 | WeeklyTimeGrid.test.tsx — 테스트 업데이트 |
