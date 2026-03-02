# WORK-10-TASK-01: Project.sortOrder 필드 추가 (Prisma 마이그레이션)

## WORK
WORK-10: 업무현황 페이지 개편

## Dependencies
- (없음)

## Scope

`Project` 모델에 `sortOrder` 필드를 추가한다.
현재 `schema.prisma`의 `Project` 모델에는 `sortOrder`가 없으며, `project.service.ts`의
정렬 기준도 `[category asc, name asc]`다. 요구사항에 따라 프로젝트 관리 화면에서 설정한
sortOrder로 업무현황 페이지의 프로젝트 순서를 제어해야 한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/backend/prisma/schema.prisma` | MODIFY | Project 모델에 `sortOrder Int @default(0)` 추가 |
| `packages/backend/src/project/project.service.ts` | MODIFY | findAll orderBy에 sortOrder asc 추가 (최우선) |
| `packages/backend/src/project/dto/update-project.dto.ts` | MODIFY | sortOrder?: number 필드 추가 |
| `packages/frontend/src/api/project.api.ts` | MODIFY | Project 인터페이스에 sortOrder: number 추가 |
| `packages/frontend/src/pages/ProjectMgmt.tsx` | MODIFY | sortOrder 편집 UI 추가 (선택적, 없으면 기본값 0 사용) |

## 상세 작업 내용

### 1. schema.prisma 수정

`Project` 모델에 다음 필드를 추가한다:

```prisma
model Project {
  ...
  sortOrder Int @default(0)   // ← 추가
  ...
}
```

### 2. Prisma 마이그레이션 실행

```bash
cd packages/backend
bunx prisma migrate dev --name add_project_sort_order
```

### 3. project.service.ts 정렬 변경

`findAll` 메서드의 `orderBy`를:
```ts
orderBy: [{ category: 'asc' }, { name: 'asc' }],
```
에서:
```ts
orderBy: [{ sortOrder: 'asc' }, { category: 'asc' }, { name: 'asc' }],
```
로 변경한다.

### 4. update-project.dto.ts 수정

```ts
@IsOptional()
@IsInt()
@Min(0)
sortOrder?: number;
```

### 5. frontend project.api.ts 타입 업데이트

```ts
export interface Project {
  ...
  sortOrder: number;  // ← 추가
}
```

### 6. ProjectMgmt.tsx sortOrder 편집 (선택적)

ProjectMgmt 페이지의 프로젝트 수정 모달에 sortOrder 입력 필드를 추가하여
관리자가 순서를 지정할 수 있게 한다. 숫자 입력 필드(0~999).

## Acceptance Criteria

- [ ] `schema.prisma` Project 모델에 `sortOrder Int @default(0)` 존재
- [ ] 마이그레이션 파일이 `packages/backend/prisma/migrations/` 에 생성됨
- [ ] `bunx prisma validate` 오류 없음
- [ ] `project.service.ts` findAll의 orderBy 첫 번째가 `sortOrder: 'asc'`
- [ ] `update-project.dto.ts`에 `sortOrder?: number` 존재
- [ ] `project.api.ts` Project 인터페이스에 `sortOrder: number` 존재
- [ ] `bun run build` (backend) 오류 없음
- [ ] `bun run build` (frontend) 오류 없음

## Verify

```bash
# 1. 스키마 검증
cd C:/rnd/weekly-report/packages/backend && bunx prisma validate

# 2. sortOrder 필드 존재 확인
grep -n "sortOrder" C:/rnd/weekly-report/packages/backend/prisma/schema.prisma

# 3. 서비스 정렬 확인
grep -n "sortOrder" C:/rnd/weekly-report/packages/backend/src/project/project.service.ts

# 4. 마이그레이션 파일 확인
ls C:/rnd/weekly-report/packages/backend/prisma/migrations/ | grep sort_order

# 5. 백엔드 빌드
cd C:/rnd/weekly-report/packages/backend && bun run build 2>&1 | tail -20

# 6. 프론트엔드 빌드
cd C:/rnd/weekly-report/packages/frontend && bun run build 2>&1 | tail -20
```
