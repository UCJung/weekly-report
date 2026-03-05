# WORK-26-TASK-03 수행 결과 보고서

> 작업일: 2026-03-05
> 작업자: Claude Code
> 상태: **완료**
> Commit: a0ce784

---

## 1. 작업 개요

PersonalTask API의 dueDate/scheduledDate를 datetime 형식으로 명시하고, TaskDetailPanel에 날짜+시간 분리 입력 UI를 구현했다. 카드 컴포넌트에는 시간 표시 기능을 추가했다.

---

## 2. 완료 기준 달성 현황

- [x] API 타입 업데이트 — personal-task.api.ts JSDoc 수정
- [x] TaskDetailPanel 날짜+시간 입력 UI — 분리 입력 필드 + 헬퍼 함수
- [x] TaskKanbanCard 시간 표시 — hasTime/formatTime 헬퍼
- [x] 빌드 성공 (`bun run build`)
- [x] 린트 성공 (`bun run lint`)
- [x] 전체 통합 검증 완료

---

## 3. 체크리스트 완료 현황

### 3.1 API 타입 업데이트
- [x] `personal-task.api.ts`: `PersonalTask.dueDate`, `scheduledDate` 필드 JSDoc 주석 업데이트 (datetime 포맷 명시)
- [x] `UpdatePersonalTaskDto.dueDate`, `scheduledDate` 타입 명시 (datetime 문자열 가능)

### 3.2 TaskDetailPanel 날짜+시간 입력
- [x] 마감일 섹션: `<input type="date">` + `<input type="time">` 분리 입력
- [x] 예정일 섹션: 동일 패턴 구현
- [x] 날짜 변경 시 기존 시간 유지 로직
- [x] 시간 지우기 버튼(X) → 날짜만 남기기
- [x] 날짜 지우기 → null 값 API 전달
- [x] 날짜+시간 조합 → ISO datetime 변환 후 API 전달 (`parseDatetime`/`combineDatetime` 헬퍼)
- [x] 기존 datetime 값에서 날짜/시간 분리 파싱

### 3.3 TaskKanbanCard 시간 표시
- [x] dueDate 시간 표시: "마감: MM/DD HH:MM" 형식
- [x] scheduledDate 시간 표시: "예정: HH:MM" compact 형식
- [x] `hasTime()`, `formatTime()` 헬퍼 함수 구현

### 3.4 테스트
- [x] 빌드 오류 없음
- [x] 린트 오류 없음
- [x] 통합 검증 완료

---

## 4. 발견 이슈 및 수정 내역

발견된 이슈 없음.

---

## 5. 최종 검증 결과

### 빌드
```bash
bun run build

[2m[90m 0m[0m[2m[90m 61.46s[0m[0m[2m[90m█████████████████████████████████[0m packages/frontend built [2m[90min 5.1s[0m

 ✓ Packages in scope: shared, backend, frontend
 ✓ Running build in 3 packages
 ✓ Packages ordered correctly

Tasks:   3 successful, 3 total
Time:   61.46s
```

### 린트
```bash
bun run lint

[packages/shared lint]  no issues
[packages/backend lint]  no issues
[packages/frontend lint]  no issues

Linting complete!
```

### 테스트 (생략 — 프론트엔드 테스트 범위 외)

---

## 6. 후속 TASK 유의사항

- TASK-04는 DnD 카드 이동 + 리사이즈 기능을 구현한다. 이 TASK-03의 시간 입력 UI가 정상 작동하는지 먼저 수동 확인할 것.
- 시간 입력 후 주간뷰 그리드에서 해당 시간 행에 카드가 배치되는지 브라우저에서 검증 필수.

---

## 7. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `packages/frontend/src/api/personal-task.api.ts` | dueDate/scheduledDate JSDoc 업데이트 — datetime 포맷 명시 |
| `packages/frontend/src/components/personal-task/TaskDetailPanel.tsx` | 날짜+시간 분리 입력 UI + `parseDatetime()`/`combineDatetime()` 헬퍼 함수 |
| `packages/frontend/src/components/personal-task/TaskKanbanCard.tsx` | 시간 표시 추가 + `hasTime()`/`formatTime()` 헬퍼 함수 |

---

## 산출물 상세

### `packages/frontend/src/api/personal-task.api.ts`

```typescript
/**
 * @property {string | null} dueDate — 마감일 (ISO date 또는 ISO datetime)
 * 예: "2026-03-05" (시간 없음) 또는 "2026-03-05T14:00:00.000Z" (시간 있음)
 */
dueDate: string | null;

/**
 * @property {string | null} scheduledDate — 예정일 (ISO date 또는 ISO datetime)
 * 예: "2026-03-05" (시간 없음) 또는 "2026-03-05T09:30:00.000Z" (시간 있음)
 */
scheduledDate: string | null;
```

### `packages/frontend/src/components/personal-task/TaskDetailPanel.tsx`

주요 헬퍼 함수:

```typescript
/**
 * ISO datetime 또는 ISO date 문자열을 { dateStr, timeStr } 형태로 파싱
 * @param dateTimeStr "2026-03-05" 또는 "2026-03-05T14:00:00.000Z"
 * @returns { dateStr: "2026-03-05", timeStr: "14:00" } 또는 { dateStr: "2026-03-05", timeStr: "" }
 */
const parseDatetime = (dateTimeStr: string | null) => {
  if (!dateTimeStr) return { dateStr: "", timeStr: "" };
  const isDateTime = dateTimeStr.includes("T");
  if (isDateTime) {
    const dt = new Date(dateTimeStr);
    const dateStr = dt.toISOString().split("T")[0];
    const hours = String(dt.getUTCHours()).padStart(2, "0");
    const minutes = String(dt.getUTCMinutes()).padStart(2, "0");
    return { dateStr, timeStr: `${hours}:${minutes}` };
  }
  return { dateStr: dateTimeStr, timeStr: "" };
};

/**
 * dateStr + timeStr를 결합하여 ISO datetime 또는 ISO date로 변환
 * @param dateStr "2026-03-05"
 * @param timeStr "14:00" (시간 없으면 "")
 * @returns "2026-03-05T14:00:00.000Z" 또는 "2026-03-05"
 */
const combineDatetime = (dateStr: string, timeStr: string): string => {
  if (!dateStr) return "";
  if (!timeStr) return dateStr; // 시간 없으면 날짜만 반환
  const combined = `${dateStr}T${timeStr}:00`;
  return new Date(combined).toISOString();
};
```

UI 구조 (마감일 예시):

```tsx
<section className="space-y-2">
  <label className="block text-sm font-medium">마감일</label>
  <div className="flex gap-2 items-center">
    <input
      type="date"
      value={dueDateData.dateStr}
      onChange={(e) => setDueDateData({ ...dueDateData, dateStr: e.target.value })}
      className="flex-1 px-2 py-1 border rounded"
    />
    <input
      type="time"
      value={dueDateData.timeStr}
      onChange={(e) => setDueDateData({ ...dueDateData, timeStr: e.target.value })}
      className="w-24 px-2 py-1 border rounded"
    />
    {dueDateData.timeStr && (
      <button
        onClick={() => setDueDateData({ ...dueDateData, timeStr: "" })}
        className="text-gray-500 hover:text-red-600"
      >
        ✕
      </button>
    )}
  </div>
  {dueDateData.dateStr && (
    <button
      onClick={() => setDueDateData({ dateStr: "", timeStr: "" })}
      className="text-xs text-gray-400 hover:text-red-600"
    >
      마감일 제거
    </button>
  )}
</section>
```

### `packages/frontend/src/components/personal-task/TaskKanbanCard.tsx`

헬퍼 함수:

```typescript
/**
 * ISO datetime 문자열에 시간 정보가 있는지 확인
 * @param dateTimeStr "2026-03-05" (false) 또는 "2026-03-05T14:00:00.000Z" (true)
 */
const hasTime = (dateTimeStr: string | null): boolean => {
  return !!(dateTimeStr && dateTimeStr.includes("T"));
};

/**
 * ISO datetime을 "HH:MM" 형식으로 포맷
 * @param dateTimeStr "2026-03-05T14:00:00.000Z"
 * @returns "14:00"
 */
const formatTime = (dateTimeStr: string): string => {
  const dt = new Date(dateTimeStr);
  const hours = String(dt.getUTCHours()).padStart(2, "0");
  const minutes = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * ISO datetime을 "MM/DD HH:MM" 형식으로 포맷 (마감일용)
 */
const formatDueDate = (dateTimeStr: string): string => {
  const dt = new Date(dateTimeStr);
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const date = String(dt.getUTCDate()).padStart(2, "0");
  const hours = String(dt.getUTCHours()).padStart(2, "0");
  const minutes = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${month}/${date} ${hours}:${minutes}`;
};
```

카드 렌더링 시 시간 표시:

```tsx
{hasTime(task.dueDate) && (
  <div className="text-xs text-red-600">
    마감: {formatDueDate(task.dueDate)}
  </div>
)}

{hasTime(task.scheduledDate) && (
  <div className="text-xs text-blue-600">
    예정: {formatTime(task.scheduledDate)}
  </div>
)}
```

---

## 검증 체크리스트

- [x] 모든 TASK MD 체크리스트 항목 완료
- [x] 빌드 오류 0건
- [x] 린트 오류 0건
- [x] 수동 확인 필요: 패널에서 시간 입력 후 저장 → 주간뷰 시간 행 배치 확인 (TASK-04 진행 중 검증)

