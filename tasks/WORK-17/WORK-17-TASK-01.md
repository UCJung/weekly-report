# WORK-17-TASK-01: 공유 타입 정합성 확보 (shared/types)

## WORK
WORK-17: 코드 품질 개선 — CRITICAL/HIGH 이슈 수정

## Dependencies
- 없음 (첫 번째 TASK)

## Scope

수정 대상 이슈: #9 (MemberRole ADMIN 누락), #10 (ProjectStatus 스키마 불일치)

Prisma 스키마의 실제 enum 값과 shared 타입 정의가 일치하지 않는 문제를 수정한다.

### 변경 내용

1. `packages/shared/types/team.ts`
   - 현재: `export type MemberRole = 'LEADER' | 'PART_LEADER' | 'MEMBER';`
   - 수정: `export type MemberRole = 'ADMIN' | 'LEADER' | 'PART_LEADER' | 'MEMBER';`
   - 근거: Prisma schema.prisma의 MemberRole enum에 ADMIN이 포함되어 있음

2. `packages/shared/types/project.ts`
   - 현재: `export type ProjectStatus = 'ACTIVE' | 'HOLD' | 'COMPLETED';`
   - 수정: `export type ProjectStatus = 'ACTIVE' | 'INACTIVE';`
   - 근거: Prisma schema.prisma의 ProjectStatus enum은 ACTIVE, INACTIVE 두 값만 존재

3. 프론트엔드 영향 파일 확인 및 수정
   - HOLD, COMPLETED 키를 참조하는 STATUS_LABEL, STATUS_VARIANT 등 수정
   - grep으로 전체 파일 스캔: `grep -rn "HOLD\|COMPLETED" packages/frontend/src/`

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/shared/types/team.ts` | MODIFY | MemberRole에 ADMIN 추가 |
| `packages/shared/types/project.ts` | MODIFY | ProjectStatus ACTIVE, INACTIVE로 교체 |
| `packages/frontend/src/pages/*.tsx` | MODIFY | HOLD/COMPLETED 참조 제거 (영향 파일) |

## Acceptance Criteria

- [ ] MemberRole이 'ADMIN' | 'LEADER' | 'PART_LEADER' | 'MEMBER' 4종 포함
- [ ] ProjectStatus가 'ACTIVE' | 'INACTIVE' 두 값만 존재
- [ ] 프론트엔드에서 HOLD, COMPLETED 타입 참조 없음
- [ ] 프론트엔드 TypeScript 빌드 오류 0건

## Verify

```
grep -n "HOLD\|COMPLETED" packages/frontend/src/pages/*.tsx || echo "OK"
cd packages/frontend && bun run build 2>&1 | tail -20
cd packages/shared && bunx tsc --noEmit 2>&1
```
