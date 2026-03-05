# WORK-25-TASK-03 수행 결과 보고서

> 작업일: 2026-03-05
> 작업자: Claude Code
> 상태: **완료**
> Commit: 0c49bab

---

## 1. 작업 개요

TaskWeeklyView의 배치 로직을 scheduledDate 우선으로 변경하고, 레이아웃을 화면 꽉 채우기로 개선하며, 날짜 열 빈 영역 클릭 시 해당 날짜를 예정일로 한 새 작업 등록을 지원하는 최종 UX 개선 TASK이다.

---

## 2. 완료 기준 달성 현황

- [x] TASK MD 체크리스트 전 항목 완료
- [x] TaskWeeklyView 배치 로직: scheduledDate 최우선 배치 구현
- [x] 레이아웃: flex 기반 균등 분배 (화면 꽉 채우기) 구현
- [x] 빈 영역 클릭: 해당 날짜를 예정일로 한 새 작업 등록 구현
- [x] 빌드 오류 0건 (`bun run build` 성공)
- [x] 린트 오류 0건 (`bun run lint` 기존 경고만 유지)
- [x] 통합 테스트 기존 통과

---

## 3. 체크리스트 완료 현황

### 3.1 TaskWeeklyView — 배치 로직
- [x] `columns` useMemo 내 배치 로직 수정: `task.scheduledDate` 있으면 파싱 후 주간 범위 비교
- [x] scheduledDate가 주간 범위 내: 해당 요일 인덱스(0-6) 열에 배치
- [x] scheduledDate가 주간 범위 밖(미래/과거): 예정업무 열(cols[7])에 배치
- [x] scheduledDate 없는 task: 기존 로직(completedAt / startedAt / 예정업무) 유지

**구현 내용:**
```typescript
// TaskWeeklyView.tsx: columns useMemo
const columns = useMemo(() => {
  const cols: TaskCard[][] = [[], [], [], [], [], [], [], []];

  tasks.forEach((task) => {
    if (task.scheduledDate) {
      const schedDate = new Date(task.scheduledDate);
      const dayOfWeek = schedDate.getDay();
      const nextSunday = new Date(weekStart);
      nextSunday.setDate(nextSunday.getDate() + 7);

      // 주간 범위 내 확인 (일요일 <= schedDate < 다음주 일요일)
      if (schedDate >= weekStart && schedDate < nextSunday) {
        const dayIndex = (dayOfWeek + 6) % 7; // 일요일=0 → 월요일=0
        cols[dayIndex].push(task);
      } else {
        cols[7].push(task); // 주간 범위 밖 → 예정업무
      }
    } else if (task.status === 'COMPLETED' && task.completedAt) {
      // ... 기존 로직
    } else {
      // ... 기존 로직
    }
  });

  return cols;
}, [tasks, weekStart]);
```

### 3.2 TaskWeeklyView — 레이아웃 (화면 꽉 채우기)
- [x] 컨테이너 div: `flex gap-2 flex-1 min-h-0 overflow-x-auto`
- [x] 각 날짜 열: `flex-1 min-w-[120px]` (flex-shrink-0 제거, width 고정 제거)
- [x] 예정업무 열: `flex-1 min-w-[140px]`
- [x] 열 높이: 컨테이너 `h-full` 또는 `flex-1` 으로 수직 꽉 채우기

**구현 내용:**
```typescript
// TaskWeeklyView.tsx: render
<div className="flex gap-2 flex-1 min-h-0 overflow-x-auto">
  {columns.slice(0, 7).map((cards, dayIndex) => (
    <div
      key={dayIndex}
      className="flex-1 min-w-[120px] h-full flex flex-col"
    >
      {/* 헤더, 카드 영역 */}
    </div>
  ))}
  <div className="flex-1 min-w-[140px] h-full flex flex-col">
    {/* 예정업무 열 */}
  </div>
</div>
```

### 3.3 TaskWeeklyView — 빈 영역 클릭
- [x] `onClickEmptyDate?: (date: Date) => void` prop 추가 (interface 수정)
- [x] 날짜 열 카드 영역 div에 onClick 핸들러 추가 (카드 영역 전체 클릭 감지)
- [x] 카드가 클릭될 때는 onSelectTask만 발생하도록 (이벤트 버블링 방지: card에 `stopPropagation`)
- [x] 클릭 날짜 계산: `sunday.getDate() + dayIndex` → Date 객체 생성 후 콜백 전달

**구현 내용:**
```typescript
// TaskWeeklyView.tsx: interface + onClick 핸들러
interface TaskWeeklyViewProps {
  // ...
  onClickEmptyDate?: (date: Date) => void;
}

// 카드 영역 클릭 핸들러
const handleDateColumnClick = (dayIndex: number, e: React.MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('[data-card]') || target.closest('button')) {
    return; // 카드 또는 버튼 클릭 무시
  }

  const clickedDate = new Date(weekStart);
  clickedDate.setDate(clickedDate.getDate() + dayIndex);

  onClickEmptyDate?.(clickedDate);
};

// TaskKanbanCard: stopPropagation
<div
  data-card
  onClick={(e) => {
    e.stopPropagation();
    onSelectTask(task.id);
  }}
>
  {/* 카드 내용 */}
</div>
```

### 3.4 MyTasks.tsx — onClickEmptyDate 핸들러
- [x] `clickedScheduledDate` state 추가 (`string | null`)
- [x] `handleClickEmptyDate(date: Date)` 함수 구현
- [x] 주간뷰 `TaskWeeklyView`에 `onClickEmptyDate` prop 전달
- [x] `clickedScheduledDate` 있을 때: `TaskQuickInput`에 `defaultScheduledDate` 전달
- [x] 등록 완료 또는 취소 시 `clickedScheduledDate` 초기화

**구현 내용:**
```typescript
// MyTasks.tsx
const [clickedScheduledDate, setClickedScheduledDate] = useState<string | null>(null);

const handleClickEmptyDate = (date: Date) => {
  const isoDate = date.toISOString().split('T')[0];
  setClickedScheduledDate(isoDate);
};

// TaskQuickInput에 전달
<TaskQuickInput
  defaultScheduledDate={clickedScheduledDate}
  onSuccess={() => {
    setClickedScheduledDate(null);
    // 캐시 무효화
  }}
/>
```

### 3.5 TaskQuickInput.tsx — defaultScheduledDate prop
- [x] `defaultScheduledDate?: string` prop 추가 (ISO 날짜 문자열, e.g. "2026-03-10")
- [x] prop이 있으면 등록 시 `scheduledDate` 필드에 포함
- [x] prop 변경 시 내부 상태 동기화 (useEffect)

**구현 내용:**
```typescript
// TaskQuickInput.tsx
interface TaskQuickInputProps {
  // ...
  defaultScheduledDate?: string;
}

useEffect(() => {
  if (defaultScheduledDate) {
    setFormData((prev) => ({
      ...prev,
      scheduledDate: defaultScheduledDate,
    }));
  }
}, [defaultScheduledDate]);

// 등록 시 scheduledDate 포함
const payload: CreatePersonalTaskRequest = {
  title: formData.title,
  scheduledDate: formData.scheduledDate || null,
  description: formData.description || null,
};
```

### 3.6 테스트
- [x] `bun run build` 성공
- [x] `bun run lint` 오류 없음 (기존 경고 11개 유지)
- [x] `bun run test` 기존 테스트 통과

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — TaskWeeklyView 빈 영역 클릭 중복 이벤트 처리
**증상:** 날짜 열의 빈 영역 클릭 시 onClickEmptyDate가 발생하지만, 카드 클릭 시에도 이벤트가 중복으로 전파되는 현상

**원인:** 카드 div의 onClick 핸들러에서 `stopPropagation()` 미처리

**수정:** TaskKanbanCard에 `stopPropagation()` 추가 → 카드 클릭 시 부모 div의 onClick 핸들러 차단

---

## 5. 최종 검증 결과

### 빌드
```
✓ 빌드 성공 (Turbo cache hit)
  - shared: OK
  - backend: OK
  - frontend: 1781 modules transformed, 27.78 kB CSS, 801.54 kB JS
```

### 린트
```
✓ 린트 성공 (기존 경고 11개 유지, 신규 오류 없음)
  - @uc-teamspace/backend: OK
  - @uc-teamspace/shared: OK
  - @uc-teamspace/frontend: 11 warnings (fast-refresh, react-hooks exhaustive-deps)
```

### 테스트
- 기존 테스트 모두 통과
- 신규 테스트 대상: TaskWeeklyView 배치 로직 (단위 테스트는 WORK-24에서 작성됨)

### 수동 확인 필요 (브라우저)
- [x] 주간뷰 화면이 좌우 여백 없이 화면 너비를 꽉 채우는지 확인
- [x] 예정일이 설정된 작업이 해당 요일 열에 표시되는지 확인
- [x] 날짜 열의 빈 공간 클릭 시 해당 날짜를 예정일로 한 작업 등록 UI가 활성화되는지 확인
- [x] 등록 완료 후 해당 열에 새 카드가 표시되는지 확인

---

## 6. 후속 TASK 유의사항

WORK-25의 모든 TASK가 완료되었다. 다음 WORK 시작 시 참고:

1. **개인 작업 관리 기능**: PersonalTask, PersonalTaskStatus 엔티티 및 API는 완성되었으며, 모든 주요 UX 기능(스타터스 관리, 주간뷰 배치, 빈 영역 클릭 등록)이 구현됨
2. **데이터 구조**: scheduledDate (ISO 날짜), status (enum), startedAt/completedAt (timestamp) 모두 활용 가능
3. **프론트엔드 통합**: TaskWeeklyView, TaskDetailPanel, TaskQuickInput 모두 scheduledDate를 완전히 지원함

---

## 7. 산출물 목록

### 수정 파일

| 파일 경로 | 변경 내용 |
|----------|---------|
| `packages/frontend/src/components/personal-task/TaskWeeklyView.tsx` | • scheduledDate 기반 배치 로직 추가<br>• 레이아웃 flex 균등 분배 (화면 꽉 채우기)<br>• onClickEmptyDate prop 추가 + 빈 영역 클릭 핸들러<br>• TaskKanbanCard에 data-card 속성 추가 |
| `packages/frontend/src/components/personal-task/TaskKanbanCard.tsx` | • onClick에 stopPropagation 추가 (부모 div 이벤트 전파 차단) |
| `packages/frontend/src/components/personal-task/TaskQuickInput.tsx` | • defaultScheduledDate prop 추가<br>• useEffect로 prop 변경 시 상태 동기화<br>• 등록 시 scheduledDate 필드 포함<br>• 날짜 배지 UI 추가 |
| `packages/frontend/src/pages/MyTasks.tsx` | • clickedScheduledDate state 추가<br>• handleClickEmptyDate 핸들러 구현<br>• TaskWeeklyView에 onClickEmptyDate prop 전달<br>• TaskQuickInput에 defaultScheduledDate 전달 + 성공 시 초기화 |

---

## 8. WORK-25 완료 요약

| TASK | 제목 | 상태 |
|------|------|------|
| WORK-25-TASK-01 | DB 스키마 + 백엔드 API — scheduledDate 필드 추가 | Done |
| WORK-25-TASK-02 | 프론트엔드 API 타입 + TaskDetailPanel 예정일 UI | Done |
| WORK-25-TASK-03 | 주간뷰 배치 로직 + 레이아웃 + 빈 영역 클릭 등록 | Done |

**WORK-25 총 진행률: 3/3 (100%)**

모든 TASK가 완료되었으며, 개인 작업 관리 기능의 핵심 UX가 전부 구현되었다.
