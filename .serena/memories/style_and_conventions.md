# Code Style & Conventions

## Backend (NestJS)
- Response format: `{ success, data, message }` via ResponseInterceptor
- Exceptions: custom BusinessException(errorCode, message) + global HttpExceptionFilter
- Module structure: module.ts, controller.ts, service.ts, dto/
- DTO: class-validator decorators for validation
- Soft delete: Member.isActive=false, Project.status=COMPLETED (never hard delete)
- Transactions: Prisma $transaction()

## Frontend (React)
- Colors: CSS variables only (var(--primary), etc.) - NO hex hardcoding
- Types: PascalCase, no "I" prefix
- State: Server state = TanStack Query, UI state = Zustand (no mixing)
- Autosave: useMutation + onMutate (optimistic) + debounce 500ms
- Grid editing: gridStore manages focusedCell, editingValue, dirtyMap
- Components: 1 file = 1 component, default export

## Common
- Week calculation: shared/constants/week-utils.ts
- weekLabel format: "2026-W09" (ISO 8601)
- weekStart format: DateTime (Monday 00:00:00 UTC)

## Task Completion
- Run Step 3 verification from TASK MD
- Generate tasks/TASK-XX-수행결과.md
- Git commit per TASK: "TASK-XX: {summary}"
