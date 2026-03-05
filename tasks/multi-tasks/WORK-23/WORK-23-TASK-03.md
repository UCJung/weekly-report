# WORK-23-TASK-03: 백엔드 — 주간업무 연동 + 대시보드 요약 API

> **Phase:** 3
> **선행 TASK:** WORK-23-TASK-02
> **목표:** 개인 작업과 주간업무 간 양방향 연동 API(import-to-weekly, import-from-weekly), 개인 요약 API(summary), 파트장/팀장용 건수 요약 API(part-overview, team-overview)를 구현한다

---

## Step 1 — 계획서

### 1.1 작업 범위

TASK-02에서 구현한 `PersonalTaskService`에 주간업무 연동 메서드 2개와 대시보드 요약 메서드 1개, 파트장/팀장용 overview 메서드 2개를 추가한다. import-to-weekly는 선택된 개인 작업을 기존 WeeklyReport의 WorkItem으로 생성하며, import-from-weekly는 주간업무의 planWork 항목을 개인 작업으로 가져온다. summary는 경량 집계 쿼리로 4개 카운트를 반환한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| DTO | `packages/backend/src/personal-task/dto/import-to-weekly-report.dto.ts` |
| DTO | `packages/backend/src/personal-task/dto/import-from-weekly-report.dto.ts` |
| 수정 | `packages/backend/src/personal-task/personal-task.service.ts` — 연동·요약 메서드 추가 |
| 수정 | `packages/backend/src/personal-task/personal-task.controller.ts` — 연동·요약 엔드포인트 추가 |

---

## Step 2 — 체크리스트

### 2.1 DTO 추가

- [ ] `ImportToWeeklyReportDto`: `taskIds(string[], 필수)`, `weekLabel(string, 필수, 형식: "2026-W09")`, `teamId(string, 필수)` — IsArray, IsString, Matches 데코레이터 포함
- [ ] `ImportFromWeeklyReportDto`: `weekLabel(string, 필수)`, `teamId(string, 필수)`, `workItemIds(string[], 필수)` — 동일 데코레이터 포함

### 2.2 import-to-weekly 구현 (완료 작업 → 한일, 진행중 작업 → 할일 반영)

- [ ] `importToWeekly(memberId, dto)` 메서드 구현
- [ ] 대상 작업 조회: `taskIds` 에 해당하는 `PersonalTask` 목록 조회 (본인 소유 + isDeleted: false 확인)
- [ ] 해당 주차 WeeklyReport 조회 또는 생성 (weekLabel → weekStart 변환, 없으면 신규 생성)
- [ ] 각 PersonalTask에 대해 WorkItem 생성:
  - DONE 상태 → `doneWork` = task.title + (memo 있으면 "\n" + memo), `planWork` = ""
  - IN_PROGRESS/TODO 상태 → `doneWork` = "", `planWork` = task.title + (memo 있으면 "\n" + memo)
  - `projectId` 있으면 WorkItem에도 전달
- [ ] 생성된 WorkItem 목록 반환
- [ ] 각 작업의 `linkedWeekLabel` 업데이트

### 2.3 import-from-weekly 구현 (주간업무 할일 → 개인 작업 생성)

- [ ] `importFromWeekly(memberId, dto)` 메서드 구현
- [ ] 해당 주차 WeeklyReport 조회 (없으면 NotFoundException)
- [ ] `workItemIds` 에 해당하는 WorkItem 조회 (본인 소유 확인)
- [ ] 각 WorkItem의 `planWork`를 개인 작업 `title`로 생성 (status: TODO, projectId 유지)
- [ ] 중복 가져오기 방지: 동일 workItemId 기반 개인 작업이 이미 있으면 스킵
- [ ] 생성된 PersonalTask 목록 반환

### 2.4 summary API 구현

- [ ] `getSummary(memberId, teamId)` 메서드 구현
- [ ] `todayCount`: dueDate가 오늘(자정 기준), isDeleted: false, status != DONE 카운트
- [ ] `dueSoonCount`: dueDate가 오늘~3일 이내, isDeleted: false, status != DONE 카운트
- [ ] `thisWeekDoneCount`: completedAt이 이번 주(월~일) 이내, isDeleted: false, status: DONE 카운트
- [ ] `overdueCount`: dueDate < 오늘, isDeleted: false, status != DONE 카운트
- [ ] Prisma `count()` 쿼리 4개를 `Promise.all()`로 병렬 실행

### 2.5 part-overview / team-overview API 구현

- [ ] `getPartOverview(requesterId, teamId)` 메서드 구현
  - 요청자가 PART_LEADER 또는 LEADER인지 확인 (아닐 시 ForbiddenException)
  - PART_LEADER: 소속 파트원만, LEADER: 팀 전체 멤버 대상
  - 멤버별 TODO/IN_PROGRESS/DONE 건수 집계 반환
- [ ] `getTeamOverview(requesterId, teamId)` 메서드 구현
  - 요청자가 LEADER인지 확인 (아닐 시 ForbiddenException)
  - 팀 전체 멤버별 TODO/IN_PROGRESS/DONE 건수 집계 반환

### 2.6 Controller 엔드포인트 추가

- [ ] `POST /api/v1/personal-tasks/import-to-weekly` — `importToWeekly` 호출 (reorder 등 다른 특수 라우트와 함께 `:id` 앞에 선언)
- [ ] `POST /api/v1/personal-tasks/import-from-weekly` — `importFromWeekly` 호출
- [ ] `GET /api/v1/personal-tasks/summary` — `getSummary` 호출, `teamId` 쿼리 파라미터 수신
- [ ] `GET /api/v1/personal-tasks/part-overview` — `getPartOverview` 호출, `teamId` 쿼리 파라미터 수신
- [ ] `GET /api/v1/personal-tasks/team-overview` — `getTeamOverview` 호출, `teamId` 쿼리 파라미터 수신

### 2.7 테스트

- [ ] `POST /api/v1/personal-tasks/import-to-weekly` 호출 시 WeeklyReport에 WorkItem 생성 확인
- [ ] `GET /api/v1/personal-tasks/summary` 응답에 4개 카운트 필드 확인
- [ ] `GET /api/v1/personal-tasks/part-overview` PART_LEADER 권한으로 정상 조회 확인
- [ ] MEMBER 권한으로 part-overview 호출 시 403 응답 확인
- [ ] 백엔드 빌드 오류 없음

---

## Step 3 — 완료 검증

```bash
# 1. 백엔드 빌드
cd packages/backend
bun run build

# 2. 개발 서버 기동
bun run start:dev &

# 3. 로그인 토큰 발급
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hong@example.com","password":"Test1234!"}' \
  | jq -r '.data.accessToken')

# 4. summary API 확인
curl -s "http://localhost:3000/api/v1/personal-tasks/summary?teamId=<teamId>" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. import-to-weekly 확인
curl -s -X POST http://localhost:3000/api/v1/personal-tasks/import-to-weekly \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskIds":["<taskId>"],"weekLabel":"2026-W10","teamId":"<teamId>"}' | jq .

# 6. part-overview 확인 (파트장 계정 사용)
PART_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"choi@example.com","password":"Test1234!"}' \
  | jq -r '.data.accessToken')
curl -s "http://localhost:3000/api/v1/personal-tasks/part-overview?teamId=<teamId>" \
  -H "Authorization: Bearer $PART_TOKEN" | jq .

# 7. 전체 빌드
cd ../..
bun run build
```
