# Team Switching Bug Investigation Report

## Problem Statement
When switching teams in the sidebar/team selection, the displayed members, projects, and work content does NOT change. The same data shows regardless of which team is selected.

## Root Cause Analysis

### Issue Summary
**The application uses `user?.teamId` (from authStore) instead of `currentTeamId` (from teamStore) to fetch team-specific data.**

The `authStore` contains the user's default/primary team from login, which never changes during the session. Meanwhile, `teamStore.currentTeamId` is correctly updated when the user switches teams via the sidebar, but **this value is not being used in API calls**.

### Architecture Issue
1. **teamStore** (`packages/frontend/src/stores/teamStore.ts`):
   - Successfully stores and updates `currentTeamId` when user switches teams
   - Called by Sidebar.tsx `handleSwitchTeam()` function
   - Persists to localStorage via Zustand persist middleware

2. **authStore** (`packages/frontend/src/stores/authStore.ts`):
   - Contains `user` object with immutable `teamId` (from login JWT)
   - Never changes after login
   - Used by all pages for team-specific data fetching

3. **Pages affected** - all using `user?.teamId` instead of `currentTeamId`:
   - Dashboard.tsx (line 128)
   - PartStatus.tsx (line 88)
   - ProjectMgmt.tsx (line 184)
   - ReportConsolidation.tsx (line 63)
   - TeamMgmt.tsx (line 208)

### API Flow (Broken)
```
User switches team in Sidebar
  ↓
Sidebar.handleSwitchTeam() → setCurrentTeamId(newTeamId) ✓
  ↓
Navigate to '/' (Dashboard)
  ↓
Dashboard renders with teamId = user?.teamId ✗
  ↓
useQuery(['team-weekly-overview', teamId, currentWeek])
  ↓
Query uses OLD teamId (from user.teamId, not currentTeamId)
  ↓
API returns data for PRIMARY team, NOT selected team
```

### How Data Flows Through Pages

**Dashboard.tsx (lines 128-135)**:
```typescript
const teamId = user?.teamId ?? '';  // ← Uses authStore, NEVER changes

const { data: teamOverview = [] } = useQuery({
  queryKey: ['team-weekly-overview', teamId, currentWeek],
  queryFn: () =>
    partApi.getTeamWeeklyOverview(teamId, currentWeek).then((r) => r.data.data),
  enabled: (isLeader || isPartLeader) && !!teamId,
});
```

**PartStatus.tsx (lines 88-110)**:
```typescript
const teamId = user?.teamId ?? '';  // ← Uses authStore, NEVER changes

// Queries use this static teamId:
const { data: allStatusList = [] } = useQuery({
  queryKey: isLeader
    ? ['team-members-weekly-status', teamId, currentWeek]  // ← teamId from authStore
    : ['part-weekly-status', userPartId, currentWeek],
  queryFn: () =>
    isLeader
      ? partApi.getTeamMembersWeeklyStatus(teamId, currentWeek).then((r) => r.data.data)
      : partApi.getPartWeeklyStatus(userPartId, currentWeek).then((r) => r.data.data),
  enabled: isLeader ? !!teamId : !!userPartId,
});
```

**TeamMgmt.tsx (line 208)**, **ProjectMgmt.tsx (line 184)**, **ReportConsolidation.tsx (line 63)**: Same pattern

### Hook Dependencies (All Correct)
The hooks themselves accept `teamId` parameter and work correctly:
- `useTeamMembers(teamId)` - enabled only when teamId provided ✓
- `useTeamProjects(teamId)` - enabled only when teamId provided ✓
- `useParts(teamId)` - enabled only when teamId provided ✓

**Problem**: Pages don't pass `currentTeamId` from teamStore; they pass `user?.teamId` from authStore

## Solution Strategy

Each affected page needs to:
1. Import `useTeamStore` 
2. Extract `currentTeamId` from teamStore (not authStore)
3. Pass `currentTeamId` to all API query keys and API calls
4. Ensure query invalidation uses currentTeamId too

### Files to Fix
1. Dashboard.tsx - line 128 onwards
2. PartStatus.tsx - line 88 onwards
3. ProjectMgmt.tsx - line 184 onwards
4. ReportConsolidation.tsx - line 63 onwards
5. TeamMgmt.tsx - line 208 onwards

### Implementation Pattern

**Current (Wrong)**:
```typescript
const teamId = user?.teamId ?? '';
```

**Fixed (Right)**:
```typescript
const { currentTeamId } = useTeamStore();
const teamId = currentTeamId ?? user?.teamId ?? '';  // fallback to user team
```

## AppLayout.tsx Behavior (For Context)
- Automatically sets `currentTeamId` when:
  - User logs in with 1 team: auto-selects it
  - User has 2+ teams: redirects to `/teams` to choose
  - Team list loads: syncs `myTeams` to store
- User can switch manually via Sidebar team selector

## Related Files
- `packages/frontend/src/stores/teamStore.ts` - currentTeamId storage ✓ (working correctly)
- `packages/frontend/src/components/layout/Sidebar.tsx` - team switching handler ✓ (working correctly)
- `packages/frontend/src/components/layout/AppLayout.tsx` - initial team setup ✓ (working correctly)
- `packages/frontend/src/stores/authStore.ts` - immutable user data (correct, but not for team switching)
