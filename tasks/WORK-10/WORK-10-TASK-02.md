# WORK-10-TASK-02: 백엔드 API 확장 (파트 다중 조회 + member 응답 확장)

## WORK
WORK-10: 업무현황 페이지 개편

## Dependencies
- WORK-10-TASK-01 (required)

## Scope

1. `getPartWeeklyStatus` 응답의 `member` 객체에 `partId`, `partName` 추가
2. LEADER가 팀 전체 파트원 업무 현황을 한 번에 조회할 수 있는 엔드포인트 추가:
   `GET /api/v1/teams/:teamId/members-weekly-status?week=`
3. frontend `part.api.ts`의 타입 및 API 함수 업데이트

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/backend/src/weekly-report/part-summary.service.ts` | MODIFY | getPartWeeklyStatus member 응답에 partId/partName 추가, getTeamMembersWeeklyStatus 메서드 추가 |
| `packages/backend/src/weekly-report/part-summary.controller.ts` | MODIFY | GET teams/:teamId/members-weekly-status 엔드포인트 추가 |
| `packages/frontend/src/api/part.api.ts` | MODIFY | MemberWeeklyStatus.member 타입 확장, getTeamMembersWeeklyStatus API 함수 추가 |

## 상세 작업 내용

### 1. part-summary.service.ts — getPartWeeklyStatus 응답 확장

`getPartWeeklyStatus` 메서드에서 member 응답에 partId, partName을 포함시킨다.
현재 member include에 `part` 정보가 없으므로 추가한다:

```ts
async getPartWeeklyStatus(partId: string, week: string) {
  const { start } = getWeekRange(week);

  const members = await this.prisma.member.findMany({
    where: { partId, isActive: true },
    include: {
      part: true,          // ← 추가
      weeklyReports: {
        where: { weekStart: start },
        include: {
          workItems: {
            include: { project: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });

  return members.map((member) => ({
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
      partId: member.partId,       // ← 추가
      partName: member.part.name,  // ← 추가
    },
    report: member.weeklyReports[0] ?? null,
  }));
}
```

### 2. part-summary.service.ts — getTeamMembersWeeklyStatus 메서드 추가

팀장이 팀 전체 파트원의 업무현황을 조회하는 메서드를 추가한다.
파트 선택이 없을 때(전체) LEADER가 사용한다.

```ts
async getTeamMembersWeeklyStatus(teamId: string, week: string) {
  const { start } = getWeekRange(week);

  const members = await this.prisma.member.findMany({
    where: { part: { teamId }, isActive: true },
    include: {
      part: true,
      weeklyReports: {
        where: { weekStart: start },
        include: {
          workItems: {
            include: { project: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
    orderBy: [{ part: { name: 'asc' } }, { name: 'asc' }],
  });

  return members.map((member) => ({
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
      partId: member.partId,
      partName: member.part.name,
    },
    report: member.weeklyReports[0] ?? null,
  }));
}
```

### 3. part-summary.controller.ts — 새 엔드포인트 추가

```ts
@Get('teams/:teamId/members-weekly-status')
@Roles(MemberRole.LEADER)
async getTeamMembersWeeklyStatus(
  @Param('teamId') teamId: string,
  @Query() query: PartWeeklyStatusQueryDto,
) {
  return this.partSummaryService.getTeamMembersWeeklyStatus(teamId, query.week);
}
```

### 4. frontend part.api.ts 타입 및 API 업데이트

```ts
export interface MemberWeeklyStatus {
  member: {
    id: string;
    name: string;
    role: string;
    partId: string;    // ← 추가
    partName: string;  // ← 추가
  };
  report: { ... } | null;
}

// API 함수 추가
getTeamMembersWeeklyStatus: (teamId: string, week: string) =>
  apiClient.get<{ data: MemberWeeklyStatus[] }>(`/teams/${teamId}/members-weekly-status`, {
    params: { week },
  }),
```

## Acceptance Criteria

- [ ] `getPartWeeklyStatus` 응답 member 객체에 `partId`, `partName` 포함
- [ ] `getTeamMembersWeeklyStatus` 서비스 메서드 존재
- [ ] `GET /api/v1/teams/:teamId/members-weekly-status` 엔드포인트 존재 (LEADER 전용)
- [ ] frontend `MemberWeeklyStatus.member` 타입에 `partId`, `partName` 포함
- [ ] frontend `partApi.getTeamMembersWeeklyStatus` 함수 존재
- [ ] 백엔드 빌드 오류 없음
- [ ] 프론트엔드 빌드 오류 없음

## Verify

```bash
# 1. 백엔드 빌드
cd C:/rnd/weekly-report/packages/backend && bun run build 2>&1 | tail -20

# 2. 서비스 메서드 확인
grep -n "partId\|partName\|getTeamMembers" C:/rnd/weekly-report/packages/backend/src/weekly-report/part-summary.service.ts

# 3. 컨트롤러 엔드포인트 확인
grep -n "members-weekly-status" C:/rnd/weekly-report/packages/backend/src/weekly-report/part-summary.controller.ts

# 4. 프론트엔드 타입 확인
grep -n "partId\|partName\|getTeamMembers" C:/rnd/weekly-report/packages/frontend/src/api/part.api.ts

# 5. 프론트엔드 빌드
cd C:/rnd/weekly-report/packages/frontend && bun run build 2>&1 | tail -20
```
