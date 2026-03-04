# WORK-22 Progress

> WORK: Member.partId 이중 관리 제거 - TeamMembership 기반 단일화
> Last updated: 2026-03-04

| TASK | Title | Depends | Status | Commit | Note |
|------|-------|---------|--------|--------|------|
| WORK-22-TASK-01 | part-summary.service.ts 쿼리 TeamMembership 기반으로 전환 | - | Done | | |
| WORK-22-TASK-02 | MemberService create/update에서 Member.partId 쓰기 제거 | TASK-01 | Done | 4a52870 | |
| WORK-22-TASK-03 | auth.service.ts 수정 - JWT payload에서 Member.partId 의존 제거 | TASK-01 | Done | | |
| WORK-22-TASK-04 | Prisma 마이그레이션 - Member.partId 컬럼 제거 | TASK-02, TASK-03 | Done | 1b9fc04 | |
| WORK-22-TASK-05 | seed.ts 수정 + 테스트 코드 전체 정비 | TASK-04 | Done | | |

## Log

- 2026-03-04: TASK-01 완료 — part-summary.service.ts 5개 메서드 TeamMembership 기반으로 전환, 157 tests pass
- 2026-03-04: TASK-02 완료 — MemberService create/update에서 Member.partId 쓰기 제거, UpdateMemberDto.partId 제거, 157 tests pass
- 2026-03-04: TASK-03 완료 — auth.service.ts에서 part include/payload 제거, JwtPayload 정리, 프론트 타입 null 처리, 157 tests pass
- 2026-03-04: TASK-04 완료 — schema.prisma Member.partId/part/Part.members 제거, 마이그레이션 적용, excel.service.ts/team.service.ts/프론트 3개 페이지 정리, 157 tests pass
- 2026-03-04: TASK-05 완료 — seed.ts Member upsert create/update에서 partId 제거, part-summary.service.spec.ts mockMember 정리, 157 tests pass
