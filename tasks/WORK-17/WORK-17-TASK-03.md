# WORK-17-TASK-03: BE — part-summary 공통 메서드 추출 + API 필드명 정규화

## WORK
WORK-17: 코드 품질 개선 — CRITICAL/HIGH 이슈 수정

## Dependencies
- WORK-17-TASK-02 (required)

## Scope

수정 대상 이슈: #6 (HIGH), #11 (HIGH)

### 1. [HIGH #6] part-summary.service.ts 쿼리 중복 추출

현재 `autoMerge`, `getPartWeeklyStatus`, `getTeamMembersWeeklyStatus` 등 여러 메서드에서
WeeklyReport + member + workItems + project include 패턴이 반복됨.

추출 전략:
- private 메서드 `findWeeklyReportsWithItems(partId: string, weekStart: Date)` 생성
- 공통 include 옵션을 상수 또는 헬퍼로 추출

### 2. [HIGH #11] team-join.service.ts 응답 필드명 정규화

현재 listTeams 응답:
```
{
  ...team,
  memberCount: team._count.teamMemberships,
  isJoined: myTeamIds.includes(team.id),   // <-- 변경 대상
  _count: undefined,
}
```

수정 후:
```
{
  ...team,
  memberCount: team._count.teamMemberships,
  isMember: myTeamIds.includes(team.id),   // isJoined -> isMember
  _count: undefined,
}
```

변경 전 전체 파일 grep으로 isJoined 참조 위치 확인 필수:
```
grep -rn "isJoined" packages/
```

### 3. [HIGH #11] 프론트엔드 useTeams.ts 방어적 매핑 제거

현재 useTeams.ts:
```
isMember: t.isMember ?? t.isJoined ?? false,
```
```
id: t.teamId ?? t.id,
name: t.teamName ?? t.name,
```

수정 후 (백엔드 응답이 정규화되었으므로 단일 필드 참조):
```
isMember: t.isMember,
```
```
id: t.id,
name: t.name,
```

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/backend/src/weekly-report/part-summary.service.ts` | MODIFY | 공통 쿼리 메서드 추출 |
| `packages/backend/src/team/team-join.service.ts` | MODIFY | isJoined → isMember |
| `packages/frontend/src/hooks/useTeams.ts` | MODIFY | 방어적 매핑 제거 |

## Acceptance Criteria

- [ ] part-summary.service.ts에 findWeeklyReportsWithItems 또는 동등한 private 메서드 존재
- [ ] part-summary.service.ts에서 동일 include 패턴이 1회만 정의됨
- [ ] team-join.service.ts 응답에 isMember 필드 존재, isJoined 없음
- [ ] useTeams.ts에 isJoined 참조 없음
- [ ] useTeams.ts에 teamId ?? t.id 방어 코드 없음
- [ ] 백엔드 빌드 통과
- [ ] 프론트엔드 빌드 통과

## Verify

```
grep -n "isJoined" packages/backend/src/team/team-join.service.ts || echo "OK - isJoined removed from BE"
grep -n "isJoined" packages/frontend/src/hooks/useTeams.ts || echo "OK - isJoined removed from FE"
grep -n "teamId ??" packages/frontend/src/hooks/useTeams.ts || echo "OK - defensive mapping removed"
cd packages/backend && bun run build 2>&1 | tail -10
cd packages/frontend && bun run build 2>&1 | tail -10
```
