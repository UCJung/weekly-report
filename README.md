# UC TeamSpace

팀 협업 플랫폼 — 주간업무보고를 시작으로 다양한 업무 기능을 지원하는 웹 애플리케이션.

## 기능 요약

| 역할 | 주요 기능 |
|------|-----------|
| 팀원 | 주간업무 작성(인라인 그리드), 전주 업무 불러오기, 제출, 팀 선택/가입 신청, 비밀번호 변경 |
| 파트장 | 파트원 업무 현황 조회, 보고서 취합(파트 범위) 작성·편집·제출, Excel 내보내기 |
| 팀장 | 전체 팀원 업무 조회, 보고서 취합(전체/파트 범위), 행 병합·편집·삭제, Excel 내보내기, 팀·파트·프로젝트 관리 |
| Admin | 계정 신청 승인/초기화, 팀 생성 신청 승인, 전역 프로젝트 관리 |

## 주요 화면

| 화면 | 경로 | 설명 |
|------|------|------|
| 로그인 | `/login` | 로그인 (첫 로그인 시 비밀번호 변경) |
| 계정 신청 | `/register` | 계정 신청 |
| 팀 선택 | `/teams` | 팀 검색·선택·가입 신청·생성 신청 |
| 대시보드 | `/` | 팀원 작성 현황 + 보고서 취합 현황 (주차 네비게이션) |
| 내 주간보고 | `/my-weekly` | 프로젝트별 인라인 그리드 편집, 자동저장, 전주 불러오기 |
| 업무 현황 | `/part-status` | 파트/팀 단위 팀원 업무 제출 현황 |
| 보고서 취합 | `/report-consolidation` | 팀원 업무 불러오기 → 행 선택 병합 → 편집 → 제출, Excel 다운로드 |
| 팀 관리 | `/team-mgmt` | 팀원 추가·수정·정렬(드래그), 복수 역할 지정 |
| 프로젝트 관리 | `/project-mgmt` | 프로젝트 추가·수정·정렬, 상태 관리 |
| 계정 관리 (Admin) | `/admin/accounts` | 계정 신청 승인, 상태 관리, PW 초기화 |
| 팀 관리 (Admin) | `/admin/teams` | 팀 생성 신청 승인, 상태 관리 |
| 프로젝트 관리 (Admin) | `/admin/projects` | 전역 프로젝트 생성·수정·상태 관리 |

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | NestJS 11, TypeScript 5, Prisma 6, PostgreSQL 16, Redis 7 |
| Frontend | React 18, Vite 6, Tailwind CSS 3, TanStack Query v5, Zustand v5 |
| 인증 | JWT (Access 15분 / Refresh 7일) + Redis 저장 |
| 테스트 | Vitest (Frontend), Bun Test + Supertest (Backend) |
| 빌드 | Turborepo 2, Docker |

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

## 프로덕션 배포 (Docker Desktop)

Docker Desktop이 실행 중이어야 합니다.

### 1. 환경변수 파일 생성

```bash
cp .env.production.example .env.production
```

### 2. 환경변수 편집

`.env.production` 파일을 열어 아래 값을 설정합니다:

```env
# PostgreSQL
POSTGRES_DB=uc_teamspace
POSTGRES_USER=prod
POSTGRES_PASSWORD=여기에_강한_비밀번호_입력

# JWT (추측이 어려운 긴 랜덤 문자열)
JWT_SECRET=여기에_랜덤_문자열_입력
JWT_REFRESH_SECRET=여기에_다른_랜덤_문자열_입력

# CORS (Nginx 프록시 사용 시 비워두면 됨, 외부 도메인 사용 시 설정)
# CORS_ORIGIN=https://your-domain.com
```

### 3. 빌드 및 실행

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

> 최초 빌드는 이미지 다운로드 + 빌드로 5~10분 소요될 수 있습니다.
> DB 마이그레이션은 백엔드 컨테이너 시작 시 자동 실행됩니다.

### 4. 상태 확인

```bash
docker compose -f docker-compose.prod.yml ps
```

4개 서비스(postgres, redis, backend, frontend)가 모두 `running` / `healthy` 상태인지 확인합니다.

### 5. 접속

브라우저에서 **http://localhost** 접속 → 로그인 화면이 표시됩니다.

### 운영 명령어

| 작업 | 명령어 |
|------|--------|
| 로그 확인 | `docker compose -f docker-compose.prod.yml logs -f backend` |
| 전체 중지 | `docker compose -f docker-compose.prod.yml down` |
| 중지 + DB 초기화 | `docker compose -f docker-compose.prod.yml down -v` |
| 코드 변경 후 재배포 | `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build` |
| 특정 서비스 재시작 | `docker compose -f docker-compose.prod.yml restart backend` |

> Docker Desktop 앱의 **Containers** 탭에서도 컨테이너 상태 확인 및 로그 조회가 가능합니다.

### 아키텍처

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Browser   │────▶│  Nginx (:80) │────▶│  NestJS    │
│   (React)   │     │  (Frontend   │     │  (:3000)   │
│             │     │   + Proxy)   │     │            │
└─────────────┘     └──────────────┘     └─────┬──────┘
                                               │
                                    ┌──────────┼──────────┐
                                    │          │          │
                              ┌─────▼─────┐  ┌─▼────────┐
                              │ PostgreSQL │  │  Redis   │
                              │  (:5432)   │  │ (:6379)  │
                              └───────────┘  └──────────┘
```

## 디렉터리 구조

```
weekly-report/
├── packages/
│   ├── backend/        # NestJS API 서버 (port 3000)
│   ├── frontend/       # React SPA (port 5173)
│   └── shared/         # 공유 타입·유틸
├── docker/             # Dockerfile 및 nginx.conf
├── tasks/              # WORK/TASK별 계획서 및 수행결과
└── docs/               # 설계 문서
```

## 테스트 계정

DB 시드(`bunx prisma db seed`) 실행 후 아래 계정으로 로그인할 수 있습니다.

**공통 비밀번호**: 환경변수 `DEFAULT_PASSWORD` 값 (미설정 시 `password123`)

| 이름 | 이메일 | 역할 | 파트 |
|------|--------|------|------|
| 시스템관리자 | admin@system.local | 관리자 (ADMIN) | — |
| 홍길동 | leader@example.com | 팀장 (LEADER) | DX |
| 최수진 | ax.partleader@example.com | 파트장 (PART_LEADER) | AX |
| 김철수 | dx.member1@example.com | 팀원 (MEMBER) | DX |
| 이영희 | dx.member2@example.com | 팀원 (MEMBER) | DX |
| 박민수 | dx.member3@example.com | 팀원 (MEMBER) | DX |
| 정하늘 | ax.member1@example.com | 팀원 (MEMBER) | AX |
| 강서연 | ax.member2@example.com | 팀원 (MEMBER) | AX |
| 윤도현 | ax.member3@example.com | 팀원 (MEMBER) | AX |
| 한지우 | ax.member4@example.com | 팀원 (MEMBER) | AX |

### 역할별 접근 권한

| 기능 | Admin | 팀장 | 파트장 | 팀원 |
|------|:---:|:---:|:---:|:---:|
| 본인 주간업무 작성 | - | O | O | O |
| 업무현황 조회 | - | 전체 | 소속 파트 | - |
| 보고서 취합 | - | 전체/파트 | 소속 파트 | - |
| 팀/프로젝트 관리 | - | O | - | - |
| Excel 내보내기 | - | O | 소속 파트 | - |
| 계정 신청 승인/초기화 | O | - | - | - |
| 팀 생성 신청 승인 | O | - | - | - |
| 전역 프로젝트 관리 | O | - | - | - |

## 업무 작성 서식

진행업무, 예정업무 셀은 아래 패턴으로 구조화 렌더링됩니다.

| 입력 패턴 | 의미 | 렌더링 |
|----------|------|--------|
| `[텍스트]` | 업무항목 (1단계) | 볼드, Primary 색상 |
| `*텍스트` | 세부업무 (2단계) | 불릿(•) 변환, 업무항목과 동일 여백 |
| `-텍스트` | 상세작업 (3단계) | 1단 들여쓰기, 보조 텍스트 색상 |

## 개발 이력

| WORK | 내용 |
|------|------|
| TASK-00~10 | 프로젝트 초기화, DB 설계, 백엔드 API, 프론트엔드 UI 전체 구현 |
| WORK-01~06 | UI 스타일 가이드 적용 (CSS 변수, 레이아웃, 공통 컴포넌트) |
| WORK-07 | Tailwind v3 + shadcn/ui 마이그레이션 및 전체 UI 재개발 |
| WORK-08 | 주간보고 작성 방식 변경 (프로젝트 그룹 기반 UI) |
| WORK-09 | 주간업무 그리드 통합 테이블 UI 전환 |
| WORK-10 | 업무현황 페이지 개편 |
| WORK-11 | Excel 주간업무 데이터 초기 시드 구성 |
| WORK-12 | 팀원/프로젝트 정렬(DnD), 복수 역할 지원, 주차 통일 |
| WORK-13 | 보고서 취합 기능 재설계 (전체/파트 범위 선택, 개별 행 로딩·병합·편집·삭제) |
| WORK-14 | UI 기능 테스트 수정사항 (GridCell 높이, 서식 기호 통일, ExpandedEditor 오버레이, 전주 불러오기 개선, 대시보드 주차 네비게이션, 취합보고서 프로젝트 셀 병합, 취합 기반 Excel 다운로드) |
| WORK-15 | 계정 신청/승인, 비밀번호 변경/초기화, 팀 생성/가입 신청, 멀티팀 소속, 관리자 대시보드 |
| WORK-16 | 팀 프로젝트 관리 기능 (프로젝트 추가/해제/정렬, INACTIVE 제약) |
| WORK-17 | 코드 품질 개선 (shared 타입 정합, 하드코딩 제거, DTO 상속, 인덱스, 캐시 전략) |
