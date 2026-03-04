# WORK-20-TASK-03 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

`part-summary.service.ts`의 `autoMerge` 메서드를 `Member.partId` 직접 사용에서 `TeamMembership` 기반 쿼리로 교체하고, `timesheet.service.ts` 및 `timesheet-stats.service.ts`의 문자열 리터럴(`'DRAFT'`, `'SUBMITTED'`, `'ACTIVE'`)을 Prisma Enum으로 일원화하며, `as any` 캐스팅을 제거하고, `admin.service.spec.ts`에 `ConfigService` mock을 추가하여 테스트를 안정화했다.

---

## 2. 완료 기준 달성 현황

| 기준 항목 | 상태 |
|-----------|------|
| TASK MD 체크리스트 전 항목 완료 | ✅ |
| autoMerge에서 Member.partId 직접 사용 제거 | ✅ |
| TimesheetStatus Enum 일원화 (timesheet.service.ts) | ✅ |
| TimesheetStatus / ProjectStatus / TeamStatus Enum 일원화 (timesheet-stats.service.ts) | ✅ |
| `as any` 캐스팅 제거 (timesheet-stats.service.ts) | ✅ |
| admin.service.spec.ts에 ConfigService mock 추가 | ✅ |
| part-summary.service.spec.ts autoMerge 테스트 보완 | ✅ |
| 빌드 오류 0건 | ✅ |
| 테스트 105개 전부 통과 | ✅ |

---

## 3. 체크리스트 완료 현황

### 2.1 part-summary.service.ts — autoMerge TeamMembership 기반으로 전환

| 항목 | 상태 |
|------|------|
| `autoMerge` 메서드 현재 구현 확인 | ✅ |
| `loadMemberRows` TeamMembership 쿼리 패턴 파악 | ✅ |
| `autoMerge` 수정: `part.findUnique`로 teamId 조회 후 `teamMembership.findMany({ partId, teamId })` | ✅ |
| Part 조회 실패 시 BusinessException 처리 추가 | ✅ |
| 기존 autoMerge 동작(파트 내 멤버 취합)이 동일하게 유지 | ✅ |

### 2.2 part-summary.service.spec.ts — autoMerge 테스트 보완

| 항목 | 상태 |
|------|------|
| `part.findUnique` mock 추가 | ✅ |
| `teamMembership.findMany` mock 추가 | ✅ |
| 기존 autoMerge 테스트 mock 업데이트 | ✅ |
| TeamMembership 기반 동작 검증 테스트 추가 | ✅ |

### 2.3 timesheet.service.ts — TimesheetStatus Enum 일원화

| 항목 | 상태 |
|------|------|
| `TimesheetStatus` import 추가 | ✅ |
| `'DRAFT'` → `TimesheetStatus.DRAFT` | ✅ |
| `'SUBMITTED'` → `TimesheetStatus.SUBMITTED` | ✅ |

### 2.4 timesheet-stats.service.ts — Enum 일원화 및 as any 제거

| 항목 | 상태 |
|------|------|
| `ProjectStatus`, `TeamStatus` import 추가 | ✅ |
| `'ACTIVE'` (Project) → `ProjectStatus.ACTIVE` (2곳) | ✅ |
| `'ACTIVE'` (Team) → `TeamStatus.ACTIVE` | ✅ |
| `'PROJECT_MANAGER'` → `ApprovalType.PROJECT_MANAGER` | ✅ |
| `'APPROVED'` (pmApprovalStatus) → `TimesheetStatus.APPROVED` | ✅ |
| `(ts.member as any).jobTitle` → `ts.member.jobTitle` (select에 이미 포함) | ✅ |

### 2.5 admin.service.ts — ConfigService 주입 정리

| 항목 | 상태 |
|------|------|
| `ConfigService` 사용 현황 파악 (DEFAULT_PASSWORD에만 사용) | ✅ |
| ConfigService 유지 (보안 설정값으로 적절) | ✅ |

### 2.6 admin.service.spec.ts — ConfigService mock 추가

| 항목 | 상태 |
|------|------|
| `mockConfigService` 객체 추가 | ✅ |
| `new AdminService(mockPrisma, mockConfigService)` 수정 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — autoMerge의 teamId 획득 방법

**증상**: `autoMerge`는 `summaryId`만 받으며, `summary.partId`는 있으나 `teamId`는 없어 `TeamMembership` 쿼리에 `teamId`를 사용하기 어려웠다.

**원인**: `findById`가 `partSummary`의 `part` 관계를 포함하지 않음.

**수정**: `autoMerge` 내에서 `part.findUnique({ where: { id: summary.partId! }, select: { teamId: true } })`를 추가하여 teamId를 조회한 후 `teamMembership.findMany({ where: { partId, teamId } })`로 멤버를 조회하도록 수정. 파트가 존재하지 않는 경우 `PART_NOT_FOUND` 예외를 던지도록 방어 처리 추가.

### 이슈 #2 — as any 캐스팅이 불필요했던 이유

**증상**: `(ts.member as any).jobTitle`이 사용됨.

**원인**: `getTeamSummary`의 Prisma include에 `member: { select: { id: true, name: true, position: true, jobTitle: true } }`가 이미 포함되어 있었으나, 이전에 `as any`로 우회하고 있었음.

**수정**: `ts.member.jobTitle`로 직접 접근. `select`에 `jobTitle: true`가 이미 있으므로 Prisma 타입 추론이 올바르게 동작.

---

## 5. 최종 검증 결과

```
# 테스트 결과
bun test src/
105 pass
0 fail
192 expect() calls
Ran 105 tests across 11 files. [4.08s]

# 빌드 결과
$ nest build
(오류 없음)

# autoMerge 레거시 코드 잔존 여부 (결과 없어야 통과)
grep -n "member\.partId\|where.*partId.*member" part-summary.service.ts
→ 196:  partId: member.partId  (getPartWeeklyStatus 반환값의 필드 복사 — 쿼리 필터 아님)

# timesheet 문자열 리터럴 잔존 여부 (결과 없어야 통과)
grep -rn "'DRAFT'|'SUBMITTED'|'APPROVED'|'REJECTED'" timesheet.service.ts timesheet-stats.service.ts
→ (결과 없음)

# as any 잔존 여부 (결과 없어야 통과)
grep -n "as any" timesheet-stats.service.ts
→ (결과 없음)
```

---

## 6. 후속 TASK 유의사항

- `part-summary.service.ts`의 `getPartWeeklyStatus` 및 `getPartSubmissionStatus`는 여전히 `Member.partId` 기반 쿼리를 사용한다. 이 메서드들도 향후 `TeamMembership` 기반으로 전환하면 일관성이 높아진다. (이번 TASK 범위 외)
- `timesheet-stats.service.ts`의 `pmApprovalStatus`는 `string` 타입으로 선언되어 있어 `TimesheetStatus.APPROVED`를 대입하면 타입이 정확하다. 다만, `NOT_APPROVED`는 Enum에 없는 값이므로 현재 구현의 타입 정확성을 확인했다.

---

## 7. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/backend/src/weekly-report/part-summary.service.ts` | `autoMerge` 메서드: `Member.partId` 직접 쿼리 → `part.findUnique` + `teamMembership.findMany` 기반으로 교체; PART_NOT_FOUND 예외 추가 |
| `packages/backend/src/weekly-report/part-summary.service.spec.ts` | `mockPrisma`에 `part.findUnique`, `teamMembership.findMany` mock 추가; `beforeEach` reset 추가; autoMerge 테스트 mock 업데이트; TeamMembership 기반 검증 테스트 추가 |
| `packages/backend/src/timesheet/timesheet.service.ts` | `TimesheetStatus` import 추가; `'DRAFT'` → `TimesheetStatus.DRAFT`, `'SUBMITTED'` → `TimesheetStatus.SUBMITTED` |
| `packages/backend/src/timesheet/timesheet-stats.service.ts` | `ProjectStatus`, `TeamStatus` import 추가; 문자열 리터럴 5곳 Enum으로 교체; `(ts.member as any).jobTitle` → `ts.member.jobTitle` |
| `packages/backend/src/admin/admin.service.spec.ts` | `mockConfigService` 추가; `AdminService` 생성자 호출에 `mockConfigService` 인자 추가 |
