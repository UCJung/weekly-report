# Weekly Report System - Project Overview

## Purpose
주간업무보고 시스템 for 선행연구개발팀 (9 members: DX 4명, AX 5명).
Core features: Team/Part/Member mgmt, Project mgmt, Weekly report grid UI, Part consolidation, Team leader view + Excel export.

## Tech Stack
- **Monorepo**: Turborepo 2.x with Bun 1.2+ package manager
- **Backend**: NestJS 11 + TypeScript 5.x, Prisma 6.x ORM, PostgreSQL 16, Redis 7, JWT auth
- **Frontend**: React 18 + TypeScript, Vite 6, Tailwind CSS 4, TanStack Table v8 + Query v5, Zustand v5, React Router v7
- **Shared**: packages/shared (types + week-utils)

## DB Models (Prisma)
6 core models: Team, Part, Member, Project, WeeklyReport, WorkItem
+ 2 summary models: PartSummary (PART/TEAM scope), SummaryWorkItem

## Architecture
```
packages/
├── shared/     - Types (team, project, weekly-report) + week-utils
├── backend/    - NestJS API (modules: auth, team, project, weekly-report, export, prisma)
└── frontend/   - React SPA (pages, components/grid, api, hooks, stores)
```

## Backend Modules
- auth: login/refresh/me (JWT + Passport)
- team: team/part/member CRUD + reorder
- project: project CRUD
- weekly-report: report CRUD, work-item CRUD, carry-forward, part-summary, auto-merge
- export: Excel generation (part/summary/team)
- common: guards (JWT, Roles), decorators (@CurrentUser, @Roles), filters, interceptors

## Frontend Structure
- Pages: Login, Dashboard, MyWeeklyReport, MyHistory, PartStatus, ReportConsolidation, TeamMgmt, ProjectMgmt
- Components: grid (EditableGrid, GridCell, FormattedText, ExpandedEditor, ProjectDropdown/SelectModal), layout (AppLayout, Header, Sidebar), ui (Badge, Button, Card, Modal, Toast, etc.)
- Stores: authStore, gridStore (focusedCell, editingValue, dirtyMap), uiStore
- Hooks: useWeeklyReport, useWorkItems, useTeamMembers, useProjects
- API: client.ts (Axios+JWT interceptor), auth/team/project/weekly-report/part/export API modules
