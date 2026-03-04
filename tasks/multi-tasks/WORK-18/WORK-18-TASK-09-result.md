# WORK-18-TASK-09 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

근무시간표 작성 화면(MyTimesheet.tsx)에서 일별 행이 표시되지 않는 critical 버그를 수정하고, 프로젝트 추가 드롭다운을 다중 선택 방식으로 변경했다.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| 시간표 자동 생성 로직 버그 수정 — 월 선택 시 일별 행 생성 | ✅ |
| 프로젝트 다중 선택 드롭다운 — 체크박스 기반 | ✅ |
| 제출 버튼 표시 (시간표 생성 후 자동 표시) | ✅ |
| `bun run build` — 0 에러 | ✅ |
| `bun run lint` — 0 에러 | ✅ |

---

## 3. 체크리스트 완료 현황

### 3.1 시간표 자동 생성 버그 수정
| 항목 | 상태 |
|------|------|
| `if (timesheet !== undefined)` → `if (timesheet)` 수정 | ✅ |
| createMutation 호출 조건 정상 동작 | ✅ |

### 3.2 프로젝트 다중 선택 드롭다운
| 항목 | 상태 |
|------|------|
| `ProjectAddDropdown` → `ProjectMultiSelectDropdown` 변경 | ✅ |
| 이미 추가된 프로젝트 체크 상태 표시 | ✅ |
| 체크 해제 시 프로젝트 제거 (handleRemoveProject) | ✅ |
| "전체 선택" / "전체 해제" 토글 기능 | ✅ |
| 외부 클릭 시 드롭다운 닫힘 | ✅ |
| 선택된 프로젝트 수 배지 표시 | ✅ |

### 3.3 통합 검증
| 항목 | 상태 |
|------|------|
| `bun run build` — 0 에러 | ✅ |
| `bun run lint` — 0 에러 (7 warnings, 기존 동일) | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — 시간표 자동 생성 useEffect 조건 버그
**증상**: 월을 선택해도 일별 행이 전혀 표시되지 않음. 제출 버튼도 안 보임.
**원인**: `if (timesheet !== undefined) return;` — `null !== undefined`이 `true`이므로, API가 `null`을 반환해도 `createMutation.mutate()`에 도달하지 않음. 시간표가 생성되지 않아 entries도 없고, 행도 표시되지 않음.
**수정**: `if (timesheet) return;` — truthy 검사로 변경. `null`일 때 다음 줄의 `if (timesheet === null)` 조건이 정상 실행되어 시간표 생성.

---

## 5. 최종 검증 결과

```
 Tasks:    3 successful, 3 total
Cached:    0 cached, 3 total
  Time:    35.812s
```

**빌드 결과**: 3 packages 모두 성공

```
✖ 7 problems (0 errors, 7 warnings)
```

**린트 결과**: 0 errors, 7 warnings (기존 코드의 pre-existing warnings 동일)

### 수동 확인 필요 항목 (브라우저)
- 월 선택 → 해당 월 1일~말일까지 행 표시 확인
- 프로젝트 선택 드롭다운 → 체크박스 여러 개 선택 가능 확인
- 전체 선택/해제 동작 확인
- 근태 선택 → 투입시간/근무형태 입력 동작 확인
- 제출 버튼 표시 + 클릭 시 제출 동작 확인

---

## 6. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/frontend/src/pages/MyTimesheet.tsx` | 시간표 자동 생성 조건 수정, `ProjectAddDropdown` → `ProjectMultiSelectDropdown` (체크박스 기반 다중 선택), `handleAddProject` → `handleAddProjects` (다중 추가) |

### 신규 생성 파일

| 파일 | 내용 |
|------|------|
| `tasks/multi-tasks/WORK-18/WORK-18-TASK-09.md` | TASK 체크리스트 |
| `tasks/multi-tasks/WORK-18/WORK-18-TASK-09-result.md` | 본 결과 보고서 |
