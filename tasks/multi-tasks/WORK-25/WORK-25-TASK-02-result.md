# WORK-25-TASK-02 결과 보고서

> WORK: 주간뷰 예정일 기반 작업 배치 + UX 개선
> 완료: 2026-03-05
> 상태: **완료**

---

## 1. 작업 개요

프론트엔드 API 타입에 `scheduledDate` 필드를 추가하고, TaskDetailPanel에 예정일 입력 필드를 제공하여 사용자가 작업의 예정일을 설정할 수 있도록 했다.

---

## 2. 완료 기준 달성 현황

- [x] API 타입 수정 (PersonalTask, CreatePersonalTaskDto, UpdatePersonalTaskDto에 scheduledDate 추가)
- [x] TaskDetailPanel에 예정일 입력 필드 추가 (Calendar 아이콘, date input)
- [x] 변경 시 updateMutation 호출로 서버에 저장
- [x] 빌드 성공 (bun run build)
- [x] 린트 통과 (bun run lint)
- [x] 테스트 통과 (185 pass, 0 fail)

---

## 3. 체크리스트 완료 현황

### 3.1 API 타입 수정 (personal-task.api.ts)
- [x] `PersonalTask` 인터페이스에 `scheduledDate?: string` 추가
- [x] `CreatePersonalTaskDto`에 `scheduledDate?: string` 추가
- [x] `UpdatePersonalTaskDto`에 `scheduledDate?: string | null` 추가

### 3.2 TaskDetailPanel — 예정일 필드 추가
- [x] 마감일(dueDate) 필드 아래에 예정일(scheduledDate) 입력 섹션 추가
- [x] `type="date"` input 사용, 레이블: "예정일" (Calendar 아이콘 포함)
- [x] 값 변경 시 `updateMutation.mutate()` 호출
- [x] dueDate와 동일한 스타일 적용 (selectStyle)

### 3.3 빌드 및 린트
- [x] `bun run build` 성공
- [x] `bun run lint` 오류 없음 (기존 warnings만 유지)

---

## 4. 발견 이슈 및 수정 내역

발견된 이슈 없음. 계획대로 타입 추가 및 UI 필드 적용이 완료됨.

---

## 5. 최종 검증 결과

### 빌드 결과
```
$ bun run build
✓ frontend:build: vite build ✓ built in 10.18s
✓ backend:build: nest build
✓ shared:build: tsc
Tasks: 3 successful, 3 total
```

### 린트 결과
```
✓ 0 errors
✓ 11 warnings (기존 warnings 유지, 신규 오류 없음)
```

### 테스트 결과
```
✓ 185 pass
✓ 0 fail
Ran 185 tests across 17 files
```

---

## 6. 후속 TASK 유의사항

- TASK-03에서 주간뷰에 예정일 기반 배치 로직을 구현할 때, `scheduledDate` 필드를 참고하여 작업을 렌더링한다
- TaskDetailPanel의 예정일 필드는 마감일과 독립적으로 동작하므로 두 필드 모두 표시된다

---

## 7. 산출물 목록

### 수정 파일

| 파일 경로 | 변경 내용 |
|-----------|---------|
| `packages/frontend/src/api/personal-task.api.ts` | PersonalTask, CreatePersonalTaskDto, UpdatePersonalTaskDto 인터페이스에 `scheduledDate?: string` 필드 추가 |
| `packages/frontend/src/components/personal-task/TaskDetailPanel.tsx` | 마감일 필드 아래에 예정일(scheduledDate) date input 필드 추가, Calendar 아이콘 포함, 변경 시 updateMutation 호출 |

---

## Commit Info
> Status: **완료**
> Commit: `ea5ddd5`
