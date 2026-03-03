# 403 Forbidden Error Investigation - Team Project Management

## ROOT CAUSE IDENTIFIED

The team project management page is calling the **admin-only API endpoint** when it should use the public project API endpoint.

### The Bug
- **File**: `packages/frontend/src/pages/ProjectMgmt.tsx` (Line 27)
- **Problematic Code**: `const { data: allProjects = [], isLoading } = useAdminProjects();`
- **API Call**: `GET /api/v1/admin/projects?limit=100`
- **Role Required**: `ADMIN` only
- **User Role**: `PART_LEADER` (team project manager)
- **Result**: 403 Forbidden error

### Why This Happened
In commit 2ed9fcc (WORK-16-TASK-06: 팀 프로젝트 관리 프론트엔드), the ProjectMgmt.tsx was completely rewritten to support team-specific project management with drag-and-drop reordering. The AddProjectModal component was added to allow PART_LEADER users to add available projects to their team.

However, the implementation incorrectly uses `useAdminProjects()` hook which calls the admin-restricted endpoint instead of the public `useProjects()` hook.

## CORRECT SOLUTION

Replace the admin-only hook with the public projects hook:

### Current (WRONG):
```typescript
// Line 27 in ProjectMgmt.tsx
const { data: allProjects = [], isLoading } = useAdminProjects();
```

### Should Be:
```typescript
const { data: allProjects = [], isLoading } = useProjects();
```

### Supporting Evidence

#### Available API Endpoints
1. **Admin Endpoint** (line 87 in admin.api.ts):
   ```typescript
   '/admin/projects'  // @Roles(ADMIN) - line 26 in admin.controller.ts
   ```

2. **Public Endpoint** (line 28 in project.api.ts):
   ```typescript
   '/projects'  // Line 13-14 in project.controller.ts: @UseGuards(JwtAuthGuard, RolesGuard)
   // No @Roles decorator = accessible to all authenticated users
   ```

#### Hook Implementations
- `useAdminProjects()` - calls `adminApi.getProjects()` → `/api/v1/admin/projects` (ADMIN only)
- `useProjects()` - calls `projectApi.getProjects()` → `/api/v1/projects` (all authenticated users)

#### Backend Controller Guards
- **AdminController** (admin.controller.ts, line 26): `@Roles(MemberRole.ADMIN)`
- **ProjectController** (project.controller.ts, line 14): `@UseGuards(JwtAuthGuard, RolesGuard)` without explicit role check

The RolesGuard will allow access if:
1. No @Roles decorator is present on the method/class, OR
2. User's role matches one of the required roles

Since ProjectController methods have no @Roles decorator, they're accessible to all authenticated users.

## FILES INVOLVED

### Frontend
- **C:\rnd\weekly-report\packages\frontend\src\pages\ProjectMgmt.tsx** (line 27)
  - Imports: `useAdminProjects` ✗ Should be `useProjects`
  - Line 27: Uses `useAdminProjects()` to fetch projects for the AddProjectModal
  
- **C:\rnd\weekly-report\packages\frontend\src\hooks\useProjects.ts**
  - Contains the correct public hook: `useProjects()` (line 4-9)
  - Also has: `useTeamProjects()`, `useAddTeamProjects()`, `useRemoveTeamProject()`, `useReorderTeamProjects()`

- **C:\rnd\weekly-report\packages\frontend\src\hooks\useAdmin.ts**
  - Contains the admin-only hook: `useAdminProjects()` (line 61-66)
  - Should NOT be used for PART_LEADER user features

- **C:\rnd\weekly-report\packages\frontend\src\api\project.api.ts**
  - Defines `projectApi.getProjects()` → calls `/projects` endpoint (public)

- **C:\rnd\weekly-report\packages\frontend\src\api\admin.api.ts**
  - Defines `adminApi.getProjects()` → calls `/admin/projects` endpoint (admin-only)

### Backend
- **C:\rnd\weekly-report\packages\backend\src\project\project.controller.ts** (lines 13-27)
  - `GET /api/v1/projects` endpoint
  - Guards: `JwtAuthGuard, RolesGuard` only (no role restriction)
  - Method: `findAll(query: ProjectQueryDto)`

- **C:\rnd\weekly-report\packages\backend\src\admin\admin.controller.ts** (lines 73-76)
  - `GET /api/v1/admin/projects` endpoint
  - Guards: `@Roles(MemberRole.ADMIN)` (line 26)
  - Method: `listProjects(dto: ListGlobalProjectsDto)`

- **C:\rnd\weekly-report\packages\backend\src\common/guards/roles.guard.ts** (lines 10-21)
  - Checks if user.roles includes any required role

## COMMITS RELATED TO THIS ISSUE
- **2ed9fcc** (2026-03-03): "WORK-16-TASK-06: 팀 프로젝트 관리 프론트엔드" - Introduced the bug
- **6824c88** (2026-03-03): "WORK-16-TASK-05: Admin 프로젝트 관리 프론트엔드" - Admin page (uses admin API correctly)

## GIT STATUS
Current modified files:
- packages/frontend/src/hooks/useTeams.ts (typing improvement, unrelated)
- packages/frontend/src/pages/ProjectMgmt.tsx (contains the bug on line 27)
- packages/backend/src/team/member.service.spec.ts (test file, unrelated)
- packages/frontend/tsconfig.tsbuildinfo (auto-generated)
- turbo.json (configuration)
