# WORK-17-TASK-05: BE — DB 인덱스 마이그레이션

## WORK
WORK-17: 코드 품질 개선 — CRITICAL/HIGH 이슈 수정

## Dependencies
- WORK-17-TASK-03 (required)

## Scope

수정 대상 이슈: #12 (HIGH)

schema.prisma에 쿼리 성능 개선을 위한 단독 인덱스를 추가한다.
현재 @@unique 복합 유니크 제약은 있으나 FK 컬럼에 단독 인덱스가 없어 조인 쿼리 성능이 저하될 수 있다.

### 추가할 인덱스 목록

| 모델 | 추가 인덱스 | 이유 |
|------|------------|------|
| WorkItem | @@index([weeklyReportId]) | 보고서별 업무항목 조회 빈번 |
| WorkItem | @@index([projectId]) | 프로젝트별 업무항목 조회 |
| WeeklyReport | @@index([weekStart]) | 주차별 보고서 조회 |
| TeamMembership | @@index([memberId]) | 팀원의 팀 목록 조회 |
| TeamMembership | @@index([teamId]) | 팀의 팀원 목록 조회 |
| PartSummary | @@index([weekStart]) | 주차별 취합보고 조회 |
| SummaryWorkItem | @@index([partSummaryId]) | 취합보고별 항목 조회 |
| TeamJoinRequest | @@index([memberId]) | 팀원의 가입 신청 목록 조회 |
| TeamJoinRequest | @@index([teamId]) | 팀의 가입 신청 목록 조회 |

### 마이그레이션 절차

1. schema.prisma 각 모델에 @@index 추가
2. Docker DB 구동 확인: `docker compose ps`
3. `cd packages/backend && bunx prisma migrate dev --name add_performance_indexes`
4. 마이그레이션 파일 생성 확인

DB 미구동 시 대안: `bunx prisma validate` 로 스키마 유효성만 검증

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/backend/prisma/schema.prisma` | MODIFY | @@index 9개 추가 |
| `packages/backend/prisma/migrations/*/migration.sql` | CREATE | 마이그레이션 SQL |

## Acceptance Criteria

- [ ] schema.prisma에 @@index 선언 최소 9개 추가
- [ ] bunx prisma validate 성공
- [ ] bunx prisma migrate dev 성공 (또는 Docker 미구동 시 validate만)
- [ ] 백엔드 빌드 통과
- [ ] 기존 백엔드 테스트 통과

## Verify

```
grep -c "@@index" packages/backend/prisma/schema.prisma
cd packages/backend && bunx prisma validate 2>&1
cd packages/backend && bun run build 2>&1 | tail -10
cd packages/backend && bun run test 2>&1 | tail -20
```
