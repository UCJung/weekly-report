# Suggested Commands

## Infrastructure
```bash
docker compose up -d          # Start PostgreSQL + Redis
docker compose down            # Stop
```

## Install & Dev
```bash
bun install                    # Install all deps
bun run dev                    # Start backend + frontend (Turborepo)
bun run build                  # Build all
bun run lint                   # Lint all
bun run test                   # Test all
```

## Backend (packages/backend)
```bash
bun run start:dev              # NestJS dev server (localhost:3000)
bun run build                  # Build
bun run test                   # Unit tests
bun run test:e2e               # E2E tests
bunx prisma migrate dev        # Run migrations
bunx prisma db seed            # Seed data
bunx prisma studio             # DB GUI (localhost:5555)
bunx prisma generate           # Regenerate Prisma Client
```

## Frontend (packages/frontend)
```bash
bun run dev                    # Vite dev (localhost:5173)
bun run build                  # Build
bun run lint                   # ESLint
bun run test                   # Vitest
```

## System Utils (Windows with bash shell)
```bash
git status / git log / git diff
ls / find / grep
```
