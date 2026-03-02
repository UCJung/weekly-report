# 주간업무보고 시스템

선행연구개발팀의 주간업무보고를 디지털화한 웹 애플리케이션.

## 기능 요약

| 역할 | 주요 기능 |
|------|-----------|
| 팀원 | 주간업무 작성(인라인 그리드), 전주 할일 불러오기, 제출 |
| 파트장 | 파트원 업무 현황 조회, 파트 취합보고 작성·제출, Excel 내보내기 |
| 팀장 | 전체 팀원 업무 조회, 파트별 필터, Excel 내보내기, 팀·파트·프로젝트 관리 |

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | NestJS 11, TypeScript 5, Prisma 6, PostgreSQL 16, Redis 7 |
| Frontend | React 18, Vite 6, Tailwind CSS 4, TanStack Query v5, Zustand v5 |
| 인증 | JWT (Access 15분 / Refresh 7일) + Redis 저장 |
| 테스트 | Vitest (Frontend), Bun Test (Backend), Playwright (E2E) |
| 빌드 | Turborepo 2, Docker, GitHub Actions |

## 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repo-url>
cd weekly-report

# 환경변수 설정
cp .env.example .env
# .env 파일에서 JWT_SECRET, JWT_REFRESH_SECRET 변경 필수

# 의존성 설치
bun install
```

### 2. 인프라 기동 (PostgreSQL + Redis)

```bash
docker compose up -d
```

### 3. DB 초기화

```bash
cd packages/backend
bunx prisma migrate deploy
bunx prisma db seed
```

### 4. 개발 서버 실행

```bash
# 루트에서 (백엔드 + 프론트엔드 동시)
bun run dev

# 또는 개별 실행
cd packages/backend && bun run start:dev  # localhost:3000
cd packages/frontend && bun run dev        # localhost:5173
```

## 테스트 실행

```bash
# Frontend 단위 테스트
cd packages/frontend && bun run test

# Backend 단위 테스트
cd packages/backend && bun run test

# Backend E2E 테스트 (서버 실행 필요)
cd packages/backend && bun run test:e2e

# Frontend E2E 테스트 (Playwright, 서버 실행 필요)
cd packages/frontend && bun run test:e2e
```

## 빌드

```bash
# 전체 빌드
bun run build

# Frontend 단독
cd packages/frontend && bun run build

# Backend 단독
cd packages/backend && bun run build
```

## 운영 배포 (Docker)

```bash
# 운영 환경 환경변수 설정
export POSTGRES_PASSWORD=your-production-password
export JWT_SECRET=your-production-jwt-secret
export JWT_REFRESH_SECRET=your-production-refresh-secret

# Docker 이미지 빌드 및 기동
docker compose -f docker-compose.prod.yml up -d

# DB 마이그레이션
docker compose -f docker-compose.prod.yml exec backend bunx prisma migrate deploy
```

## 디렉터리 구조

```
weekly-report/
├── packages/
│   ├── backend/        # NestJS API 서버 (port 3000)
│   ├── frontend/       # React SPA (port 5173)
│   └── shared/         # 공유 타입·유틸
├── docker/             # Dockerfile 및 nginx.conf
├── tasks/              # TASK별 계획서 및 수행결과
└── docs/               # 설계 문서
```

## 테스트 계정

DB 시드(`bunx prisma db seed`) 실행 후 아래 계정으로 로그인할 수 있습니다.

**공통 비밀번호**: `password123`

| 이름 | 이메일 | 역할 | 파트 |
|------|--------|------|------|
| 정우철 | wc.jung@example.com | 팀장 (LEADER) | DX |
| 문선홍 | sh.moon@example.com | 파트장 (PART_LEADER) | AX |
| 이성전 | sj.lee@example.com | 팀원 (MEMBER) | DX |
| 김영상 | ys.kim@example.com | 팀원 (MEMBER) | DX |
| 권현하 | hh.kwon@example.com | 팀원 (MEMBER) | DX |
| 김지환 | jh.kim@example.com | 팀원 (MEMBER) | AX |
| 송하은 | he.song@example.com | 팀원 (MEMBER) | AX |
| 최혜주 | hj.choi@example.com | 팀원 (MEMBER) | AX |
| 정원희 | wh.jung@example.com | 팀원 (MEMBER) | AX |

### 역할별 접근 권한

| 기능 | 팀장 | 파트장 | 팀원 |
|------|:---:|:---:|:---:|
| 본인 주간업무 작성 | O | O | O |
| 업무현황 조회 | 전체 | 소속 파트 | - |
| 파트 취합보고 | - | O | - |
| 팀/프로젝트 관리 | O | - | - |
| Excel 내보내기 | O | 소속 파트 | - |
