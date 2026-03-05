# WORK-24-TASK-01 수행 결과 보고서

> 작업일: 2026-03-05
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

`TaskStatusCategory` enum과 `TaskStatusDef` 모델을 추가하고, `PersonalTask.status` (TaskStatus enum 필드)를 `statusId` (FK → TaskStatusDef)로 교체하는 3단계 Prisma 마이그레이션을 완료했다. 기존 5건의 PersonalTask 데이터는 손실 없이 statusId로 매핑되었다.

---

## 2. 완료 기준 달성 현황

| 완료 기준 | 달성 여부 |
|-----------|-----------|
| TaskStatusDef 테이블 생성 완료 | ✅ |
| PersonalTask.statusId FK 추가 + 기존 데이터 statusId 매핑 완료 | ✅ |
| PersonalTask.status 컬럼 삭제, TaskStatus enum 제거 | ✅ |
| bunx prisma migrate status — Applied 확인 | ✅ |
| 빌드 오류 0건 (bun run build) | ✅ |
| 테스트 157건 전원 통과 | ✅ |

---

## 3. 체크리스트 완료 현황

### 2.1 신규 Enum: TaskStatusCategory
| 항목 | 결과 |
|------|------|
| `TaskStatusCategory` enum 추가: `BEFORE_START`, `IN_PROGRESS`, `COMPLETED` | ✅ |
| `@@map("task_status_category")` 적용 | ✅ |

### 2.2 신규 모델: TaskStatusDef
| 항목 | 결과 |
|------|------|
| `id`, `teamId`, `name`, `category`, `color`, `sortOrder`, `isDefault`, `isDeleted`, `createdAt`, `updatedAt` 필드 | ✅ |
| `team Team @relation(...)` 관계 | ✅ |
| `personalTasks PersonalTask[]` 역관계 | ✅ |
| `@@index([teamId, sortOrder])` 인덱스 | ✅ |
| `@@index([teamId, category])` 인덱스 | ✅ |
| `@@map("task_status_defs")` 테이블명 | ✅ |

### 2.3 PersonalTask 모델 변경
| 항목 | 결과 |
|------|------|
| `statusId String` 필드 추가 (Phase 1 nullable → Phase 3 NOT NULL) | ✅ |
| `taskStatus TaskStatusDef @relation(...)` 관계 추가 | ✅ |
| 기존 `status TaskStatus` 필드 제거 | ✅ |
| `@@index([memberId, teamId, statusId])` 인덱스 교체 | ✅ |

### 2.4 Team 모델 관계 추가
| 항목 | 결과 |
|------|------|
| `Team` 모델에 `taskStatusDefs TaskStatusDef[]` 관계 추가 | ✅ |

### 2.5-2.7 3단계 마이그레이션
| 항목 | 결과 |
|------|------|
| Phase 1: TaskStatusDef 테이블 생성 + statusId nullable 추가 | ✅ |
| Phase 2: 각 팀별 기본 3상태 INSERT + PersonalTask.status → statusId 매핑 | ✅ |
| Phase 3: statusId NOT NULL + FK 추가 + status 컬럼/TaskStatus enum 삭제 | ✅ |

### 2.8 최종 검증
| 항목 | 결과 |
|------|------|
| `personal_tasks` 테이블에 `status` 컬럼 없음 | ✅ |
| `personal_tasks` 테이블에 `status_id` 컬럼 NOT NULL | ✅ |
| `task_status` enum 삭제 | ✅ |
| 빌드 오류 0건 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — prisma migrate dev가 비대화형 환경에서 실행 불가

**증상**: `bunx prisma migrate dev --create-only` 실행 시 "Prisma Migrate has detected that the environment is non-interactive" 오류 발생

**원인**: Prisma migrate dev는 데이터 손실 경고 시 사용자 확인을 요구하는 대화형 명령으로 설계됨. CI/자동화 환경에서는 실행 불가.

**수정**: 마이그레이션 파일 3개를 수동으로 생성하고, `bunx prisma migrate deploy`로 적용. 이 방식은 비대화형 환경에서도 정상 동작.

### 이슈 #2 — 백엔드 서비스 파일이 삭제된 TaskStatus enum 참조

**증상**: schema.prisma에서 TaskStatus enum을 제거한 후 `personal-task.service.ts`, dto 파일들이 `TaskStatus` 임포트로 인해 빌드 실패

**원인**: 3단계 마이그레이션을 한 번에 진행함으로써 TASK-03에서 처리할 예정이었던 서비스 코드 변경도 함께 필요해짐

**수정**:
- `personal-task.service.ts`: `TaskStatus` 참조를 `TaskStatusCategory` 기반 로직으로 완전 전환
  - 상태 비교 로직을 `taskStatus.category` 기반으로 변경
  - `getDefaultStatusId()`, `getStatusIdsByCategory()` 헬퍼 메서드 추가
  - `findAll`, `create`, `update`, `toggleDone`, `getSummary`, `getPartOverview`, `getTeamOverview` 등 전 메서드 업데이트
- `update-personal-task.dto.ts`: `status?: TaskStatus` → `statusId?: string` 로 교체
- `create-personal-task.dto.ts`: `statusId?: string` 추가 (미입력 시 서비스에서 기본 상태 자동 배정)
- `list-personal-tasks-query.dto.ts`: `status?: TaskStatusFilter` 유지 (레거시 호환) + `statusId?: string` 추가

### 이슈 #3 — PersonalTaskUpdateInput 타입 불일치

**증상**: `updateData: Prisma.PersonalTaskUpdateInput`에 `statusId` 직접 할당 시 타입 오류

**원인**: Prisma의 `PersonalTaskUpdateInput` (관계형 타입)은 `statusId` 대신 `taskStatus: { connect: ... }` 형태를 사용. `statusId` 직접 할당은 `PersonalTaskUncheckedUpdateInput`에서만 가능.

**수정**: `updateData` 타입을 `Prisma.PersonalTaskUncheckedUpdateInput`으로 변경

---

## 5. 최종 검증 결과

### DB 스키마 확인
```
task_status_defs 테이블:
- id (PK), teamId (FK), name, category (task_status_category), color, sortOrder, isDefault, isDeleted, createdAt, updatedAt
- INDEX: task_status_defs_teamId_sortOrder_idx, task_status_defs_teamId_category_idx

personal_tasks 테이블 (변경 후):
- status 컬럼 없음
- statusId (text, NOT NULL) — FK → task_status_defs(id)
- INDEX: personal_tasks_memberId_teamId_statusId_idx
```

### 기본 상태 데이터 (선행연구개발팀)
```
할일    | BEFORE_START | #6C7A89 | sortOrder=0 | isDefault=true
진행중  | IN_PROGRESS  | #6B5CE7 | sortOrder=1 | isDefault=true
완료    | COMPLETED    | #27AE60 | sortOrder=2 | isDefault=true
```

### 기존 PersonalTask 데이터 매핑 결과
```
5건 전체 → 기존 status 값에 따라 대응 statusId로 정상 매핑
```

### 빌드 결과
```
Tasks: 3 successful, 3 total (backend, frontend, shared)
Time: 29.302s
```

### 테스트 결과
```
157 pass, 0 fail
312 expect() calls
15 files
```

### 마이그레이션 상태
```
16 migrations found in prisma/migrations
Database schema is up to date!
```

---

## 6. 후속 TASK 유의사항

- **TASK-02** (TaskStatusDef CRUD API): `task-status.service.ts` 신규 생성 필요. Team 모델에 `taskStatusDefs` 관계가 이미 추가되어 있음.
- **TASK-03** (PersonalTask 서비스 연동): 서비스 로직이 이미 TASK-01에서 `statusId` + `category` 기반으로 전환됨. TASK-03에서는 주로 API 응답 구조 검토 및 프론트엔드 연동 확인에 집중할 것.
- **seed.ts**: 기본 3상태 생성 로직이 추가됨 (`existingStatuses === 0` 조건으로 중복 방지). TASK-06에서 추가 작업 불필요.
- **프론트엔드**: `TaskStatus` enum을 참조하는 파일 4개 존재 (TASK-05에서 처리):
  - `TaskKanban.tsx`, `TaskDetailPanel.tsx`, `personal-task.api.ts`, `TaskFilterBar.tsx`

---

## 7. 산출물 목록

### 신규 생성 파일

| 파일 | 설명 |
|------|------|
| `packages/backend/prisma/migrations/20260306000001_work24_task_status_def/migration.sql` | Phase 1: task_status_defs 테이블 생성 + statusId nullable 추가 |
| `packages/backend/prisma/migrations/20260306000002_work24_task_status_data_migration/migration.sql` | Phase 2: 팀별 기본 3상태 INSERT + PersonalTask 데이터 매핑 |
| `packages/backend/prisma/migrations/20260306000003_work24_task_status_cleanup/migration.sql` | Phase 3: statusId NOT NULL + FK + 기존 컬럼/enum 삭제 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/backend/prisma/schema.prisma` | TaskStatusCategory enum + TaskStatusDef 모델 추가; Team.taskStatusDefs 관계; PersonalTask.status → statusId 교체; TaskStatus enum 제거 |
| `packages/backend/prisma/seed.ts` | 팀 생성 후 기본 3상태(할일/진행중/완료) 자동 생성 로직 추가 |
| `packages/backend/src/personal-task/personal-task.service.ts` | TaskStatus 참조 완전 제거, TaskStatusCategory 기반 로직으로 전환 |
| `packages/backend/src/personal-task/dto/create-personal-task.dto.ts` | statusId 필드 추가 |
| `packages/backend/src/personal-task/dto/update-personal-task.dto.ts` | status → statusId 필드 교체 |
| `packages/backend/src/personal-task/dto/list-personal-tasks-query.dto.ts` | TaskStatus import 제거, statusId 필터 추가, 레거시 status 필터 유지 |
