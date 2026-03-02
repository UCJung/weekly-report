# WORK-10-TASK-04: Sidebar/Header 메뉴명·제목 변경

## WORK
WORK-10: 업무현황 페이지 개편

## Dependencies
- WORK-10-TASK-03 (required)

## Scope

사이드바 메뉴명과 헤더 페이지 제목/서브타이틀을 "업무현황"으로 변경한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/frontend/src/components/layout/Sidebar.tsx` | MODIFY | `label: '파트 업무 현황'` → `label: '업무현황'` |
| `packages/frontend/src/components/layout/Header.tsx` | MODIFY | `PAGE_TITLES['/part-status'].title` 및 subtitle 변경 |

## 상세 작업 내용

### 1. Sidebar.tsx 수정

`MENU_GROUPS` 배열에서 `/part-status` 메뉴 항목:

```ts
// 변경 전
{
  path: '/part-status',
  label: '파트 업무 현황',
  icon: <Users size={14} />,
  roles: ['LEADER', 'PART_LEADER'],
},

// 변경 후
{
  path: '/part-status',
  label: '업무현황',
  icon: <Users size={14} />,
  roles: ['LEADER', 'PART_LEADER'],
},
```

### 2. Header.tsx 수정

`PAGE_TITLES` 객체에서 `/part-status` 항목:

```ts
// 변경 전
'/part-status': {
  title: '파트 업무 현황',
  subtitle: '파트 구성원의 이번 주 업무 현황을 확인합니다',
},

// 변경 후
'/part-status': {
  title: '업무현황',
  subtitle: '구성원의 이번 주 업무 현황을 파트·프로젝트·팀원별로 확인합니다',
},
```

## Acceptance Criteria

- [ ] `Sidebar.tsx`의 `/part-status` label이 `'업무현황'`
- [ ] `Header.tsx`의 `PAGE_TITLES['/part-status'].title`이 `'업무현황'`
- [ ] `bun run build` 오류 없음

## Verify

```bash
# 1. Sidebar 메뉴명 확인
grep -n "업무현황\|파트 업무 현황" C:/rnd/weekly-report/packages/frontend/src/components/layout/Sidebar.tsx

# 2. Header 제목 확인
grep -n "업무현황\|파트 업무 현황" C:/rnd/weekly-report/packages/frontend/src/components/layout/Header.tsx

# 3. 프론트엔드 빌드
cd C:/rnd/weekly-report/packages/frontend && bun run build 2>&1 | tail -10
```
