# WORK-18-TASK-09: 근무시간표 작성 화면 버그 수정 + 프로젝트 다중 선택

> 의존성: TASK-06, TASK-08 (완료)
> 우선순위: 긴급 (화면 기본 기능 미동작)

---

## Step 1. 계획

### 1.1 시간표 자동 생성 로직 버그 수정 (Critical)

**현상**: 월을 선택하면 일별 행이 표시되지 않음. 제출 버튼도 안 보임.

**원인**: `MyTimesheet.tsx` useEffect 자동 생성 로직의 조건 오류

```typescript
// 현재 (버그)
if (timesheet !== undefined) return; // null !== undefined → true → 항상 return
if (timesheet === null) { createMutation.mutate(...) } // 도달 불가

// 수정
if (timesheet) return; // 이미 존재하는 경우만 return
createMutation.mutate(...); // null이면 생성 실행
```

### 1.2 프로젝트 다중 선택 드롭다운

**현상**: 프로젝트 추가 드롭다운에서 1개 선택 시 닫힘.

**수정**: 체크박스 기반 다중 선택으로 변경
- 드롭다운 내부에 체크박스 목록
- 체크/해제 시 즉시 반영 (닫히지 않음)
- 드롭다운 상단에 "전체 선택" 옵션 제공
- 외부 클릭 시 드롭다운 닫힘

### 1.3 제출 버튼 동작 확인

시간표 자동 생성 수정 후 제출 버튼은 기존 코드에서 정상 표시될 것.
근태 선택, 투입시간, 근무형태 입력도 기존 코드로 동작할 것.

---

## Step 2. 체크리스트

### 2.1 시간표 자동 생성 버그 수정
- [ ] `MyTimesheet.tsx` useEffect — `if (timesheet !== undefined) return;` → `if (timesheet) return;`
- [ ] createMutation 호출 조건 단순화
- [ ] 월 전환 시 일별 행(1일~말일) 정상 표시 확인

### 2.2 프로젝트 다중 선택 드롭다운
- [ ] `ProjectAddDropdown` → 체크박스 기반 `ProjectMultiSelectDropdown` 으로 변경
- [ ] 이미 추가된 프로젝트는 체크 상태로 표시
- [ ] 체크 해제 시 프로젝트 제거 (handleRemoveProject)
- [ ] "전체 선택" / "전체 해제" 토글 기능
- [ ] 외부 클릭 시 드롭다운 닫힘

### 2.3 통합 검증
- [ ] `bun run build` — 0 에러
- [ ] `bun run lint` — 0 에러

---

## Step 3. 검증 항목

| 항목 | 자동 | 수동 |
|------|:---:|:---:|
| 빌드 성공 | ✅ | |
| 린트 통과 | ✅ | |
| 월 선택 → 일별 행 표시 | | ✅ |
| 프로젝트 다중 선택 동작 | | ✅ |
| 근태 선택 → 투입시간 입력 가능 | | ✅ |
| 프로젝트별 투입시간/근무형태 입력 | | ✅ |
| 제출 버튼 표시 + 동작 | | ✅ |
