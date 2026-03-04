# WORK-20-TASK-01 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

백엔드 코드 중복 패턴 3가지를 공통 유틸로 추출하여 재사용성을 높였다.
① `week-utils.ts` 로컬 복사본 삭제 → shared 패키지 일원화,
② pagination 반복 패턴 → `common/utils/pagination.util.ts` 추출,
③ reorder 반복 패턴 → `common/utils/reorder.util.ts` 추출.

---

## 2. 완료 기준 달성 현황

| 기준 | 결과 |
|------|------|
| TASK MD 체크리스트 전 항목 완료 | ✅ (work-item reorder 제외 — 아래 설명) |
| 기존 기능 유지 (기능 브레이킹 없음) | ✅ |
| 빌드 오류 0건 (`bun run build`) | ✅ |
| 단위 테스트 통과 (`bun run test`) | ✅ 104 pass, 0 fail |
| 신규 테스트 작성 (pagination.util.spec.ts) | ✅ |

---

## 3. 체크리스트 완료 현황

### 2.1 week-utils 통합

| 항목 | 결과 |
|------|------|
| 로컬 week-utils.ts 내용 확인 및 shared 패키지와 동일성 검증 | ✅ |
| shared 패키지 export 함수 목록 파악 | ✅ |
| report.service.ts: shared 경로로 교체 | ✅ |
| part-summary.service.ts: shared 경로로 교체 | ✅ |
| carry-forward.service.ts: shared 경로로 교체 | ✅ |
| excel.service.ts: shared 경로로 교체 | ✅ |
| 로컬 week-utils.ts 파일 삭제 | ✅ |

### 2.2 pagination.util.ts 생성

| 항목 | 결과 |
|------|------|
| pagination.util.ts 생성 (parsePagination, buildPaginationResponse) | ✅ |
| admin.service.ts listAccounts 유틸 적용 | ✅ |
| admin.service.ts listTeams 유틸 적용 | ✅ |
| admin.service.ts listProjects 유틸 적용 | ✅ |
| team-join.service.ts listTeams 유틸 적용 | ✅ |
| project.service.ts findAll 유틸 적용 | ✅ |

### 2.3 reorder.util.ts 생성

| 항목 | 결과 |
|------|------|
| reorder.util.ts 생성 (applyReorder 헬퍼) | ✅ |
| team.service.ts reorderParts 적용 | ✅ |
| member.service.ts reorder 적용 | ✅ |
| team-project.service.ts reorderTeamProjects 적용 | ✅ |
| project.service.ts reorder 적용 | ✅ |
| work-item.service.ts reorder 적용 | ⚠️ 적용 불가 (아래 설명) |

### 2.4 테스트

| 항목 | 결과 |
|------|------|
| pagination.util.spec.ts 작성 | ✅ |
| 전체 테스트 통과 | ✅ 104 pass |
| 빌드 확인 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — reorder.util.ts: Prisma $transaction 타입 불일치

**증상**: `prisma.$transaction()` 호출 시 `Promise<T>[]`가 `PrismaPromise<T>[]`에 할당 불가능 오류
**원인**: Prisma의 `$transaction(array)` 오버로드는 `PrismaPromise<T>[]`를 요구하지만, 제네릭 `updateFn` 반환 타입을 `Promise<T>`로 선언했음
**수정**: `reorder.util.ts`의 `updateFn` 반환 타입을 `Prisma.PrismaPromise<T>`로 변경

### 이슈 #2 — work-item.service.ts reorder 유틸 적용 불가

**증상**: work-item reorder는 `{ id, sortOrder }` 쌍 배열을 받아 각 항목의 sortOrder를 클라이언트 지정값으로 설정함
**원인**: `applyReorder`는 `orderedIds: string[]`를 받아 index를 sortOrder로 사용하는 패턴 전용 헬퍼이므로, 임의 sortOrder를 허용하는 work-item reorder에는 의미상 맞지 않음
**결정**: work-item.service.ts의 reorder는 기존 패턴 유지 (클라이언트 지정 sortOrder 사용 특수 케이스)

---

## 5. 최종 검증 결과

```
$ cd packages/backend && bun run build
$ nest build
(성공, 오류 없음)

$ bun run test src/
bun test v1.3.10 (30e609e0)
 104 pass
 0 fail
 190 expect() calls
Ran 104 tests across 11 files. [4.64s]
```

---

## 7. 산출물 목록

### 신규 생성 파일

| 파일 | 설명 |
|------|------|
| `packages/backend/src/common/utils/pagination.util.ts` | parsePagination / buildPaginationResponse 유틸 |
| `packages/backend/src/common/utils/reorder.util.ts` | applyReorder 유틸 |
| `packages/backend/src/common/utils/pagination.util.spec.ts` | pagination 유틸 단위 테스트 |

### 삭제 파일

| 파일 | 설명 |
|------|------|
| `packages/backend/src/weekly-report/week-utils.ts` | shared 패키지로 일원화하여 삭제 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/backend/src/weekly-report/report.service.ts` | week-utils import → shared 경로 |
| `packages/backend/src/weekly-report/part-summary.service.ts` | week-utils import → shared 경로 |
| `packages/backend/src/weekly-report/carry-forward.service.ts` | week-utils import → shared 경로 |
| `packages/backend/src/export/excel.service.ts` | week-utils import → shared 경로 |
| `packages/backend/src/admin/admin.service.ts` | pagination 유틸 적용 (3개 메서드) |
| `packages/backend/src/team/team-join.service.ts` | pagination 유틸 적용 (listTeams) |
| `packages/backend/src/project/project.service.ts` | pagination + reorder 유틸 적용 |
| `packages/backend/src/team/team.service.ts` | applyReorder 유틸 적용 |
| `packages/backend/src/team/member.service.ts` | applyReorder 유틸 적용 |
| `packages/backend/src/team/team-project.service.ts` | applyReorder 유틸 적용 |
