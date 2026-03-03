# WORK-16: 프로젝트 관리 프로세스 구조 변경

> 요구사항: `tasks/Require/Require-05.md`
> 생성일: 2026-03-03

---

## 1. 요구사항 요약

현재 프로젝트는 팀(Team)에 종속되어 팀장(LEADER)이 직접 생성/수정/삭제하는 구조이다.
이를 아래와 같이 변경한다:

1. **프로젝트 관리 → Admin 메뉴로 이동**: 관리자(ADMIN)가 전역 프로젝트를 생성·관리
   - 삭제 기능 없음, 상태(사용중/사용안함)로 관리
2. **팀 프로젝트 관리 기능 신설**: 팀에서 Admin이 생성한 전역 프로젝트 중 사용할 것을 선택하여 등록
   - 프로젝트가 "사용안함"일 경우 기존 주간업무는 조회 가능하나 신규 작성 불가

---

## 2. 현재 구조 분석

### DB 스키마 (현재)
- `Project` 모델에 `teamId` 필드 존재 → 프로젝트가 팀에 직접 종속
- `@@unique([teamId, code])` → 팀 내 코드 유니크
- `ProjectStatus`: ACTIVE / HOLD / COMPLETED

### 백엔드 (현재)
- `ProjectController`: create, findAll, findById, update, delete, reorder
- `ProjectService.create()`: teamId 필수, 팀 내 코드 중복 체크
- `ProjectService.findAll()`: teamId로 필터링

### 프론트엔드 (현재)
- `/project-mgmt` 라우트 → `ProjectMgmt.tsx` (LEADER 전용, `RoleGuard`)
- `projectApi`: CRUD + reorder
- Admin 라우트: `/admin/accounts`, `/admin/teams` (프로젝트 없음)

---

## 3. 변경 설계

### 3.1 DB 스키마 변경

#### Project 모델 변경 (전역화)
```
model Project {
  id        String          @id @default(cuid())
  name      String
  code      String          @unique   // 전역 유니크로 변경
  category  ProjectCategory
  status    ProjectStatus   @default(ACTIVE)
  sortOrder Int             @default(0)
  // teamId 필드 제거

  teamProjects     TeamProject[]
  workItems        WorkItem[]
  summaryWorkItems SummaryWorkItem[]
}
```

#### ProjectStatus enum 변경
```
enum ProjectStatus {
  ACTIVE      // 사용중
  INACTIVE    // 사용안함
}
```
- HOLD, COMPLETED 제거 → ACTIVE / INACTIVE 2가지만

#### TeamProject 모델 신설 (연결 테이블)
```
model TeamProject {
  id        String   @id @default(cuid())
  teamId    String
  projectId String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  team    Team    @relation(fields: [teamId], references: [id])
  project Project @relation(fields: [projectId], references: [id])

  @@unique([teamId, projectId])
  @@map("team_projects")
}
```

### 3.2 백엔드 변경

#### Admin 프로젝트 관리 API (신규)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/admin/projects` | 전체 프로젝트 목록 (페이지네이션, 필터) |
| POST | `/api/v1/admin/projects` | 프로젝트 생성 (ADMIN 전용) |
| PATCH | `/api/v1/admin/projects/:id` | 프로젝트 수정 (이름, 코드, 카테고리, 상태) |

#### 팀 프로젝트 관리 API (기존 변경)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/teams/:teamId/projects` | 팀에 등록된 프로젝트 목록 |
| POST | `/api/v1/teams/:teamId/projects` | 팀에 프로젝트 등록 (projectId 배열) |
| DELETE | `/api/v1/teams/:teamId/projects/:projectId` | 팀에서 프로젝트 해제 |
| PATCH | `/api/v1/teams/:teamId/projects/reorder` | 팀 프로젝트 순서 변경 |

#### 주간업무 작성 시 제약
- WorkItem 생성/수정 시 해당 프로젝트의 status가 INACTIVE이면 거부
- 조회는 기존대로 모두 허용

### 3.3 프론트엔드 변경

#### Admin 프로젝트 관리 페이지 (신규)
- `/admin/projects` 라우트 추가
- 전역 프로젝트 목록 테이블 (이름, 코드, 카테고리, 상태, 액션)
- 프로젝트 생성/수정 모달
- 상태 변경 버튼 (사용중 ↔ 사용안함)

#### 팀 프로젝트 관리 페이지 (기존 변경)
- `/project-mgmt` 라우트 유지 (팀 프로젝트 선택 화면으로 변경)
- 팀에 등록된 프로젝트 목록 + "프로젝트 추가" 기능
- 프로젝트 추가 시: Admin 전역 프로젝트에서 미등록 프로젝트를 선택하는 모달
- 사용안함 프로젝트는 뱃지로 상태 표시

---

## 4. TASK 분해

### TASK-01: DB 스키마 변경 및 마이그레이션
- **작업**: Project 모델 전역화, TeamProject 연결 테이블 추가, ProjectStatus enum 변경
- **산출물**: Prisma 마이그레이션, 시드 데이터 업데이트
- **의존**: 없음

### TASK-02: Admin 프로젝트 관리 API
- **작업**: AdminController/AdminService에 프로젝트 CRUD 추가
- **산출물**: GET/POST/PATCH `/api/v1/admin/projects`
- **의존**: TASK-01

### TASK-03: 팀 프로젝트 관리 API
- **작업**: TeamController에 팀 프로젝트 등록/해제/조회/순서변경 API 추가
- **산출물**: GET/POST/DELETE/PATCH `/api/v1/teams/:teamId/projects`
- **의존**: TASK-01

### TASK-04: 주간업무 프로젝트 상태 제약 적용
- **작업**: WorkItem 생성/수정 시 INACTIVE 프로젝트 체크, 기존 ProjectController/Service 정리
- **산출물**: 비즈니스 로직 수정
- **의존**: TASK-02, TASK-03

### TASK-05: Admin 프로젝트 관리 프론트엔드
- **작업**: `/admin/projects` 페이지, API 클라이언트, 사이드바 메뉴 추가
- **산출물**: AdminProjectManagement.tsx, admin.api.ts 확장
- **의존**: TASK-02

### TASK-06: 팀 프로젝트 관리 프론트엔드
- **작업**: ProjectMgmt.tsx를 팀 프로젝트 선택 화면으로 변경, 프로젝트 추가 모달
- **산출물**: ProjectMgmt.tsx 리팩터링, project.api.ts 수정
- **의존**: TASK-03, TASK-05

### TASK-07: 통합 검증
- **작업**: 빌드, 린트, 테스트, E2E 시나리오 확인
- **산출물**: 검증 보고서
- **의존**: TASK-04, TASK-05, TASK-06

---

## 5. TASK 의존성 DAG

```
TASK-01 ─┬─▶ TASK-02 ─┬─▶ TASK-04 ──▶ TASK-07
         │             │
         │             └─▶ TASK-05 ──▶ TASK-06 ──▶ TASK-07
         │
         └─▶ TASK-03 ─┬─▶ TASK-04
                       └─▶ TASK-06
```

---

## 6. 수정 파일 예상 목록

| 파일 | 작업 | TASK |
|------|------|------|
| `packages/backend/prisma/schema.prisma` | Project 전역화, TeamProject 추가, enum 변경 | 01 |
| `packages/backend/prisma/seed.ts` | 시드 데이터 업데이트 (TeamProject 생성) | 01 |
| `packages/backend/src/admin/admin.controller.ts` | 프로젝트 CRUD 엔드포인트 추가 | 02 |
| `packages/backend/src/admin/admin.service.ts` | 프로젝트 관리 로직 추가 | 02 |
| `packages/backend/src/team/team.controller.ts` | 팀 프로젝트 등록/해제 엔드포인트 | 03 |
| `packages/backend/src/team/team.module.ts` | 의존성 추가 | 03 |
| `packages/backend/src/project/project.service.ts` | 팀 프로젝트 서비스 로직 | 03 |
| `packages/backend/src/project/project.controller.ts` | 기존 CRUD 정리/제거 | 04 |
| `packages/backend/src/weekly-report/work-item.service.ts` | INACTIVE 프로젝트 체크 | 04 |
| `packages/frontend/src/api/admin.api.ts` | Admin 프로젝트 API 클라이언트 | 05 |
| `packages/frontend/src/pages/admin/ProjectManagement.tsx` | Admin 프로젝트 관리 페이지 (신규) | 05 |
| `packages/frontend/src/hooks/useAdmin.ts` | Admin 프로젝트 hooks | 05 |
| `packages/frontend/src/App.tsx` | 라우트 추가 | 05 |
| `packages/frontend/src/components/layout/AdminLayout.tsx` | 사이드바 메뉴 추가 | 05 |
| `packages/frontend/src/api/project.api.ts` | 팀 프로젝트 API로 변경 | 06 |
| `packages/frontend/src/pages/ProjectMgmt.tsx` | 팀 프로젝트 선택 화면으로 변경 | 06 |
| `packages/frontend/src/hooks/useProjects.ts` | hooks 수정 | 06 |

---

## 7. 리스크 및 고려사항

1. **기존 WorkItem의 projectId 참조**: Project에서 teamId를 제거해도 WorkItem → Project FK는 유지되므로 문제없음
2. **기존 프로젝트 데이터 마이그레이션**: 현재 Project에 teamId가 있는 데이터를 TeamProject로 이전하는 마이그레이션 스크립트 필요
3. **SummaryWorkItem의 projectId 참조**: 동일하게 FK 유지되므로 문제없음
4. **ProjectStatus enum 변경**: HOLD, COMPLETED 상태의 기존 데이터가 있으면 INACTIVE로 매핑 필요
