# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# UC TeamSpace — 프로젝트 지침

> 모든 판단 기준, 컨벤션은 이 파일이 최우선이다.
> 작업 프로세스(WORK 파이프라인)는 `docs/RULES/agents/` 참조.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | UC TeamSpace |
| 대상 조직 | 다중 팀 지원 (초기 선행연구개발팀 DX·AX 파트 기준, 이후 확장) |
| 핵심 기능 | ① 팀·파트·팀원 관리  ② 프로젝트 관리  ③ 주간업무 작성(그리드 UI)  ④ 파트 취합보고  ⑤ 팀장 조회·Excel 내보내기  ⑥ 관리자(Admin) 시스템  ⑦ 팀 생성·가입 신청/승인  ⑧ 다중 팀 소속 |
| 업무 작성 구조 | 프로젝트별 업무항목 → 세부업무(`*`) → 상세작업(`ㄴ`) 3단계 |
| 주요 사용자 | 팀원(개인 작성), 파트장(파트 취합), 팀장(전체 조회), Admin(시스템 관리자) |

---

## 2. 참조 문서

```
docs/
├── 주간업무보고_시스템_설계_요구사항.md      ← 시스템 개요 + 기능 요구사항
├── 주간업무보고_개발_아키텍처_설계서.md      ← 기술 스택 + 모듈 구조 + DB 스키마
├── STYLE_GUIDE_WEB.md                       ← React 스타일 가이드
└── RULES/                                   ← 프로젝트 상세 규칙 (필요 시 읽기)
    ├── DB_RULES.md                          ← DB 엔티티/Enum/인덱스 (백엔드 작업 시)
    ├── API_REFERENCE.md                     ← API 엔드포인트 목록 (API 작업 시)
    ├── BUSINESS_LOGIC.md                    ← 핵심 비즈니스 로직 (로직 작업 시)
    └── DIRECTORY_STRUCTURE.md               ← 디렉터리 구조 (구조 파악 시)

tasks/
├── simple-tasks/                            ← S-TASK 결과물
├── multi-tasks/WORK-*/                      ← WORK 단위 계획·결과
└── TASK-00.md ~ TASK-10.md                  ← 초기 TASK (완료)
```

---

## 3. 기술 스택

### Back-end
```
Node.js 22 LTS / Bun 1.2+
NestJS 11 + TypeScript 5.x
Prisma 6.x (ORM + 마이그레이션)
Passport.js + JWT (Access 15분 / Refresh 7일, Redis)
class-validator + class-transformer
ExcelJS
PostgreSQL 16 / Redis 7
Bun Test + Supertest
```

### Front-end
```
React 18 + TypeScript 5.x / Vite 6
Tailwind CSS 3
TanStack Table v8 / TanStack Query v5
Zustand v5
React Router v7 / Axios
@dnd-kit / lucide-react / sonner / @radix-ui
Vitest + happy-dom
```

### 모노레포
```
Turborepo 2.x
packages/backend    — NestJS API
packages/frontend   — React SPA
packages/shared     — 공유 타입 + 유틸
```

---

## 4. 빌드 및 실행 명령어

### 인프라
```bash
docker compose up -d                # PostgreSQL 16 + Redis 7
docker compose down
```

### 모노레포 루트
```bash
bun install                         # 의존성 설치
bun run dev                         # 백엔드 + 프론트엔드 동시 실행
bun run build                       # 전체 빌드
bun run lint                        # 전체 린트
bun run test                        # 전체 테스트
```

### Back-end (`packages/backend`)
```bash
bun run start:dev                   # NestJS 개발 서버 (localhost:3000)
bun run build && bun run test && bun run test:e2e
bunx prisma migrate dev             # DB 마이그레이션
bunx prisma db seed                 # 시드 데이터
bunx prisma generate                # Prisma Client 재생성
```

### Front-end (`packages/frontend`)
```bash
bun run dev                         # Vite (localhost:5173)
bun run build && bun run lint && bun run test
```

---

## 5. 코딩 컨벤션

### Back-end (NestJS)
- 응답: 통일된 인터셉터 `{ success, data, message }`
- 예외: `BusinessException(errorCode, message)` + 전역 ExceptionFilter
- 모듈: `module.ts`, `controller.ts`, `service.ts`, `dto/`
- DTO: `class-validator` 검증, `PaginationDto extends` 상속
- Prisma: `Prisma.XxxWhereInput` (`any` 금지), 반복 include 상수 추출
- 환경변수: ConfigService 주입 (하드코딩 금지)
- 로깅: NestJS Logger, 트랜잭션: `$transaction()`

### Front-end (React)
- 색상: CSS 변수 `var(--primary)` — **HEX 하드코딩 절대 금지**
- 타입: `I` 접두사 금지, PascalCase
- 상태: 서버=TanStack Query, UI=Zustand (혼용 금지)
- 자동저장: `useMutation` + `onMutate`(낙관적) + debounce 500ms
- 그리드: `gridStore`에서 `focusedCell`, `editingValue`, `dirtyMap`
- 컴포넌트: 파일 1개 = 1개, default export
- staleTime: 필수 (주간업무: 30s, 팀/프로젝트: 60s)
- 상수: `src/constants/labels.ts`에서 import
- 팀 ID: `teamStore.currentTeamId` (authStore 금지)

### 공통
- 주차 계산: `packages/shared/constants/week-utils.ts` (인라인 함수 금지)
- weekLabel: `"2026-W09"` (ISO 8601), weekStart: `DateTime` (월요일 00:00:00 UTC)

---

## 6. 색상 시스템

| 역할 | HEX | CSS 변수 |
|---|---|---|
| Primary | `#6B5CE7` | `--primary` |
| Primary Dark | `#5647CC` | `--primary-dark` |
| Primary BG | `#EDE9FF` | `--primary-bg` |
| Accent | `#F5A623` | `--accent` |
| OK | `#27AE60` | `--ok` |
| OK BG | `#E8F8F0` | `--ok-bg` |
| Warn | `#E67E22` | `--warn` |
| Warn BG | `#FFF3E0` | `--warn-bg` |
| Danger | `#E74C3C` | `--danger` |
| Danger BG | `#FDECEA` | `--danger-bg` |
| Text | `#1C2333` | `--text` |
| Text Sub | `#6C7A89` | `--text-sub` |
| Border | `#E0E4EA` | `--gray-border` |
| Page BG | `#F0F2F5` | `--gray-light` |
| Table Header | `#F4F6FA` | `--tbl-header` |
| Row Alt | `#F8F9FB` | `--row-alt` |
| Sidebar BG | `#181D2E` | — |
| Sidebar Active | `#252D48` | — |
| Sidebar Divider | `#2a3045` | `--sidebar-divider` |
| Sidebar Menu Title | `#4a5470` | `--sidebar-menu-title` |
| Sidebar Sub Active | `#a89ef5` | `--sidebar-sub-active` |
