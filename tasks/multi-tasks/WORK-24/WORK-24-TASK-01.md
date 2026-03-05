# WORK-24-TASK-01: DB 스키마 + 마이그레이션

> **Phase:** 1
> **선행 TASK:** 없음
> **목표:** TaskStatusDef 모델을 추가하고 PersonalTask.status enum 필드를 statusId FK로 교체하는 3단계 Prisma 마이그레이션을 완료한다

---

## Step 1 — 계획서

### 1.1 작업 범위

기존 `PersonalTask.status` (TaskStatus enum) 필드를 `statusId` (FK → TaskStatusDef) 로 교체한다. 마이그레이션은 데이터 손실 방지를 위해 3단계로 나눠 진행한다. Phase 1에서 테이블/컬럼을 추가하고, Phase 2에서 기존 데이터를 커스텀 SQL로 매핑하고, Phase 3에서 기존 컬럼과 enum을 제거한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| Prisma | `packages/backend/prisma/schema.prisma` — TaskStatusCategory enum, TaskStatusDef 모델 추가; PersonalTask 변경; Team 관계 추가 |
| Migration (Phase 1) | `packages/backend/prisma/migrations/YYYYMMDD_work24_task_status_def/` — TaskStatusDef 테이블 생성, statusId nullable 컬럼 추가 |
| Migration (Phase 2) | `packages/backend/prisma/migrations/YYYYMMDD_work24_task_status_data_migration/` — 기본 상태 INSERT + PersonalTask 데이터 매핑 SQL |
| Migration (Phase 3) | `packages/backend/prisma/migrations/YYYYMMDD_work24_task_status_cleanup/` — statusId NOT NULL, status 컬럼 삭제, TaskStatus enum 삭제 |

---

## Step 2 — 체크리스트

### 2.1 신규 Enum: TaskStatusCategory

- [ ] `TaskStatusCategory` enum 추가: `BEFORE_START`, `IN_PROGRESS`, `COMPLETED`
- [ ] `@@map("task_status_category")` 적용

### 2.2 신규 모델: TaskStatusDef

- [ ] `id String @id @default(cuid())` 필드
- [ ] `teamId String` 필드 + `team Team @relation(fields: [teamId], references: [id])` 관계
- [ ] `name String` 필드 (최대 20자, 상태명)
- [ ] `category TaskStatusCategory` 필드
- [ ] `color String @default("#6B5CE7")` 필드 (HEX 색상)
- [ ] `sortOrder Int @default(0)` 필드
- [ ] `isDefault Boolean @default(false)` 필드 (카테고리별 대표 상태)
- [ ] `isDeleted Boolean @default(false)` 필드 (소프트 삭제)
- [ ] `createdAt DateTime @default(now())` 필드
- [ ] `updatedAt DateTime @updatedAt` 필드
- [ ] `personalTasks PersonalTask[]` 역관계 추가
- [ ] `@@index([teamId, sortOrder])` 인덱스
- [ ] `@@index([teamId, category])` 인덱스
- [ ] `@@map("task_status_defs")` 테이블명 적용

### 2.3 PersonalTask 모델 변경

- [ ] `statusId String` 필드 추가 (Phase 1에서는 nullable: `statusId String?`)
- [ ] `taskStatus TaskStatusDef @relation(fields: [statusId], references: [id])` 관계 추가
- [ ] 기존 `status TaskStatus` 필드는 Phase 3까지 유지 (Phase 1~2 동안 동시 존재)
- [ ] `@@index([memberId, teamId, status])` → Phase 3에서 `@@index([memberId, teamId, statusId])`로 교체

### 2.4 Team 모델 관계 추가

- [ ] `Team` 모델에 `taskStatusDefs TaskStatusDef[]` 관계 추가

### 2.5 마이그레이션 Phase 1 — 테이블/컬럼 추가

- [ ] `bunx prisma migrate dev --name work24_task_status_def` 실행 성공
- [ ] `task_status_defs` 테이블 생성 확인
- [ ] `personal_tasks.statusId` nullable 컬럼 추가 확인
- [ ] `bunx prisma generate` 실행 성공

### 2.6 마이그레이션 Phase 2 — 데이터 마이그레이션 (커스텀 SQL)

- [ ] 마이그레이션 파일 생성: `bunx prisma migrate dev --name work24_task_status_data_migration --create-only`
- [ ] 마이그레이션 SQL 작성: 각 팀별 기본 3상태 INSERT (카테고리별 isDefault = true)
  - BEFORE_START: `{ name: '할일', color: '#6C7A89', isDefault: true }`
  - IN_PROGRESS: `{ name: '진행중', color: '#6B5CE7', isDefault: true }`
  - COMPLETED: `{ name: '완료', color: '#27AE60', isDefault: true }`
- [ ] 마이그레이션 SQL 작성: PersonalTask.status → statusId 매핑
  - `TODO` → 해당 팀의 BEFORE_START isDefault 상태 id
  - `IN_PROGRESS` → 해당 팀의 IN_PROGRESS isDefault 상태 id
  - `DONE` → 해당 팀의 COMPLETED isDefault 상태 id
- [ ] `bunx prisma migrate deploy` (또는 `migrate dev`) 로 Phase 2 마이그레이션 실행
- [ ] PersonalTask 전체 레코드에 statusId 값 채워짐 확인

### 2.7 마이그레이션 Phase 3 — 컬럼 정리

- [ ] `schema.prisma`에서 `PersonalTask.status` 필드 제거
- [ ] `schema.prisma`에서 `TaskStatus` enum 제거
- [ ] `PersonalTask.statusId` nullable 제거 (필수 필드로 변경)
- [ ] `@@index([memberId, teamId, status])` → `@@index([memberId, teamId, statusId])` 교체
- [ ] `bunx prisma migrate dev --name work24_task_status_cleanup` 실행 성공
- [ ] `bunx prisma generate` 재실행

### 2.8 최종 검증

- [ ] `bunx prisma migrate status` — 모든 마이그레이션 Applied 확인
- [ ] `personal_tasks` 테이블에 `status` 컬럼 없음 확인
- [ ] `personal_tasks` 테이블에 `status_id` 컬럼 NOT NULL 확인
- [ ] `task_status` enum 삭제 확인
- [ ] 빌드 오류 0건 (`cd packages/backend && bun run build`)

---

## Step 3 — 완료 검증

```bash
# 1. Phase 1: TaskStatusDef 테이블 생성, statusId nullable 추가
cd /c/rnd/uc-teamspace/packages/backend
bunx prisma migrate dev --name work24_task_status_def
bunx prisma generate

# 2. Phase 1 DB 확인
docker compose -f /c/rnd/uc-teamspace/docker-compose.yml exec postgres \
  psql -U dev -d uc_teamspace -c "\d task_status_defs"

docker compose -f /c/rnd/uc-teamspace/docker-compose.yml exec postgres \
  psql -U dev -d uc_teamspace -c "\d personal_tasks" | grep status

# 3. Phase 2: 데이터 마이그레이션 SQL 작성 후 실행
bunx prisma migrate dev --name work24_task_status_data_migration
# (SQL은 마이그레이션 파일에 직접 작성 후 실행)

# 4. Phase 2 데이터 확인
docker compose -f /c/rnd/uc-teamspace/docker-compose.yml exec postgres \
  psql -U dev -d uc_teamspace -c "SELECT * FROM task_status_defs ORDER BY sort_order;"

docker compose -f /c/rnd/uc-teamspace/docker-compose.yml exec postgres \
  psql -U dev -d uc_teamspace -c "SELECT id, title, status_id FROM personal_tasks LIMIT 10;"

# 5. Phase 3: 기존 컬럼/enum 정리
bunx prisma migrate dev --name work24_task_status_cleanup
bunx prisma generate

# 6. Phase 3 확인 (status 컬럼 및 enum 제거 확인)
docker compose -f /c/rnd/uc-teamspace/docker-compose.yml exec postgres \
  psql -U dev -d uc_teamspace -c "\dT+" | grep task_status

docker compose -f /c/rnd/uc-teamspace/docker-compose.yml exec postgres \
  psql -U dev -d uc_teamspace -c "\d personal_tasks"

# 7. 마이그레이션 상태 확인
bunx prisma migrate status

# 8. 백엔드 빌드 (Prisma Client 타입 오류 없어야 함)
cd /c/rnd/uc-teamspace
bun run build --filter=backend
```
