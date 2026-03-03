# Team Name Display Issue Investigation

## Problem Statement
When a user (홍길동, LEADER role) logs in, the team name is not displayed in the sidebar user info section.

## Data Flow Analysis

### Backend - Login Flow (/auth/login)
1. **LocalStrategy** (`auth/strategies/local.strategy.ts`)
   - Calls `AuthService.validateMember(email, password)`
   - Query includes: `include: { part: { include: { team: true } } }`
   - Returns full member object with part and team relations

2. **AuthService.login()** (`auth/auth.service.ts`, lines 106-149)
   - Input: member object with `member.part?.name` and `member.part?.teamId`
   - Creates JWT payload with: `teamId: member.part?.teamId ?? null`
   - Returns user object:
   ```typescript
   {
     id, name, email, roles, partId,
     partName: member.part?.name ?? null,
     teamId: member.part?.teamId ?? null  // ✅ Has teamId
   }
   ```
   - **MISSING: teamName field is NOT included in the response**

### Frontend - AuthStore (`packages/frontend/src/stores/authStore.ts`)
1. **User Type Definition** (lines 4-13)
   ```typescript
   interface User {
     id: string;
     name: string;
     email: string;
     roles: ('ADMIN' | 'LEADER' | 'PART_LEADER' | 'MEMBER')[];
     partId: string;
     partName: string;  // ✅ Part name is stored
     teamId: string;    // ✅ Team ID is stored
     mustChangePassword?: boolean;
     // ❌ MISSING: teamName is NOT defined in User type
   }
   ```

### Frontend - Sidebar Display Logic (`packages/frontend/src/components/layout/Sidebar.tsx`)
1. **Line 131**: Gets current team from myTeams array
   ```typescript
   const currentTeam = myTeams.find((t) => t.id === currentTeamId);
   ```

2. **Line 239**: Displays team name
   ```typescript
   {currentTeam ? currentTeam.name : (user.partName || '팀 미선택')}
   ```
   - If currentTeamId is null or not yet matched in myTeams → falls back to `user.partName`
   - Even if team name was stored in User object, it would not be displayed here

3. **Problem**: 
   - `currentTeamId` is from `useTeamStore` (starts as null)
   - `myTeams` is from `/my/teams` endpoint (fetches via useMyTeams hook)
   - On initial load, currentTeamId is null → display falls back to user.partName
   - Even if currentTeamId were set, the Sidebar correctly fetches team name from myTeams
   - But there's NO automatic initialization of currentTeamId on login

### Backend - /my/teams Endpoint (`team-join.service.ts`, lines 265-295)
Returns rich team data:
```typescript
{
  membershipId, teamId, teamName, teamDescription, 
  teamStatus, memberCount, partId, partName, roles, joinedAt
}
```
✅ **teamName is correctly returned here**

## Root Cause Analysis

**PRIMARY ISSUE**: 
The `currentTeamId` in Zustand `teamStore` is NOT automatically initialized when user logs in. It remains null until explicitly set by user clicking "팀 선택" or switching teams.

When `currentTeamId` is null:
- Line 239 in Sidebar: `currentTeam` is undefined
- Falls back to `user.partName` instead of showing team name
- But user.partName shows "파트 이름" (part name), not team name

**SECONDARY ISSUE**:
- Backend login response doesn't include `teamName` (only `teamId` and `partName`)
- If we want to display team name immediately on login without fetching /my/teams, we need `teamName` in User object
- However, the current architecture uses /my/teams endpoint which HAS teamName

## Data Dependencies
```
Login Response → AuthStore.user
  - Has: partName, teamId (but NOT teamName)
  
/my/teams Response → teamStore + useMyTeams hook
  - Has: teamId, teamName (full rich data)
  - Used for team selection menu

Sidebar Display Logic
  - Shows: currentTeam.name if currentTeamId is set
  - Falls back to: user.partName if currentTeamId is null
```

## Solution Options

### Option 1: Auto-initialize currentTeamId on login
- After successful login, fetch /my/teams
- Auto-set currentTeamId to first/primary team
- Pros: Consistent with 홍길동 being LEADER with single team assignment
- Cons: Extra API call on login

### Option 2: Add teamName to login response
- Backend: Include teamName in AuthService.login() return value
- Frontend: Add teamName to User interface
- Sidebar: Use `user.teamName` as fallback instead of `user.partName`
- Pros: No extra API call
- Cons: Need to fetch team.name in backend (validateMember already includes team)

### Option 3: Hybrid approach
- Add teamName to login response (quick display)
- Still auto-initialize currentTeamId (for team switcher UI consistency)
- Pros: Best UX - team name displays immediately, team menu ready
- Cons: More changes in both frontend and backend

## Current Data Available in System

When 홍길동 (LEADER) logs in:
- From Member query in `validateMember()`: part.team is loaded
- team.name IS available in the member object during login
- Just not included in the API response to frontend

## Files Involved
1. **Backend**: 
   - `packages/backend/src/auth/auth.service.ts` - login() method
   - `packages/backend/src/auth/strategies/local.strategy.ts` - validateMember call
   
2. **Frontend**:
   - `packages/frontend/src/stores/authStore.ts` - User type definition
   - `packages/frontend/src/components/layout/Sidebar.tsx` - Display logic (line 239)
   - `packages/frontend/src/stores/teamStore.ts` - currentTeamId initialization
   
3. **Supporting**:
   - `packages/backend/src/team/team-join.service.ts` - /my/teams endpoint
   - `packages/frontend/src/hooks/useTeams.ts` - useMyTeams hook
