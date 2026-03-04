# WORK-22-TASK-04 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

Prisma schema에서 Member 모델의 `partId` 필드와 `part` relation을 제거하고, Part 모델의 `members Member[]` relation도 제거했다. 마이그레이션을 생성하여 DB에서 실제 컬럼을 DROP했으며, 코드에서 남아있던 `Part.members` 참조를 모두 정리했다. 프론트엔드의 `authStore.User.partId/partName`도 제거하고 TeamMembership API를 통해 파트 정보를 조회하도록 변경했다.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| schema.prisma Member.partId 제거 | ✅ |
| schema.prisma Member.part relation 제거 | ✅ |
| schema.prisma Part.members relation 제거 | ✅ |
| 마이그레이션 생성 및 적용 | ✅ |
| prisma validate 통과 | ✅ |
| 코드에서 Part.members 참조 제거 | ✅ |
| 빌드 오류 0건 | ✅ |
| 테스트 통과 | ✅ |

---

## 3. 체크리스트 완료 현황

### 2.1 스키마 수정
- [x] schema.prisma Member 모델에서 partId 필드 제거
- [x] schema.prisma Member 모델에서 part 관계 제거
- [x] schema.prisma Part 모델에서 members 관계 제거
- [x] prisma validate 통과

### 2.2 마이그레이션 실행
- [x] 마이그레이션 파일 수동 생성 (20260304200000_remove_member_partid)
- [x] bunx prisma migrate deploy 실행 (ALTER TABLE members DROP COLUMN "partId")
- [x] Prisma client 타입 확인 (index.d.ts에 Member.partId 없음 확인)

### 2.3 빌드 검증
- [x] bun run build 성공 (backend + frontend)
- [x] 린트 오류 없음 (warnings만, 기존 코드 issue)
- [x] bun run test 통과 (157 pass, 0 fail)

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — prisma migrate dev 비대화형 환경 오류

**증상**: `prisma migrate dev` 실행 시 "Prisma Migrate has detected that the environment is non-interactive" 오류
**원인**: bun 환경이 비대화형으로 감지되어 `migrate dev` 명령이 거부됨
**수정**: `prisma migrate diff` 로 SQL 생성 후, 마이그레이션 파일을 수동으로 작성하고 `prisma migrate deploy` 로 적용

### 이슈 #2 — prisma generate DLL 잠금 오류

**증상**: `EPERM: operation not permitted, rename query_engine-windows.dll.node` 오류
**원인**: 이전 프로세스가 DLL을 점유 중
**수정**: Prisma client TypeScript 타입(index.d.ts)이 이미 최신 스키마를 반영하고 있음을 확인. 런타임 DLL만 잠금 문제이며 빌드/테스트에는 영향 없음

### 이슈 #3 — export/excel.service.ts, team/team.service.ts에서 Part.members 참조

**증상**: 빌드 에러 - `'members' does not exist in type 'PartInclude<DefaultArgs>'`
**원인**: TASK-04의 일환으로 Part.members relation 제거 후 기존 코드가 이를 참조
**수정**:
- `excel.service.ts`: `generatePartExcel`, `generateTeamExcel`을 `prisma.teamMembership.findMany({ where: { partId } })` 방식으로 재작성
- `team.service.ts`: `_count: { select: { members: true } }` → `_count: { select: { teamMemberships: true } }`

### 이슈 #4 — 프론트엔드 authStore.User에서 partId/partName 제거 후 페이지 오류

**증상**: `user?.partId`, `user?.partName` 참조가 여러 페이지에 남아있음
**원인**: 기존 코드에서 auth 사용자 정보의 partId/partName을 직접 사용
**수정**:
- `Dashboard.tsx`: `useQuery(['members', teamId])` 로 팀원 목록 조회 후 현재 사용자의 partId 도출
- `PartStatus.tsx`: 동일 방식으로 `userPartId`, `userPartName` 도출
- `ReportConsolidation.tsx`: 동일 방식으로 `partId`, `userPartName` 도출
- `Sidebar.tsx`: `user.partName` 폴백 제거 (`currentTeam?.name || user.teamName` 로 충분)

---

## 5. 최종 검증 결과

```
Backend build:
$ nest build
(no errors)

Backend tests:
$ bun test src/
157 pass, 0 fail, 312 expect() calls
Ran 157 tests across 15 files. [2.34s]

Frontend build:
$ tsc -b && vite build
✓ 1766 modules transformed.
✓ built in 7.81s

Backend lint: no errors
Frontend lint: 7 warnings (pre-existing, not introduced by this task)

Prisma validate: The schema at prisma/schema.prisma is valid

DB migration: ALTER TABLE members DROP CONSTRAINT members_partId_fkey; ALTER TABLE members DROP COLUMN "partId";
- Applied: 20260304200000_remove_member_partid
```

---

## 6. 후속 TASK 유의사항

- TASK-05: `seed.ts`에서 `partId` 필드를 Member 생성 시 사용하는 코드가 남아있을 경우 제거 필요
- `prisma generate`의 DLL 잠금 문제는 개발 서버가 종료된 후 재실행하면 해결됨

---

## 7. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/backend/prisma/schema.prisma` | Member.partId/part 제거, Part.members 제거 |
| `packages/backend/src/auth/auth.service.ts` | getMe()에서 `include: { part: { include: { team: true } } }` 제거, login()에서 `partId: null` 제거 |
| `packages/backend/src/auth/auth.service.spec.ts` | `expect(result.user.partId).toBeNull()` 제거 |
| `packages/backend/src/export/excel.service.ts` | generatePartExcel/generateTeamExcel을 TeamMembership 기반으로 재작성 |
| `packages/backend/src/team/team.service.ts` | `_count: { select: { members: true } }` → `teamMemberships` |
| `packages/frontend/src/api/auth.api.ts` | LoginResponse.user에서 partId/partName 제거 |
| `packages/frontend/src/stores/authStore.ts` | User 인터페이스에서 partId/partName 제거 |
| `packages/frontend/src/pages/Dashboard.tsx` | user.partId → teamMembers 조회로 변경 |
| `packages/frontend/src/pages/PartStatus.tsx` | user.partId/partName → teamMembers 조회로 변경 |
| `packages/frontend/src/pages/ReportConsolidation.tsx` | user.partId/partName → teamMembers 조회로 변경 |
| `packages/frontend/src/components/layout/Sidebar.tsx` | user.partName 폴백 제거 |

### 생성 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/backend/prisma/migrations/20260304200000_remove_member_partid/migration.sql` | Member.partId FK 및 컬럼 DROP SQL |
