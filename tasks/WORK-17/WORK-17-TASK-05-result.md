# WORK-17-TASK-05 수행 결과 보고서

> 작업일: 2026-03-03
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

schema.prisma에 쿼리 성능 개선용 @@index를 9개 추가했다.
FK 컬럼에 단독 인덱스가 없어 발생하던 HIGH #12 이슈를 해소했다.
아울러 TASK-03에서 변경된 `isJoined → isMember` 필드명이 반영되지 않은
team-join.service.spec.ts도 함께 수정했다.

---

## 2. 완료 기준 달성 현황

| 기준 | 상태 |
|------|------|
| schema.prisma에 @@index 선언 최소 9개 추가 | ✅ (9개) |
| bunx prisma validate 성공 | ✅ |
| bunx prisma migrate dev 성공 | — (Docker DB 미구동, validate로 대체) |
| 백엔드 빌드 통과 | ✅ |
| 기존 백엔드 테스트 통과 | ✅ (90/90) |

---

## 3. 체크리스트 완료 현황

| 모델 | 추가 인덱스 | 완료 |
|------|------------|------|
| WorkItem | @@index([weeklyReportId]) | ✅ |
| WorkItem | @@index([projectId]) | ✅ |
| WeeklyReport | @@index([weekStart]) | ✅ |
| TeamMembership | @@index([memberId]) | ✅ |
| TeamMembership | @@index([teamId]) | ✅ |
| PartSummary | @@index([weekStart]) | ✅ |
| SummaryWorkItem | @@index([partSummaryId]) | ✅ |
| TeamJoinRequest | @@index([memberId]) | ✅ |
| TeamJoinRequest | @@index([teamId]) | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — team-join.service.spec.ts isJoined 필드명 잔존

**증상**: `bun run test` 실행 시 90개 중 2개 실패 (isJoined 기대값)
**원인**: TASK-03에서 team-join.service.ts의 응답 필드를 isJoined → isMember로 변경했으나
  spec 파일의 expect 구문이 갱신되지 않음
**수정**: team-join.service.spec.ts의 `isJoined` 2곳을 `isMember`로 수정

---

## 5. 최종 검증 결과

```
# @@index 개수 확인
grep -c "@@index" packages/backend/prisma/schema.prisma
→ 9

# Prisma validate
cd packages/backend && bunx prisma validate
→ The schema at prisma/schema.prisma is valid

# 백엔드 빌드
cd packages/backend && bun run build
→ EXIT:0

# 백엔드 테스트
cd packages/backend && bun run test
→ 90 pass
→ 0 fail
→ Ran 90 tests across 10 files. [3.12s]
```

---

## 6. 후속 TASK 유의사항

- Docker DB 구동 시 `bunx prisma migrate dev --name add_performance_indexes`로 실제 마이그레이션 적용 필요
- TASK-07 통합 검증에서 전체 빌드/테스트 재확인

---

## 7. 산출물 목록

| 파일 | 구분 | 내용 |
|------|------|------|
| `packages/backend/prisma/schema.prisma` | 수정 | @@index 9개 추가 |
| `packages/backend/src/team/team-join.service.spec.ts` | 수정 | isJoined → isMember (2곳) |
