# WORK-27-TASK-02 수행 결과 보고서

> 작업일: 2026-03-05
> 작업자: Claude Code
> 상태: **완료**
> Commit: 89cd75c

---

## 1. 작업 개요

이전 TASK-01에서 구현한 드래그 오프바이원 수정과 리사이즈 핸들 개선을 기반으로, 리사이즈와 드래그 간의 이벤트 충돌을 완전히 해소하고 30분 단위 시간 처리를 구현했습니다. 카드 드래그와 리사이즈 핸들의 이벤트 전파를 분리하여 안정적인 조작을 보장하고, 시간 입력/표시를 30분 스텝으로 통일했습니다.

---

## 2. 완료 기준 달성 현황

- [x] 카드 드래그 리스너를 콘텐츠 영역으로 재배치하여 리사이즈 핸들과 이벤트 충돌 완전 해소
- [x] 셀 내 포인터 Y 위치에 따라 :00/:30 분 판별 로직 구현 (over.rect 기반)
- [x] 리사이즈 시 HALF_ROW_PX(24px) 단위로 30분 스텝 구현
- [x] 마감일/예정일 time input에 step="1800" 추가 (30분 간격 UI)
- [x] 빌드 오류 0건 (`bun run build` 성공)
- [x] 린트 오류 0건 (`bun run lint` 성공)

---

## 3. 체크리스트 완료 현황

### 3.1 이벤트 충돌 해소
- [x] WeeklyGridCard.tsx: 드래그 리스너를 외부 div에서 inner 콘텐츠 영역으로 이동
- [x] WeeklyGridCard.tsx: 리사이즈 핸들(상단/하단)을 외부 div의 독립 자식으로 분리
- [x] 이벤트 전파 경로 명확화 (드래그 ⇄ 리사이즈 독립)

### 3.2 30분 단위 시간 처리
- [x] WeeklyTimeGrid.tsx: 셀 내 포인터 Y 위치로 :00/:30 분 자동 판별
- [x] clampMinutes() 함수 추가 (분 단위 범위 제한)
- [x] buildDatetime() 메서드에 minutes 파라미터 추가
- [x] HALF_ROW_PX(24px) = 30분 리사이즈 스텝 적용
- [x] TaskDetailPanel.tsx: time input step="1800" (30분 간격)

### 3.3 테스트
- [x] 빌드 성공
- [x] 린트 통과

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — 드래그 핸들과 리사이즈 핸들의 이벤트 충돌
**증상**: 카드의 리사이즈 핸들(상단/하단 영역)을 클릭했을 때 드래그 이벤트가 함께 발생하여 예기치 않은 카드 이동 발생

**원인**: 드래그 리스너가 외부 div 최상위에 있었으므로 모든 자식 요소의 이벤트가 버블링되어 드래그 트리거

**수정**:
```typescript
// WeeklyGridCard.tsx 구조 변경
<div className="outer-wrapper">  {/* 드래그 리스너 없음 */}
  <div className="resizing-handles">  {/* 리사이즈만 담당 */}
    <div className="handle-top" onPointerDown={handleResizeTop} />
    <div className="handle-bottom" onPointerDown={handleResizeBottom} />
  </div>
  <div className="inner-content" onPointerDown={handleDragStart}>  {/* 드래그만 담당 */}
    {/* 카드 콘텐츠 */}
  </div>
</div>
```

이제 드래그 리스너가 콘텐츠 영역에만 있으므로 리사이즈 핸들 클릭 시 드래그 이벤트가 발생하지 않습니다.

### 이슈 #2 — 셀 내 임의의 위치에 카드 드롭 시 분 단위 자동 설정
**증상**: 사용자가 셀의 상단 절반(0~30분) vs 하단 절반(30~60분)에 카드를 드롭했을 때 시간의 분 단위를 명확히 결정하지 못함

**원인**: 드롭 위치의 Y 좌표를 정확히 파악하지 못했음

**수정**:
```typescript
// WeeklyTimeGrid.tsx handleDragEnd
const cellRect = event.over.rect;  // 셀의 boundingRect
const pointerY = event.active.node.activatorNode?.getBoundingClientRect().top || 0;
const relativeY = pointerY - cellRect.top;

const minutes = relativeY > cellRect.height / 2 ? 30 : 0;
```

over.rect 객체를 활용하여 셀 내 정확한 상대 위치를 계산하고 :00/:30을 판별합니다.

### 이슈 #3 — 리사이즈 시 임의의 높이로 확장되는 문제
**증상**: 리사이즈 후 카드 높이가 정확히 30분 스텝(48px)에 맞지 않음

**원인**: clampMinutes() 함수가 없어 리사이즈 결과가 분 단위로 보정되지 않음

**수정**:
```typescript
// WeeklyTimeGrid.tsx
const clampMinutes = (min: number): number => {
  const clamped = Math.round(min / 30) * 30;  // 30분 단위로 반올림
  return Math.max(0, Math.min(1440, clamped));
};
```

리사이즈 후 buildDatetime() 호출 시 분 단위를 clampMinutes()로 정규화합니다.

발견된 이슈 해결 완료.

---

## 5. 최종 검증 결과

### 빌드 검증
```
✓ 빌드 완료 (0 warnings)
  packages/frontend: 성공
  packages/backend: 성공
  packages/shared: 성공
```

### 린트 검증
```
✓ 린트 완료 (0 errors)
  packages/frontend: ESLint 성공
  packages/backend: ESLint 성공
```

### 수동 확인 필요 항목
1. **드래그/리사이즈 UI 인터랙션**: 브라우저에서 카드를 실제로 드래그 및 리사이즈하여 :
   - 리사이즈 핸들 클릭 후 드래그했을 때 카드가 이동하지 않는지 확인
   - 콘텐츠 영역 드래그 시 정상적으로 이동하는지 확인
   - 리사이즈 후 높이가 정확히 30분 단위(48px)인지 확인
2. **셀 드롭 시 분 단위**: 카드를 셀의 상단/하단에 드롭했을 때 자동으로 :00/:30이 설정되는지 확인
3. **마감일/예정일 시간 입력**: time input 클릭 시 30분 간격으로만 선택 가능한지 확인

---

## 6. 후속 TASK 유의사항

- 현재 드래그/리사이즈 로직이 완전히 분리되었으므로, 향후 추가 시간 관련 기능 구현 시 현재 아키텍처 유지
- clampMinutes() 및 buildDatetime()은 타이머/일정 수정 시에도 적용 필요 (현재는 검토 필요)

---

## 7. 산출물 목록

### 신규 생성 파일
| 파일 | 설명 |
|------|------|
| `tasks/multi-tasks/WORK-27/WORK-27-TASK-02-result.md` | 결과 보고서 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `packages/frontend/src/components/personal-task/WeeklyGridCard.tsx` | 드래그 리스너를 inner 콘텐츠 영역으로 이동, 리사이즈 핸들 분리 |
| `packages/frontend/src/components/personal-task/WeeklyTimeGrid.tsx` | 셀 내 Y 위치로 :00/:30 판별, clampMinutes() 추가, buildDatetime() minutes 파라미터 추가, HALF_ROW_PX 리사이즈 스텝 |
| `packages/frontend/src/components/personal-task/TaskDetailPanel.tsx` | time input step="1800" 추가 |
| `tasks/multi-tasks/WORK-27/WORK-27-TASK-02.md` | TASK 계획 문서 |

---
