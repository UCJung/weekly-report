# WORK-23-TASK-01: DB 스키마 변경 + Prisma 마이그레이션

> **Phase:** 1
> **선행 TASK:** 없음
> **목표:** 개인 작업 관리 기능에 필요한 Enum 2개와 PersonalTask 모델을 Prisma 스키마에 추가하고 마이그레이션을 실행한다

---

## Step 1 — 계획서

### 1.1 작업 범위

기존 Prisma 스키마에 `TaskStatus`, `TaskPriority` Enum 2개와 `PersonalTask` 모델을 추가한다. 기존 `Member`, `Team`, `Project` 모델에는 `PersonalTask[]` 관계를 추가한다. 마이그레이션을 실행하여 DB를 동기화하고 Prisma Client를 재생성한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| Prisma | `packages/backend/prisma/schema.prisma` — Enum 2개 + 모델 1개 + 기존 모델 관계 추가 |
| Migration | `packages/backend/prisma/migrations/YYYYMMDD_work23_personal_task/` |

---

## Step 2 — 체크리스트

### 2.1 Enum 추가 (2개)

- [ ] `TaskStatus` — `TODO`, `IN_PROGRESS`, `DONE`
- [ ] `TaskPriority` — `HIGH`, `MEDIUM`, `LOW`

### 2.2 신규 모델: PersonalTask

- [ ] `id String @id @default(cuid())` 필드 추가
- [ ] `memberId String` 필드 + `member Member @relation(...)` 관계 추가
- [ ] `teamId String` 필드 + `team Team @relation(...)` 관계 추가
- [ ] `title String` 필드 추가 (작업 제목, 필수)
- [ ] `memo String? @db.Text` 필드 추가 (상세 메모, 선택)
- [ ] `projectId String?` 필드 + `project Project? @relation(...)` 관계 추가 (선택)
- [ ] `priority TaskPriority @default(MEDIUM)` 필드 추가
- [ ] `status TaskStatus @default(TODO)` 필드 추가
- [ ] `dueDate DateTime? @db.Date` 필드 추가 (마감일, 선택)
- [ ] `sortOrder Int @default(0)` 필드 추가
- [ ] `linkedWeekLabel String?` 필드 추가 (반영된 주간업무 주차 라벨)
- [ ] `repeatConfig Json?` 필드 추가 (반복 설정 JSON)
- [ ] `completedAt DateTime?` 필드 추가 (완료 처리 시각)
- [ ] `isDeleted Boolean @default(false)` 필드 추가 (소프트 삭제)
- [ ] `createdAt DateTime @default(now())` 필드 추가
- [ ] `updatedAt DateTime @updatedAt` 필드 추가
- [ ] `@@index([memberId, teamId])` 인덱스 추가
- [ ] `@@index([memberId, teamId, status])` 인덱스 추가
- [ ] `@@index([memberId, teamId, dueDate])` 인덱스 추가
- [ ] `@@index([projectId])` 인덱스 추가

### 2.3 기존 모델 관계 추가

- [ ] `Member` 모델에 `personalTasks PersonalTask[]` 관계 추가
- [ ] `Team` 모델에 `personalTasks PersonalTask[]` 관계 추가
- [ ] `Project` 모델에 `personalTasks PersonalTask[]` 관계 추가

### 2.4 마이그레이션

- [ ] `bunx prisma migrate dev --name work23_personal_task` 실행 성공
- [ ] `bunx prisma generate` 실행 성공 (Prisma Client 재생성)
- [ ] 마이그레이션 파일 생성 확인 (`prisma/migrations/` 디렉터리)

### 2.5 테스트

- [ ] DB에 `personal_tasks` 테이블 생성 확인
- [ ] `task_status`, `task_priority` Enum 생성 확인
- [ ] 빌드 오류 없음 (`bun run build` 성공)

---

## Step 3 — 완료 검증

```bash
# 1. 마이그레이션 실행 + Prisma Client 재생성
cd packages/backend
bunx prisma migrate dev --name work23_personal_task
bunx prisma generate

# 2. DB 테이블 확인
docker compose exec postgres psql -U dev -d uc_teamspace -c "\dt" | grep personal_tasks

# 3. 컬럼 구조 확인
docker compose exec postgres psql -U dev -d uc_teamspace -c "\d personal_tasks"

# 4. Enum 확인
docker compose exec postgres psql -U dev -d uc_teamspace -c "\dT+" | grep -E "task_status|task_priority"

# 5. 전체 빌드 확인
cd ../..
bun run build
```
