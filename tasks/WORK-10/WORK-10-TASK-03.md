# WORK-10-TASK-03: PartStatus.tsx 전면 재작성

## WORK
WORK-10: 업무현황 페이지 개편

## Dependencies
- WORK-10-TASK-02 (required)

## Scope

`PartStatus.tsx`를 요구사항에 맞게 전면 재작성한다.

**변경 요약**:
- 파트 선택 필터 추가 (파트 → 팀원 종속 필터)
- 상태 필터 제거
- 뷰 모드 선택 추가 (프로젝트별 보기 / 팀원별 보기)
- 프로젝트 컬럼: name + code 통합 표시 (`"프로젝트명 (CODE)"`)
- 상태 컬럼 제거 (작성현황에서 확인)
- 프로젝트별 보기 컬럼: 프로젝트 | 팀원 | 파트 | 진행업무 | 예정업무 | 비고
- 팀원별 보기 컬럼: 팀원 | 파트 | 프로젝트 | 진행업무 | 예정업무 | 비고
- 프로젝트 정렬: project.sortOrder 기준

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/frontend/src/pages/PartStatus.tsx` | REWRITE | 전면 재작성 |

## 상세 작업 내용

### 데이터 로드 전략

#### PART_LEADER (파트장)
- 파트 선택 필터 없음 (자기 파트 고정, `user.partId`)
- `partApi.getPartWeeklyStatus(user.partId, week)` 호출

#### LEADER (팀장)
- 파트 선택 필터 노출: `GET /api/v1/teams/:teamId/parts` 로 파트 목록 조회
- 파트 선택 = "전체" 이면 `partApi.getTeamMembersWeeklyStatus(user.teamId, week)` 호출
- 파트 선택 = 특정 파트 이면 `partApi.getPartWeeklyStatus(selectedPartId, week)` 호출

### 필터 상태 구조

```ts
// 파트 선택 (LEADER만)
const [partFilter, setPartFilter] = useState<string>('all');  // 'all' | partId

// 팀원 선택 (파트 선택에 종속)
const [memberFilter, setMemberFilter] = useState<string>('');

// 프로젝트 선택
const [projectFilter, setProjectFilter] = useState<string>('');

// 뷰 모드
const [viewMode, setViewMode] = useState<'project' | 'member'>('project');
```

### 파트 선택 → 팀원 선택 종속 로직

```ts
// 파트 변경 시 팀원 필터 초기화
const handlePartFilterChange = (v: string) => {
  setPartFilter(v === 'all' ? 'all' : v);
  setMemberFilter('');  // 팀원 필터 초기화
};

// 팀원 옵션: 현재 로드된 statusList에서 추출
// (partFilter가 변경되면 statusList가 다시 로드되므로 자동으로 재구성)
const memberOptions = useMemo(() => {
  const seen = new Set<string>();
  return statusList
    .map((e) => ({ id: e.member.id, name: e.member.name }))
    .filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
}, [statusList]);
```

### 프로젝트 정렬 (sortOrder 기반)

statusList에서 workItems를 평탄화할 때 project.sortOrder 기준으로 정렬:

```ts
// 프로젝트 옵션 생성 시 sortOrder 정렬
const projectOptions = useMemo(() => {
  const seen = new Map<string, { id: string; name: string; code: string; sortOrder: number }>();
  for (const entry of statusList) {
    for (const item of entry.report?.workItems ?? []) {
      if (item.project && !seen.has(item.project.id)) {
        seen.set(item.project.id, {
          id: item.project.id,
          name: item.project.name,
          code: item.project.code,
          sortOrder: item.project.sortOrder ?? 0,
        });
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}, [statusList]);
```

### 뷰 모드별 행 구성

#### 프로젝트별 보기 (viewMode === 'project')

- 기준 그룹: 프로젝트
- 행 구조: 프로젝트(rowspan) | 팀원 | 파트 | 진행업무 | 예정업무 | 비고
- 정렬: project.sortOrder → member.name

```
프로젝트 (rowspan N) | 팀원A | 파트 | 진행업무 | 예정업무 | 비고
                     | 팀원B | 파트 | 진행업무 | 예정업무 | 비고
프로젝트2 (rowspan M)| 팀원A | 파트 | ...
```

#### 팀원별 보기 (viewMode === 'member')

- 기준 그룹: 팀원
- 행 구조: 팀원(rowspan) | 파트(rowspan) | 프로젝트 | 진행업무 | 예정업무 | 비고
- 정렬: member.name → project.sortOrder

```
팀원A (rowspan N) | 파트 | 프로젝트1 | 진행업무 | 예정업무 | 비고
                  |      | 프로젝트2 | ...
팀원B (rowspan M) | 파트 | 프로젝트1 | ...
```

### 프로젝트 컬럼 표시 형식

```tsx
// 프로젝트명 + 코드 통합
<td>
  <span className="text-[12.5px] font-medium text-[var(--text)]">{project.name}</span>
  <span className="ml-1 font-mono text-[11px] text-[var(--text-sub)]">({project.code})</span>
</td>
```

### 파트 선택 필터 표시 조건

```tsx
{/* LEADER만 파트 선택 보여줌 */}
{user?.role === 'LEADER' && (
  <Select value={partFilter} onValueChange={handlePartFilterChange}>
    <SelectTrigger className="w-[130px] h-[30px] text-[12.5px]">
      <SelectValue placeholder="전체 파트" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">전체 파트</SelectItem>
      {partOptions.map((p) => (
        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```

### 뷰 모드 토글 UI

필터 바 오른쪽 또는 테이블 헤더 영역에 버튼 그룹으로 배치:

```tsx
<div className="flex items-center gap-1 border border-[var(--gray-border)] rounded-md p-0.5">
  <button
    onClick={() => setViewMode('project')}
    className={[
      'px-3 py-1 text-[12px] rounded transition-colors',
      viewMode === 'project'
        ? 'bg-[var(--primary)] text-white font-medium'
        : 'text-[var(--text-sub)] hover:text-[var(--text)]',
    ].join(' ')}
  >
    프로젝트별
  </button>
  <button
    onClick={() => setViewMode('member')}
    className={[
      'px-3 py-1 text-[12px] rounded transition-colors',
      viewMode === 'member'
        ? 'bg-[var(--primary)] text-white font-medium'
        : 'text-[var(--text-sub)] hover:text-[var(--text)]',
    ].join(' ')}
  >
    팀원별
  </button>
</div>
```

### 작성현황 바 유지

기존 `파트원 작성 현황` 바는 유지한다. 단, LEADER가 전체 파트 선택 시에는
`partApi.getTeamMembersWeeklyStatus` 기반으로 submission status도 팀 전체 표시.

## Acceptance Criteria

- [ ] LEADER 접속 시 파트 선택 필터 노출, PART_LEADER는 미노출(자기 파트 고정)
- [ ] 파트 선택 변경 시 팀원 필터가 초기화되고 해당 파트 팀원만 표시
- [ ] 상태 필터 없음
- [ ] 뷰 모드 토글 버튼(프로젝트별/팀원별) 존재
- [ ] 프로젝트별 보기: 프로젝트 | 팀원 | 파트 | 진행업무 | 예정업무 | 비고 순서 컬럼
- [ ] 팀원별 보기: 팀원 | 파트 | 프로젝트 | 진행업무 | 예정업무 | 비고 순서 컬럼
- [ ] 프로젝트 컬럼: "프로젝트명 (CODE)" 형태로 name + code 통합 표시
- [ ] 상태(DRAFT/SUBMITTED) 컬럼 없음
- [ ] 프로젝트 정렬이 sortOrder 기준
- [ ] `bun run build` 오류 없음
- [ ] TypeScript 타입 오류 없음

## Verify

```bash
# 1. 프론트엔드 빌드
cd C:/rnd/weekly-report/packages/frontend && bun run build 2>&1 | tail -30

# 2. 뷰 모드 토글 존재 확인
grep -n "viewMode\|프로젝트별\|팀원별" C:/rnd/weekly-report/packages/frontend/src/pages/PartStatus.tsx

# 3. 파트 필터 존재 확인
grep -n "partFilter\|partOptions\|LEADER" C:/rnd/weekly-report/packages/frontend/src/pages/PartStatus.tsx

# 4. 상태 필터/컬럼 제거 확인 (0 건이어야 함)
grep -n "statusFilter\|상태 필터\|SUBMITTED\|DRAFT\|STATUS_INFO" C:/rnd/weekly-report/packages/frontend/src/pages/PartStatus.tsx | grep -v "submissionList\|SubmissionStatus\|NOT_STARTED"

# 5. 린트
cd C:/rnd/weekly-report/packages/frontend && bun run lint 2>&1 | tail -20
```
