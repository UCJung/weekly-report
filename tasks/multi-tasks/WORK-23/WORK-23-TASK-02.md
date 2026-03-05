# WORK-23-TASK-02: 백엔드 — 개인 작업 CRUD + 상태 전환 API

> **Phase:** 2
> **선행 TASK:** WORK-23-TASK-01
> **목표:** personal-task 모듈을 신규 생성하고 개인 작업 CRUD, 상태 전환(toggle-done), DnD 정렬(reorder) API를 구현하며 app.module.ts에 등록한다

---

## Step 1 — 계획서

### 1.1 작업 범위

`packages/backend/src/personal-task/` 디렉터리를 신규 생성하고 module, controller, service, DTO 파일 전체를 구현한다. 개인 작업 목록 조회(필터/검색/정렬), 생성, 수정, 소프트 삭제, 빠른 완료 전환(toggle-done), DnD 정렬(reorder) API를 제공한다. 반복 작업 자동 생성 로직은 서비스 레이어에 분리하여 구현한다. 구현 완료 후 `app.module.ts`에 `PersonalTaskModule`을 등록한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| Module | `packages/backend/src/personal-task/personal-task.module.ts` |
| Controller | `packages/backend/src/personal-task/personal-task.controller.ts` |
| Service | `packages/backend/src/personal-task/personal-task.service.ts` |
| DTO | `packages/backend/src/personal-task/dto/create-personal-task.dto.ts` |
| DTO | `packages/backend/src/personal-task/dto/update-personal-task.dto.ts` |
| DTO | `packages/backend/src/personal-task/dto/list-personal-tasks-query.dto.ts` |
| DTO | `packages/backend/src/personal-task/dto/reorder-personal-tasks.dto.ts` |
| 수정 | `packages/backend/src/app.module.ts` — PersonalTaskModule 등록 |

---

## Step 2 — 체크리스트

### 2.1 DTO 구현

- [ ] `CreatePersonalTaskDto`: `title(string, 필수)`, `memo(string?, optional)`, `projectId(string?, optional)`, `priority(TaskPriority, 기본 MEDIUM)`, `dueDate(Date?, optional)`, `repeatConfig(object?, optional)`, `teamId(string, 필수)` — class-validator 데코레이터 포함
- [ ] `UpdatePersonalTaskDto`: CreatePersonalTaskDto의 모든 필드를 optional로 + `status(TaskStatus, optional)`, `sortOrder(number, optional)` — PartialType(CreatePersonalTaskDto) 활용
- [ ] `ListPersonalTasksQueryDto`: `teamId(string, 필수)`, `status(string, optional, ALL/TODO/IN_PROGRESS/DONE)`, `projectId(string?, optional)`, `priority(TaskPriority?, optional)`, `period(string?, optional, today/this-week/this-month/overdue)`, `q(string?, optional)`, `sortBy(string, 기본 dueDate)` — class-validator 데코레이터 포함
- [ ] `ReorderPersonalTasksDto`: `teamId(string, 필수)`, `orderedIds(string[], 필수)` — IsArray, IsString 데코레이터 포함

### 2.2 Service 구현

- [ ] `findAll(memberId, query)`: 필터(status/projectId/priority/period/q) + 정렬(dueDate/priority/createdAt/project) + `isDeleted: false` 조건 포함 조회
- [ ] `findAll` — `period` 필터 처리: `today`(오늘 자정~내일 자정), `this-week`(이번 주 월~일), `this-month`(이번 달), `overdue`(dueDate < 오늘, status != DONE)
- [ ] `findAll` — 반복 작업 자동 생성 로직: `createRecurringTasksIfNeeded(memberId, teamId)` 별도 메서드로 분리
- [ ] `create(memberId, dto)`: 새 PersonalTask 생성, sortOrder 최댓값 + 1 자동 설정
- [ ] `update(id, memberId, dto)`: 본인 소유 확인 후 수정 (소유 아닐 시 ForbiddenException)
- [ ] `softDelete(id, memberId)`: `isDeleted: true` 처리 (본인 소유 확인 필수)
- [ ] `toggleDone(id, memberId)`: `TODO/IN_PROGRESS → DONE` (completedAt = now()), `DONE → TODO` (completedAt = null) 전환
- [ ] `reorder(memberId, teamId, orderedIds)`: orderedIds 순서대로 sortOrder 일괄 업데이트 (`$transaction` 사용)
- [ ] `createRecurringTasksIfNeeded(memberId, teamId)`: repeatConfig가 있는 작업 중 해당 주/일에 인스턴스가 없으면 생성

### 2.3 Controller 구현

- [ ] `GET /api/v1/personal-tasks` — `findAll` 호출, JwtAuthGuard 적용, CurrentUser로 memberId 추출
- [ ] `POST /api/v1/personal-tasks` — `create` 호출
- [ ] `PATCH /api/v1/personal-tasks/reorder` — `reorder` 호출 (특정 ID 앞에 라우트 선언 필수)
- [ ] `PATCH /api/v1/personal-tasks/:id` — `update` 호출
- [ ] `DELETE /api/v1/personal-tasks/:id` — `softDelete` 호출
- [ ] `PATCH /api/v1/personal-tasks/:id/toggle-done` — `toggleDone` 호출
- [ ] 모든 엔드포인트 응답은 `{ success: true, data: ... }` 형식 (ResponseInterceptor 자동 적용)

### 2.4 Module 구현

- [ ] `PersonalTaskModule` 생성: PrismaModule, PrismaService import
- [ ] `app.module.ts`에 `PersonalTaskModule` import 등록

### 2.5 테스트

- [ ] `POST /api/v1/personal-tasks` 작업 생성 API 동작 확인
- [ ] `GET /api/v1/personal-tasks?teamId=...` 목록 조회 API 동작 확인
- [ ] `PATCH /api/v1/personal-tasks/:id/toggle-done` 상태 전환 동작 확인
- [ ] `DELETE /api/v1/personal-tasks/:id` 소프트 삭제 후 목록에서 제외 확인
- [ ] 타인 작업 수정 시 403 Forbidden 응답 확인
- [ ] 백엔드 빌드 오류 없음

---

## Step 3 — 완료 검증

```bash
# 1. 백엔드 빌드 확인
cd packages/backend
bun run build

# 2. 개발 서버 기동
bun run start:dev &

# 3. 토큰 발급 (테스트용)
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hong@example.com","password":"Test1234!"}' \
  | jq -r '.data.accessToken')

# 4. 작업 생성
curl -s -X POST http://localhost:3000/api/v1/personal-tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트 작업","teamId":"<teamId>","priority":"HIGH"}' | jq .

# 5. 목록 조회
curl -s "http://localhost:3000/api/v1/personal-tasks?teamId=<teamId>" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 6. toggle-done
TASK_ID="<taskId>"
curl -s -X PATCH "http://localhost:3000/api/v1/personal-tasks/$TASK_ID/toggle-done" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 7. 전체 빌드
cd ../..
bun run build
```
