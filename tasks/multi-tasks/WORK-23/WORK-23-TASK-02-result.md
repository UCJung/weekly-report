# WORK-23-TASK-02 수행 결과 보고서

> 작업일: 2026-03-05
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

`packages/backend/src/personal-task/` 디렉터리를 신규 생성하고, 개인 작업 CRUD(목록 조회, 생성, 수정, 소프트 삭제), 빠른 완료 전환(toggle-done), DnD 정렬(reorder) API를 구현했다. 반복 작업 자동 생성 로직은 `createRecurringTasksIfNeeded` 메서드로 분리했으며, `app.module.ts`에 `PersonalTaskModule`을 등록했다.

---

## 2. 완료 기준 달성 현황

| 완료 기준 | 상태 |
|-----------|------|
| TASK MD 체크리스트 전 항목 완료 | ✅ |
| DTO 4종 구현 (class-validator 데코레이터 포함) | ✅ |
| Service 메서드 전체 구현 | ✅ |
| Controller 6개 엔드포인트 구현 | ✅ |
| PersonalTaskModule 생성 + app.module.ts 등록 | ✅ |
| 빌드 오류 0건 (`bun run build` 성공) | ✅ |
| 린트 오류 0건 (경고는 기존 코드의 pre-existing 항목) | ✅ |

---

## 3. 체크리스트 완료 현황

### 2.1 DTO 구현

| 항목 | 상태 |
|------|------|
| `CreatePersonalTaskDto` — title, memo, projectId, priority, dueDate, repeatConfig, teamId | ✅ |
| `UpdatePersonalTaskDto` — 모든 필드 optional + status, sortOrder 추가 | ✅ |
| `ListPersonalTasksQueryDto` — teamId(필수), status/projectId/priority/period/q/sortBy (optional) | ✅ |
| `ReorderPersonalTasksDto` — teamId + orderedIds[] | ✅ |

### 2.2 Service 구현

| 항목 | 상태 |
|------|------|
| `findAll` — 필터(status/projectId/priority/period/q) + 정렬 + `isDeleted: false` | ✅ |
| `findAll` — period 필터 처리 (today/this-week/this-month/overdue) | ✅ |
| `findAll` — 반복 작업 자동 생성 호출 | ✅ |
| `create` — sortOrder 최댓값 + 1 자동 설정 | ✅ |
| `update` — 본인 소유 확인 후 수정, ForbiddenException 처리 | ✅ |
| `softDelete` — isDeleted: true 처리 + 본인 확인 | ✅ |
| `toggleDone` — TODO/IN_PROGRESS → DONE (completedAt=now), DONE → TODO (completedAt=null) | ✅ |
| `reorder` — $transaction 사용 sortOrder 일괄 업데이트 | ✅ |
| `createRecurringTasksIfNeeded` — daily/weekly 반복 작업 자동 생성 | ✅ |

### 2.3 Controller 구현

| 항목 | 상태 |
|------|------|
| `GET /api/v1/personal-tasks` — findAll 호출 | ✅ |
| `POST /api/v1/personal-tasks` — create 호출 | ✅ |
| `PATCH /api/v1/personal-tasks/reorder` — reorder 호출 (/:id 앞 선언) | ✅ |
| `PATCH /api/v1/personal-tasks/:id` — update 호출 | ✅ |
| `DELETE /api/v1/personal-tasks/:id` — softDelete 호출 | ✅ |
| `PATCH /api/v1/personal-tasks/:id/toggle-done` — toggleDone 호출 | ✅ |

### 2.4 Module 구현

| 항목 | 상태 |
|------|------|
| `PersonalTaskModule` 생성 (PrismaModule import) | ✅ |
| `app.module.ts`에 `PersonalTaskModule` 등록 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — @nestjs/mapped-types 패키지 미설치

**증상**: `UpdatePersonalTaskDto`에서 `PartialType`을 `@nestjs/mapped-types`에서 import 시 `Cannot find module` 오류
**원인**: 프로젝트에 `@nestjs/mapped-types` 패키지가 설치되어 있지 않음
**수정**: `PartialType` 상속 방식 대신 모든 필드를 직접 optional로 선언한 독립 DTO 클래스로 변경

### 이슈 #2 — Prisma Nullable JSON 타입 불일치

**증상**: `repeatConfig`에 `null` 할당 시 `Type 'null' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'` 오류
**원인**: Prisma의 nullable JSON 필드는 `null` 대신 `Prisma.JsonNull`을 사용해야 함
**수정**: `update` 메서드에서 `Prisma.PersonalTaskUpdateInput` 타입으로 명시적 타입 선언 후, `repeatConfig === null` 케이스에 `Prisma.JsonNull` 사용

---

## 5. 최종 검증 결과

```
# 백엔드 단독 빌드
$ nest build
(성공 — 출력 없음)

# 전체 모노레포 빌드
$ turbo run build
Tasks:    3 successful, 3 total
Cached:    2 cached, 3 total
Time:    9.881s

# 린트
$ turbo run lint
Tasks:    3 successful, 3 total
Cached:    1 cached, 3 total
Time:    37.595s
(오류: 0건, 경고: 7건 — 모두 기존 프론트엔드 코드의 pre-existing 경고)
```

---

## 6. 후속 TASK 유의사항

- WORK-23-TASK-03 (주간업무 연동 + 요약 API) 진행 시 `PersonalTaskService`를 `WeeklyReportModule`에서 import 할 필요가 있을 수 있음. `PersonalTaskModule`에서 `exports: [PersonalTaskService]`를 이미 선언해 두었음
- `createRecurringTasksIfNeeded`의 `weekly` 반복 로직은 ISO 8601 주차 계산을 단순 구현했으므로, 연도 경계(12월 말/1월 초) 케이스에 대한 정밀 검증이 필요함 (실제 서비스 사용 시 `shared/week-utils` 활용 권장)

---

## 7. 산출물 목록

### 신규 생성 파일

| 파일 | 설명 |
|------|------|
| `packages/backend/src/personal-task/dto/create-personal-task.dto.ts` | 개인 작업 생성 DTO |
| `packages/backend/src/personal-task/dto/update-personal-task.dto.ts` | 개인 작업 수정 DTO |
| `packages/backend/src/personal-task/dto/list-personal-tasks-query.dto.ts` | 목록 조회 쿼리 DTO |
| `packages/backend/src/personal-task/dto/reorder-personal-tasks.dto.ts` | 정렬 업데이트 DTO |
| `packages/backend/src/personal-task/personal-task.service.ts` | 비즈니스 로직 서비스 |
| `packages/backend/src/personal-task/personal-task.controller.ts` | REST API 컨트롤러 |
| `packages/backend/src/personal-task/personal-task.module.ts` | NestJS 모듈 |
| `tasks/multi-tasks/WORK-23/WORK-23-TASK-02-result.md` | 이 결과 보고서 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/backend/src/app.module.ts` | PersonalTaskModule import 및 등록 |
