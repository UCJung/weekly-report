# WORK-23-TASK-06: 통합 검증 + 빌드 정비

> **Phase:** 5
> **선행 TASK:** WORK-23-TASK-05
> **목표:** 전체 빌드·린트·테스트를 실행하여 오류를 수정하고, WORK-23에서 구현한 기능의 통합 동작을 최종 검증한다

---

## Step 1 — 계획서

### 1.1 작업 범위

모노레포 전체 빌드(`bun run build`), 린트(`bun run lint`), 테스트(`bun run test`)를 순서대로 실행하고 발생하는 모든 오류를 수정한다. 백엔드 E2E 테스트로 개인 작업 CRUD 흐름, 주간업무 연동, 권한 검사(RBAC)를 검증한다. 프론트엔드 단위 테스트로 TaskItem 컴포넌트 렌더링과 usePersonalTasks 훅 동작을 확인한다. 수동 확인이 필요한 UI 항목은 보고서에 명시한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| 테스트 | `packages/backend/test/personal-task.e2e-spec.ts` — E2E 테스트 |
| 테스트 | `packages/frontend/src/components/personal-task/TaskItem.test.tsx` — 단위 테스트 |
| 결과 | `tasks/multi-tasks/WORK-23/WORK-23-TASK-06-result.md` — 최종 검증 보고서 |

---

## Step 2 — 체크리스트

### 2.1 전체 빌드 검증

- [ ] 루트 `bun run build` 성공 (빌드 오류 0건)
- [ ] `packages/backend bun run build` 성공
- [ ] `packages/frontend bun run build` 성공
- [ ] `packages/frontend bunx tsc --noEmit` 타입 오류 0건

### 2.2 린트 검증

- [ ] 루트 `bun run lint` 성공 (린트 오류 0건)
- [ ] `packages/backend` 린트 오류 0건
- [ ] `packages/frontend bun run lint` 오류 0건

### 2.3 백엔드 E2E 테스트 작성 및 실행

- [ ] `personal-task.e2e-spec.ts` 생성
- [ ] 테스트 시나리오: 작업 생성 (`POST /api/v1/personal-tasks`)
- [ ] 테스트 시나리오: 목록 조회 — 생성된 작업 포함 확인 (`GET /api/v1/personal-tasks?teamId=...`)
- [ ] 테스트 시나리오: 작업 수정 (`PATCH /api/v1/personal-tasks/:id`)
- [ ] 테스트 시나리오: toggle-done — `TODO → DONE` 전환 확인
- [ ] 테스트 시나리오: 소프트 삭제 후 목록 제외 확인
- [ ] 테스트 시나리오: reorder — 순서 변경 후 sortOrder 반영 확인
- [ ] 테스트 시나리오: summary API — 4개 카운트 필드 반환 확인
- [ ] 테스트 시나리오: 타인 작업 수정 시 403 Forbidden 확인
- [ ] 테스트 시나리오: MEMBER 권한으로 part-overview 호출 시 403 확인
- [ ] `bun run test:e2e` 전체 통과

### 2.4 프론트엔드 단위 테스트 작성 및 실행

- [ ] `TaskItem.test.tsx` 생성
- [ ] 테스트: TODO 상태일 때 체크박스 unchecked 렌더링 확인
- [ ] 테스트: DONE 상태일 때 체크박스 checked + 제목 취소선 렌더링 확인
- [ ] 테스트: 마감 초과 + 미완료 상태일 때 마감일 `--danger` 색상 적용 확인
- [ ] 테스트: 행 클릭 시 `onSelect` 콜백 호출 확인
- [ ] `bun run test` 전체 통과

### 2.5 통합 동작 수동 확인 (보고서에 "수동 확인 필요" 항목으로 명시)

- [ ] 사이드바 "내 작업" 메뉴 클릭 → `/my-tasks` 페이지 이동
- [ ] TaskQuickInput에서 Enter로 작업 추가 → 목록 즉시 반영
- [ ] TaskItem 체크박스 클릭 → 낙관적 업데이트로 즉시 완료 표시
- [ ] TaskList DnD 드래그 → 순서 변경 → reorder API 호출 확인
- [ ] TaskDetailPanel 메모 수정 → debounce 500ms 후 자동저장
- [ ] Dashboard 작업 요약 위젯 카운트 정확성 확인
- [ ] MyWeeklyReport "내 작업에서 가져오기" → 모달 → 선택 → 반영 흐름
- [ ] 팀 전환 시 내 작업 목록 갱신 (다른 teamId로 필터)

### 2.6 최종 정리

- [ ] 불필요한 console.log 제거
- [ ] 하드코딩된 HEX 색상 없음 확인 (CSS 변수만 사용)
- [ ] 하드코딩된 teamId / memberId 없음 확인
- [ ] PROGRESS.md 최종 업데이트 (모든 TASK Status = Done, 커밋 해시 기록)

### 2.7 테스트

- [ ] `bun run build` 빌드 오류 0건
- [ ] `bun run lint` 린트 오류 0건
- [ ] `bun run test` 테스트 전체 통과
- [ ] `bun run test:e2e` E2E 테스트 전체 통과

---

## Step 3 — 완료 검증

```bash
# 1. 전체 빌드
bun run build

# 2. 전체 린트
bun run lint

# 3. 전체 테스트
bun run test

# 4. 백엔드 E2E 테스트
cd packages/backend
bun run test:e2e -- --testPathPattern=personal-task

# 5. 프론트엔드 단위 테스트
cd packages/frontend
bun run test -- TaskItem

# 6. 타입 체크
bunx tsc --noEmit

# 7. 빌드 결과 최종 확인 (루트)
cd ../..
bun run build 2>&1 | tail -20
```
