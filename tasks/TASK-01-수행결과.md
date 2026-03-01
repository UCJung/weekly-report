# TASK-01 수행 결과 보고서

> 작업일: 2026-03-01
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

Prisma 스키마 6개 핵심 엔티티 + 2개 취합 엔티티 정의, 초기 마이그레이션 실행, 마스터 데이터 시드(팀 1, 파트 2, 팀원 9, 프로젝트 11) 완성.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| TASK MD 체크리스트 전 항목 완료 | ✅ |
| 요구사항 문서(설계서) 기능 100% 구현 | ✅ |
| Back-end: 빌드 오류 0건 | ✅ |
| Back-end: 린트 오류 0건 | ✅ |
| Back-end: 테스트 통과 | ✅ |
| 전체 빌드 성공 | ✅ |
| 전체 테스트 통과 (10건) | ✅ |

---

## 3. 체크리스트 완료 현황

### 3.1 Prisma 스키마 정의

| 항목 | 상태 |
|------|------|
| Team — id(cuid), name(unique), description, timestamps | ✅ |
| Part — id, name, teamId(FK), @@unique([teamId, name]) | ✅ |
| Member — id, name, email(unique), password, role(enum), partId(FK), isActive, timestamps | ✅ |
| MemberRole enum — LEADER, PART_LEADER, MEMBER | ✅ |
| Project — id, name, code, category(enum), status(enum), teamId(FK), @@unique([teamId, code]) | ✅ |
| ProjectCategory enum — COMMON, EXECUTION | ✅ |
| ProjectStatus enum — ACTIVE, HOLD, COMPLETED | ✅ |
| WeeklyReport — id, memberId(FK), weekStart, weekLabel, status(enum), timestamps, @@unique([memberId, weekStart]) | ✅ |
| ReportStatus enum — DRAFT, SUBMITTED | ✅ |
| WorkItem — id, weeklyReportId(FK, onDelete: Cascade), projectId(FK), doneWork(Text), planWork(Text), remarks(Text?), sortOrder, timestamps | ✅ |
| PartSummary — id, partId(FK), weekStart, weekLabel, status(enum), timestamps, @@unique([partId, weekStart]) | ✅ |
| SummaryWorkItem — id, partSummaryId(FK, onDelete: Cascade), projectId(FK), doneWork(Text), planWork(Text), remarks(Text?), sortOrder | ✅ |
| 모든 관계(relation) 정의 완료 | ✅ |
| prisma generate 성공 | ✅ |

### 3.2 마이그레이션

| 항목 | 상태 |
|------|------|
| prisma migrate dev --name init 실행 | ✅ |
| 마이그레이션 파일 생성 확인 | ✅ |
| DB에 테이블 생성 확인 | ✅ |

### 3.3 시드 데이터

| 항목 | 상태 |
|------|------|
| 팀: 선행연구개발팀 1개 | ✅ |
| 파트: DX, AX 2개 | ✅ |
| 팀원 9명 (DX 4명, AX 5명) | ✅ |
| 팀원별 초기 비밀번호 해싱 (bcryptjs) | ✅ |
| 팀원별 이메일 생성 규칙 적용 | ✅ |
| 프로젝트 11개 (공통 3, 수행 8) | ✅ |
| 시드 멱등성 — upsert 사용 | ✅ |
| prisma db seed 실행 성공 | ✅ |

### 3.4 Shared 타입 동기화

| 항목 | 상태 |
|------|------|
| team.ts — Team, Part, Member, MemberRole 타입 | ✅ |
| project.ts — Project, ProjectCategory, ProjectStatus 타입 | ✅ |
| weekly-report.ts — WeeklyReport, WorkItem, PartSummary, SummaryWorkItem, ReportStatus 타입 | ✅ |
| Prisma 스키마와 Shared 타입 일치 확인 | ✅ |

### 3.5 Prisma 서비스 모듈

| 항목 | 상태 |
|------|------|
| prisma.module.ts — Global 모듈 | ✅ |
| prisma.service.ts — onModuleInit에서 $connect() | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — PostgreSQL 포트 충돌
**증상**: `P1000: Authentication failed against database server, the provided database credentials for '(not available)' are not valid.`
**원인**: 로컬에 PostgreSQL 18이 이미 설치되어 5432 포트를 점유. Docker 컨테이너가 5432로 매핑했지만 로컬 PostgreSQL에 연결되어 인증 실패.
**수정**: Docker PostgreSQL 포트를 `15432:5432`로 변경. `.env` 및 `docker-compose.yml` 모두 업데이트.

### 이슈 #2 — Prisma .env 파일 위치
**증상**: `Environment variable not found: DATABASE_URL`
**원인**: Prisma CLI는 `packages/backend/` 디렉토리에서 실행되지만 `.env`는 프로젝트 루트(`../../.env`)에만 존재.
**수정**: `packages/backend/.env`에 루트 `.env` 복사. (NestJS의 `envFilePath: '../../.env'`는 런타임에만 적용, Prisma CLI는 로컬 `.env` 필요)

### 이슈 #3 — 공통 프로젝트 코드 중복
**증상**: TASK 설계서에 공통 3개 프로젝트 코드가 모두 `공통2500`으로 동일하여 `@@unique([teamId, code])` 위반
**수정**: `공통2500-팀`, `공통2500-DX`, `공통2500-AX`로 구분하여 유니크 제약 충족

---

## 5. 최종 검증 결과

### 빌드 결과
```
$ turbo run build
Tasks:    3 successful, 3 total
Time:    13.586s
```

### 테스트 결과
```
$ turbo run test
@weekly-report/shared:test: 8 pass, 0 fail, 20 expect() calls
@weekly-report/backend:test: 1 pass, 0 fail, 2 expect() calls
@weekly-report/frontend:test: 1 passed (1)
Tasks:    6 successful, 6 total
Time:    8.092s
```

### DB 데이터 확인
```
members: 9명 (DX 4명, AX 5명)
projects: 11개 (COMMON 3, EXECUTION 8)
```

---

## 6. 후속 TASK 유의사항

- **PostgreSQL 포트**: 로컬 PostgreSQL 18이 5432를 점유하고 있으므로, Docker PostgreSQL은 `15432` 포트를 사용. 모든 DB 관련 작업 시 `.env`의 `DATABASE_URL`에 15432 포트가 설정되어 있는지 확인 필요.
- **Prisma CLI 실행**: `packages/backend/.env` 파일이 존재해야 Prisma CLI가 `DATABASE_URL`을 인식함. 루트 `.env`만으로는 부족.
- **Prisma 컬럼명**: `@@map`으로 테이블명은 snake_case이지만, 컬럼명은 Prisma 기본 camelCase 유지. SQL 쿼리 시 `"partId"` 등 큰따옴표 사용 필요.

---

## 7. 산출물 목록

### 신규 생성 파일

| 파일 경로 | 설명 |
|-----------|------|
| `packages/backend/prisma/schema.prisma` | 8개 엔티티 + 4개 enum 정의 (기존 기본 스키마에서 전면 재작성) |
| `packages/backend/prisma/seed.ts` | 마스터 데이터 시드 (팀, 파트, 팀원, 프로젝트) |
| `packages/backend/prisma/migrations/20260301132320_init/migration.sql` | 초기 DB 마이그레이션 |
| `packages/backend/src/prisma/prisma.module.ts` | Global Prisma 모듈 |
| `packages/backend/src/prisma/prisma.service.ts` | Prisma 서비스 (connect/disconnect) |
| `packages/backend/.env` | Backend 전용 환경변수 (Prisma CLI용) |

### 수정 파일

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `packages/backend/src/app.module.ts` | PrismaModule import 추가 |
| `packages/backend/package.json` | bcryptjs, @types/bcryptjs 의존성 추가, prisma seed 설정 |
| `docker-compose.yml` | PostgreSQL 포트 5432 → 15432로 변경 |
| `.env` | DATABASE_URL 포트 15432로 변경 |
