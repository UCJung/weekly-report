# WORK-18-TASK-04 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

기존 Project API에 `managerId`, `department`, `description` 필드를 반영하고, 프로젝트 생성 요청/승인 워크플로우 및 내 책임 프로젝트 조회 API를 구현했다.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| 빌드 오류 0건 (`bun run build`) | ✅ |
| 린트 오류 0건 | ✅ |
| 기존 project/admin 서비스에 새 필드 반영 | ✅ |
| POST /api/v1/projects/request 구현 | ✅ |
| PATCH /api/v1/admin/projects/:id/approve 구현 | ✅ |
| GET /api/v1/projects/managed 구현 | ✅ |
| 팀 프로젝트 추가 시 ACTIVE 상태 검증 | ✅ |

---

## 3. 체크리스트 완료 현황

### 2.1 기존 API 수정

| 항목 | 상태 |
|------|------|
| `project.service.ts`: findAll/findById에 manager include 추가 | ✅ |
| `project.service.ts`: create/update에 managerId, department, description 반영 | ✅ |
| `admin.service.ts`: createProject에 새 필드 반영 | ✅ |
| `admin.service.ts`: updateProject에 새 필드 반영 | ✅ |
| `admin.service.ts`: listProjects에 manager include 추가 | ✅ |

### 2.2 DTO 업데이트

| 항목 | 상태 |
|------|------|
| `create-project.dto.ts`: managerId?, department?, description? 추가 | ✅ |
| `update-project.dto.ts`: 새 필드 반영 | ✅ |
| 새 DTO: `request-project.dto.ts` (code 없음) | ✅ |
| 새 DTO: `approve-project.dto.ts` (code 필수) | ✅ |
| `create-global-project.dto.ts`: 새 필드 반영 | ✅ |
| `update-global-project.dto.ts`: 새 필드 반영 | ✅ |

### 2.3 프로젝트 생성 요청 API

| 항목 | 상태 |
|------|------|
| POST /api/v1/projects/request 구현 | ✅ |
| LEADER/PART_LEADER 권한 체크 | ✅ |
| status=PENDING, 임시 code 자동 생성 | ✅ |
| managerId 미지정 시 요청자 본인으로 설정 | ✅ |
| 이름 중복 체크 (PENDING/ACTIVE 기준) | ✅ |

### 2.4 프로젝트 승인 API

| 항목 | 상태 |
|------|------|
| PATCH /api/v1/admin/projects/:id/approve 구현 | ✅ |
| ADMIN 권한 체크 (컨트롤러 클래스 레벨) | ✅ |
| code 중복 검증 (INACTIVE 제외) | ✅ |
| PENDING 상태가 아니면 에러 | ✅ |

### 2.5 내 책임 프로젝트 API

| 항목 | 상태 |
|------|------|
| GET /api/v1/projects/managed 구현 | ✅ |
| status 필터 옵션 | ✅ |

### 2.6 기존 로직 보호

| 항목 | 상태 |
|------|------|
| 팀 프로젝트 추가 시 ACTIVE 상태만 허용 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — Turborepo 빌드 캐시 문제

**증상**: `bun run build` 시 TypeScript에서 "Property 'findManagedProjects' does not exist on type 'ProjectService'" 오류
**원인**: Turborepo가 이전 빌드 캐시를 사용하여 새로 작성한 project.service.ts를 인식하지 못함
**수정**: `rm -rf packages/backend/dist` 후 `bunx nest build`로 직접 재빌드하여 캐시 갱신. 이후 `bun run build` 정상 통과

---

## 5. 최종 검증 결과

```
 Tasks:    3 successful, 3 total
Cached:    2 cached, 3 total
  Time:    24.57s

Lint:
 Tasks:    3 successful, 3 total
Cached:    3 cached, 3 total
  Time:    89ms >>> FULL TURBO
```

- 빌드: ✅ PASS (0 errors)
- 린트: ✅ PASS (0 errors, 기존 warnings만)

---

## 6. 후속 TASK 유의사항

- `POST /api/v1/projects/request` 에서 임시 code가 `PENDING-{timestamp}` 형식으로 생성됨. 승인 시 PATCH `/admin/projects/:id/approve`로 실제 코드 부여 필요
- PENDING 상태 프로젝트는 팀 프로젝트 추가 불가 (team-project.service.ts 검증 추가됨)
- Admin 프로젝트 목록(`GET /api/v1/admin/projects`)은 status 필터 없이 조회 시 PENDING 포함 전체 반환됨

---

## 7. 산출물 목록

### 신규 생성 파일

| 파일 | 설명 |
|------|------|
| `packages/backend/src/project/dto/request-project.dto.ts` | 프로젝트 생성 요청 DTO (code 없음) |
| `packages/backend/src/admin/dto/approve-project.dto.ts` | 프로젝트 승인 DTO (code 필수) |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/backend/src/project/project.controller.ts` | GET /managed, POST /request 엔드포인트 추가; CurrentUser 데코레이터 추가 |
| `packages/backend/src/project/project.service.ts` | manager include 추가; requestProject, findManagedProjects, validateLeaderOrPartLeader 메서드 추가; update/softDelete에 새 필드 반영 |
| `packages/backend/src/project/dto/create-project.dto.ts` | managerId?, department?, description? 필드 추가 |
| `packages/backend/src/project/dto/update-project.dto.ts` | managerId?, department?, description? 필드 추가 |
| `packages/backend/src/admin/admin.controller.ts` | PATCH /projects/:id/approve 엔드포인트 추가 |
| `packages/backend/src/admin/admin.service.ts` | approveProject 메서드 추가; createProject/updateProject/listProjects에 새 필드 반영 |
| `packages/backend/src/admin/dto/create-global-project.dto.ts` | managerId?, department?, description? 필드 추가 |
| `packages/backend/src/admin/dto/update-global-project.dto.ts` | managerId?, department?, description? 필드 추가 |
| `packages/backend/src/team/team-project.service.ts` | addTeamProjects에 ACTIVE 상태 검증 추가 |
