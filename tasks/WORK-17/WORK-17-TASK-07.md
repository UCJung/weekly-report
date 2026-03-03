# WORK-17-TASK-07: 통합 검증 + PROGRESS 업데이트

## WORK
WORK-17: 코드 품질 개선 — CRITICAL/HIGH 이슈 수정

## Dependencies
- WORK-17-TASK-05 (required)
- WORK-17-TASK-06 (required)

## Scope

WORK-17의 모든 TASK 완료 후 전체 검증을 수행하고 결과를 기록한다.

### 검증 체크리스트

**CRITICAL 이슈 재검증**:
- #1: password123 하드코딩 제거 확인
- #2: 주차 유틸 중복 제거 확인
- #3: 상수 파일 통합 확인

**HIGH 이슈 재검증**:
- #4: PaginationDto 상속 확인
- #5: any 타입 제거 확인
- #6: part-summary 공통 메서드 확인
- #7: staleTime 설정 확인
- #9: MemberRole ADMIN 추가 확인
- #10: ProjectStatus 정합 확인
- #11: 필드명 정규화 확인
- #12: DB 인덱스 추가 확인

### 산출물

- `tasks/PROGRESS.md` — WORK-17 완료 현황 갱신
- `tasks/WORK-17/WORK-17-수행결과.md` — 수행결과 보고서 (CLAUDE.md 섹션 14 템플릿)

## Files

| Path | Action | Description |
|------|--------|-------------|
| `tasks/PROGRESS.md` | MODIFY | WORK-17 완료 현황 갱신 |
| `tasks/WORK-17/WORK-17-수행결과.md` | CREATE | 수행결과 보고서 |

## Acceptance Criteria

- [ ] bun run build (루트) 성공
- [ ] bun run test (루트) 전체 통과
- [ ] grep "password123" packages/backend/src/ 결과 없음
- [ ] grep "function getWeekLabel" packages/frontend/src/pages/ 결과 없음
- [ ] grep "isJoined" packages/frontend/src/hooks/useTeams.ts 결과 없음
- [ ] grep "const ROLE_LABEL" packages/frontend/src/pages/Dashboard.tsx 결과 없음
- [ ] schema.prisma @@index 9개 이상 확인
- [ ] PROGRESS.md WORK-17 항목 갱신 완료
- [ ] 수행결과 보고서 생성 완료

## Verify

```
cd /c/rnd/weekly-report && bun run build 2>&1 | tail -30
cd /c/rnd/weekly-report && bun run test 2>&1 | tail -30
grep -r "password123" packages/backend/src/ || echo "OK - CRITICAL #1 cleared"
grep -rn "function getWeekLabel" packages/frontend/src/pages/ || echo "OK - CRITICAL #2 cleared"
grep -n "const ROLE_LABEL" packages/frontend/src/pages/Dashboard.tsx || echo "OK - CRITICAL #3 cleared"
grep -n "isJoined" packages/frontend/src/hooks/useTeams.ts || echo "OK - #11 cleared"
grep -c "@@index" packages/backend/prisma/schema.prisma
```
