# WORK-27-TASK-02: 리사이즈/드래그 충돌 수정 + 30분 단위 시간 처리

> **Phase:** 0
> **선행 TASK:** WORK-27-TASK-01
> **목표:** 리사이즈 핸들과 카드 드래그 이벤트 충돌 해소, 시간 입력/이동/리사이즈 30분 단위 처리

## 요청사항

- 상단 클릭하고 드래그 하면 카드가 이동됨: 카드이동과 리사이즈의 이벤트가 충돌
- 하단 마찬가지로 카드 이동 형태가 보이고 실제 카드가 이동하지는 않음
- 마감시간, 예정시간 입력 단위는 30분간격으로 가능하도록 처리 (시간 입력 박스도 동일)
- 뷰에서도 이동 및 사이즈 수정의 단위는 30분임

---

## Step 1 — 계획서

### 1.1 작업 범위

1. WeeklyGridCard: 카드 드래그 리스너를 내부 콘텐츠 영역에만 적용 (리사이즈 핸들과 분리)
2. TaskDetailPanel: time input에 step="1800" (30분 간격)
3. WeeklyTimeGrid: DnD 이동 시 셀 내 포인터 위치로 :00/:30 판별
4. WeeklyTimeGrid: DnD 리사이즈 시 30분 단위 (ROW_HEIGHT_PX/2)

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| 수정 | WeeklyGridCard.tsx — 드래그 리스너 분리 |
| 수정 | WeeklyTimeGrid.tsx — 30분 단위 DnD |
| 수정 | TaskDetailPanel.tsx — time input step="1800" |
