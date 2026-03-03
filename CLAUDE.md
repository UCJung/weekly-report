# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# UC TeamSpace — 개발 마스터 가이드

> Claude Code가 이 프로젝트에서 작업할 때 **반드시 이 파일을 먼저 읽고 시작**한다.
> 모든 판단 기준, 컨벤션, 작업 프로세스는 이 파일이 최우선이다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | UC TeamSpace |
| 대상 조직 | 다중 팀 지원 (초기 선행연구개발팀 DX·AX 파트 기준으로 개발, 이후 확장) |
| 핵심 기능 | ① 팀·파트·팀원 관리  ② 프로젝트 관리  ③ 주간업무 작성(그리드 UI)  ④ 파트 취합보고  ⑤ 팀장 조회·Excel 내보내기  ⑥ 관리자(Admin) 시스템  ⑦ 팀 생성·가입 신청/승인  ⑧ 다중 팀 소속 |
| 업무 작성 구조 | 프로젝트별 업무항목 → 세부업무(`*`) → 상세작업(`ㄴ`) 3단계 |
| 주요 사용자 | 팀원(개인 작성), 파트장(파트 취합), 팀장(전체 조회), Admin(시스템 관리자) |

---

## 2. 참조 문서 위치

```
docs/
├── 주간업무보고_시스템_설계_요구사항.md      ← 시스템 개요 + 기능 요구사항 + 데이터 모델 + 화면 구성
├── 주간업무보고_개발_아키텍처_설계서.md      ← 기술 스택 + 모듈 구조 + DB 스키마 + API 설계
├── STYLE_GUIDE_WEB.md                       ← React 스타일 가이드 (색상·컴포넌트)
├── 선행연구개발팀_주간업무.xlsx              ← 현행 엑셀 원본 (업무 구조 참고용)
└── weekly-report-ui-mockup.jsx              ← UI 시안 (React 컴포넌트)

tasks/
├── simple-tasks/                            ← 단독(S-TASK) 작업 결과물 (S-TASK-NNNNN-result.md)
├── multi-tasks/WORK-*/                      ← WORK 단위 계획·결과 (PLAN.md, TASK-XX.md, TASK-XX-result.md)
└── TASK-00.md ~ TASK-10.md                  ← 초기 TASK별 상세 체크리스트 (완료)
```

---

## 3. 작업 프로세스

### 3.1 WORK 파이프라인 (다수 TASK로 구성된 작업)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  planner     │───▶│  scheduler   │───▶│  builder     │───▶│  verifier    │───▶│  committer   │
│  계획 수립    │    │  TASK 분해    │    │  코드 구현    │    │  검증 실행    │    │  커밋/보고    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │ 실패 시
                                                                    ▼
                                                              수정 후 재검증
```

- planner: Sequential Thinking으로 요구사항 분석 → `tasks/multi-tasks/WORK-XX/PLAN.md` 작성
- scheduler: PLAN.md 기반으로 TASK 분해 → `tasks/multi-tasks/WORK-XX/WORK-XX-TASK-YY.md` 생성
- builder: 각 TASK MD를 읽고 즉시 코드 구현 (별도 승인 불필요)
- verifier: 빌드·린트·테스트 자동 실행, 실패 시 수정 후 재실행
- committer: 모든 검증 통과 후 결과 보고서 생성 → Git 커밋

### 3.2 단독 진행 (S-TASK: 단일 작업 단위)

```
요청 분석
  → WORK 파이프라인 필요 여부 판단
  → 단독 가능 시: 작업 수행 → 검증 → tasks/singles/S-TASK-NNNNN-result.md 생성 → 커밋
```

### 3.3 공통 프로세스 규칙

- Claude는 계획서를 확인하고 **즉시 작업을 수행**한다 (별도 승인 불필요)
- 작업 중 불명확한 사항은 즉시 질문하고 확인 후 진행한다
- 각 산출물 완료 시 해당 TASK 체크리스트에 즉시 체크한다
- **작업 완료 후 빌드·린트·테스트를 자동으로 실행한다**
- 검증 실패 시 원인을 분석·수정하고 해당 검증 항목을 재실행한다
- 자동화 불가 UI 검증(브라우저 렌더링, 그리드 셀 편집 동작, 색상 육안 확인 등)은 결과 보고서 섹션 5에 **"수동 확인 필요"** 항목으로 명시한다
- **검증 완료 + 결과 보고서 생성 후, 해당 TASK 단위로 Git 커밋한다** (push는 사용자 명시적 요청 시에만)
  - WORK 커밋 메시지 형식: `WORK-XX-TASK-YY: {요약}`
  - 단독 커밋 메시지 형식: `S-TASK-NNNNN: {요약}`
  - 예시: `WORK-16-TASK-02: Admin 프로젝트 API 구현`
  - 커밋 범위: 해당 TASK에서 생성·수정한 파일 + 결과 보고서

---

## 4. 전체 개발 Phase

### 초기 TASK (완료 COMPLETED)

| Phase | TASK | 내용 | 상태 |
|---|---|---|---|
| 0 | TASK-00 | 환경 설정 및 프로젝트 초기화 (모노레포 + Docker) | COMPLETED |
| 1 | TASK-01 | DB 설계 및 초기화 (Prisma 스키마 + 마스터 데이터 시드) | COMPLETED |
| 2 | TASK-02 | Back-end: 인증 + 팀·파트·팀원 관리 API | COMPLETED |
| 3 | TASK-03 | Back-end: 프로젝트 관리 API | COMPLETED |
| 4 | TASK-04 | Back-end: 주간업무 CRUD + 자동저장 + 전주 불러오기 API | COMPLETED |
| 5 | TASK-05 | Back-end: 파트 취합·팀 조회·Excel 내보내기 API | COMPLETED |
| 6 | TASK-06 | Front-end: 초기화 + 공통 컴포넌트 + 레이아웃 | COMPLETED |
| 7 | TASK-07 | Front-end: 팀·파트·프로젝트 관리 화면 | COMPLETED |
| 8 | TASK-08 | Front-end: 주간업무 작성 그리드 화면 (핵심) | COMPLETED |
| 9 | TASK-09 | Front-end: 파트 현황·취합보고·팀장 조회 화면 | COMPLETED |
| 10 | TASK-10 | 통합 테스트 및 배포 | COMPLETED |

### WORK 이력 (완료)

| WORK | 내용 | 상태 |
|---|---|---|
| WORK-11 | 초기 인증·팀 관리 개선 | COMPLETED |
| WORK-12 | 주간업무 그리드 UI 개선 | COMPLETED |
| WORK-13 | 파트 취합보고 기능 보강 | COMPLETED |
| WORK-14 | Excel 내보내기 개선 | COMPLETED |
| WORK-15 | 다중 팀 소속 DB 스키마 + API 기반 작업 | COMPLETED |
| WORK-16 | Admin 시스템 + 팀 프로젝트 관리 + 프론트엔드 통합 | COMPLETED |

---

## 5. 기술 스택

### Back-end
```
Node.js 22 LTS / Bun 1.2+ (패키지 매니저 + 테스트 러너)
NestJS 11 + TypeScript 5.x
Prisma 6.x (ORM + 마이그레이션)
Passport.js + JWT (Access 15분 / Refresh 7일, Redis 저장)
class-validator + class-transformer (DTO 검증)
ExcelJS (Excel 내보내기)
PostgreSQL 16
Redis 7
Bun Test + Supertest (테스트)
```

### Front-end
```
React 18 + TypeScript 5.x / Vite 6
Tailwind CSS 3
TanStack Table v8 (스프레드시트 그리드)
TanStack Query v5 (서버 상태 + 낙관적 업데이트)
Zustand v5 (클라이언트 상태)
React Router v7
Axios (JWT 인터셉터)
@dnd-kit (Drag & Drop 정렬)
lucide-react (아이콘)
sonner (Toast 알림)
@radix-ui (UI 프리미티브)
Vitest + happy-dom (단위 테스트)
```

### 모노레포
```
Turborepo 2.x (빌드 오케스트레이션)
packages/backend    — NestJS API
packages/frontend   — React SPA
packages/shared     — 공유 타입 + 유틸 (주차 계산 등)
```

---

## 6. 빌드 및 실행 명령어

### 인프라 (Docker)
```bash
docker compose up -d                # PostgreSQL 16 + Redis 7 기동
docker compose down                 # 중지
docker compose logs -f postgres     # DB 로그 확인
```

### 모노레포 루트
```bash
bun install                         # 전체 의존성 설치
bun run dev                         # 백엔드 + 프론트엔드 동시 실행 (Turborepo)
bun run build                       # 전체 빌드
bun run lint                        # 전체 린트
bun run test                        # 전체 테스트
```

### Back-end
```bash
cd packages/backend
bun run start:dev                   # NestJS 개발 서버 (localhost:3000)
bun run build                       # 프로덕션 빌드
bun run test                        # 단위 테스트
bun run test:e2e                    # E2E 테스트 (Supertest)
bunx prisma migrate dev             # DB 마이그레이션 실행
bunx prisma migrate deploy          # 운영 마이그레이션 적용
bunx prisma db seed                 # 마스터 데이터 시드
bunx prisma studio                  # DB GUI (localhost:5555)
bunx prisma generate                # Prisma Client 재생성
```

### Front-end
```bash
cd packages/frontend
bun run dev                         # Vite 개발 서버 (localhost:5173)
bun run build                       # 프로덕션 빌드
bun run lint                        # ESLint
bun run test                        # Vitest 단위 테스트
```

### DB 상태 확인
```sql
-- 팀·파트·팀원 확인 (다중 팀 소속 포함)
SELECT m.name, m.roles, tm.team_id, p.name AS part
FROM members m
LEFT JOIN team_memberships tm ON tm.member_id = m.id
LEFT JOIN parts p ON tm.part_id = p.id;

-- 프로젝트 목록 확인
SELECT name, code, category, status FROM projects ORDER BY category, name;

-- 주간업무 작성 현황
SELECT m.name, wr.week_label, wr.status, COUNT(wi.id) AS items
FROM weekly_reports wr
JOIN members m ON wr.member_id = m.id
LEFT JOIN work_items wi ON wi.weekly_report_id = wr.id
GROUP BY m.name, wr.week_label, wr.status;
```

---

## 7. 디렉터리 구조

```
weekly-report/
├── CLAUDE.md                                 ← 이 파일
├── docs/                                     ← 설계 문서
│   ├── 주간업무보고_시스템_설계_요구사항.md
│   ├── 주간업무보고_개발_아키텍처_설계서.md
│   └── STYLE_GUIDE_WEB.md
├── tasks/                                    ← TASK MD + 수행결과
│   ├── singles/                              ←   단독 작업 결과 (S-TASK-NNNNN-result.md)
│   ├── multi-tasks/WORK-11/ ~ WORK-16/       ←   WORK별 계획·결과
│   └── TASK-00.md ~ TASK-10.md              ←   초기 TASK (완료)
├── docker-compose.yml
├── docker-compose.dev.yml
├── turbo.json
├── package.json                              ← 워크스페이스 루트
│
├── packages/
│   ├── shared/                               ← 공유 타입·유틸
│   │   ├── types/
│   │   │   ├── weekly-report.ts
│   │   │   ├── team.ts
│   │   │   └── project.ts
│   │   ├── constants/
│   │   │   └── week-utils.ts                 ← 주차 계산 함수
│   │   └── package.json
│   │
│   ├── backend/                              ← NestJS API 서버
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/                       ← 공통 (가드, 필터, 파이프, 데코레이터)
│   │   │   │   ├── decorators/               ←   @Roles, @CurrentUser
│   │   │   │   ├── guards/                   ←   JwtAuthGuard, RolesGuard
│   │   │   │   ├── interceptors/             ←   응답 변환, 로깅
│   │   │   │   ├── filters/                  ←   전역 예외 필터
│   │   │   │   └── dto/                      ←   PaginationDto 등
│   │   │   ├── auth/                         ← 인증 모듈
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/               ←   JWT, Local 전략
│   │   │   │   └── dto/
│   │   │   ├── admin/                        ← 관리자 모듈 (NEW)
│   │   │   │   ├── admin.module.ts
│   │   │   │   ├── admin.controller.ts
│   │   │   │   ├── admin.service.ts
│   │   │   │   └── dto/
│   │   │   ├── team/                         ← 팀 관리 모듈
│   │   │   │   ├── team.module.ts
│   │   │   │   ├── team.controller.ts
│   │   │   │   ├── team.service.ts
│   │   │   │   ├── team-join.service.ts      ←   가입 신청 처리
│   │   │   │   ├── team-project.service.ts   ←   팀 프로젝트 관리
│   │   │   │   ├── part.service.ts
│   │   │   │   ├── member.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-team-request.dto.ts
│   │   │   │       ├── join-team.dto.ts
│   │   │   │       ├── review-join-request.dto.ts
│   │   │   │       ├── list-teams-query.dto.ts
│   │   │   │       ├── add-team-projects.dto.ts
│   │   │   │       └── reorder-team-projects.dto.ts
│   │   │   ├── project/                      ← 프로젝트 관리 모듈
│   │   │   │   ├── project.module.ts
│   │   │   │   ├── project.controller.ts
│   │   │   │   ├── project.service.ts
│   │   │   │   └── dto/
│   │   │   ├── weekly-report/                ← 주간업무 관리 모듈 (핵심)
│   │   │   │   ├── weekly-report.module.ts
│   │   │   │   ├── report.controller.ts
│   │   │   │   ├── report.service.ts
│   │   │   │   ├── work-item.service.ts
│   │   │   │   ├── carry-forward.service.ts  ←   전주 할일 → 이번주 한일
│   │   │   │   ├── part-summary.controller.ts
│   │   │   │   ├── part-summary.service.ts
│   │   │   │   └── dto/
│   │   │   ├── export/                       ← Excel 내보내기 모듈
│   │   │   │   ├── export.module.ts
│   │   │   │   ├── export.controller.ts
│   │   │   │   └── excel.service.ts
│   │   │   └── prisma/                       ← Prisma 서비스
│   │   │       ├── prisma.module.ts
│   │   │       └── prisma.service.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts                       ← 마스터 데이터 시드
│   │   ├── test/
│   │   └── package.json
│   │
│   └── frontend/                             ← React SPA
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── api/                          ← API 클라이언트
│       │   │   ├── client.ts                 ←   Axios 인스턴스 + JWT 인터셉터
│       │   │   ├── auth.api.ts
│       │   │   ├── admin.api.ts
│       │   │   ├── weekly-report.api.ts
│       │   │   ├── team.api.ts
│       │   │   ├── project.api.ts
│       │   │   ├── part.api.ts
│       │   │   └── export.api.ts
│       │   ├── hooks/                        ← TanStack Query 커스텀 훅
│       │   │   ├── useWeeklyReport.ts
│       │   │   ├── useWorkItems.ts
│       │   │   ├── useTeamMembers.ts
│       │   │   ├── useProjects.ts
│       │   │   ├── useAdmin.ts
│       │   │   └── useTeams.ts
│       │   ├── stores/                       ← Zustand 스토어
│       │   │   ├── authStore.ts
│       │   │   ├── uiStore.ts
│       │   │   ├── teamStore.ts              ←   currentTeamId 관리
│       │   │   └── gridStore.ts              ←   그리드 편집 상태 (포커스 셀, 변경 큐)
│       │   ├── constants/
│       │   │   └── labels.ts                 ←   ROLE_LABEL, STATUS_LABEL 등 공통 상수
│       │   ├── components/
│       │   │   ├── layout/                   ← Sidebar, Header, AppLayout
│       │   │   │   └── AdminLayout.tsx       ←   Admin 전용 레이아웃
│       │   │   ├── ui/                       ← Badge, Button, Modal, Toast, SummaryCard
│       │   │   └── grid/                     ← 스프레드시트 그리드 컴포넌트 (핵심)
│       │   │       ├── EditableGrid.tsx      ←   TanStack Table 기반 편집 그리드
│       │   │       ├── GridCell.tsx           ←   인라인 편집 셀
│       │   │       ├── ExpandedEditor.tsx     ←   확대 편집 패널
│       │   │       ├── FormattedText.tsx      ←   [항목]/*세부/ㄴ상세 서식 렌더링
│       │   │       └── ProjectDropdown.tsx    ←   프로젝트 선택 드롭다운
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── RegisterPage.tsx
│       │   │   ├── TeamLanding.tsx           ←   팀 선택/가입 신청 화면
│       │   │   ├── Dashboard.tsx
│       │   │   ├── MyWeeklyReport.tsx        ←   그리드 작성 화면 (핵심)
│       │   │   ├── PartStatus.tsx
│       │   │   ├── ReportConsolidation.tsx   ←   파트/팀 취합보고 (구 PartSummary)
│       │   │   ├── ProjectDndTable.tsx       ←   DnD 기반 프로젝트 정렬 테이블
│       │   │   ├── TeamMgmt.tsx
│       │   │   └── ProjectMgmt.tsx
│       │   ├── pages/admin/                  ← Admin 전용 페이지
│       │   │   ├── AccountManagement.tsx
│       │   │   ├── TeamManagement.tsx
│       │   │   └── ProjectManagement.tsx
│       │   ├── styles/
│       │   │   └── globals.css               ←   CSS 변수 전체 선언
│       │   └── types/
│       ├── public/
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
└── docker/
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── nginx.conf
```

---

## 8. DB 핵심 규칙

### Prisma 스키마 엔티티

| 엔티티 | 핵심 규칙 |
|---|---|
| Team | 팀 이름 UNIQUE. teamStatus(TeamStatus). requestedById로 신청자 추적 |
| Part | 팀 내 파트명 UNIQUE (`@@unique([teamId, name])`). 파트장 지정 |
| Member | email UNIQUE. roles: `MemberRole[]` (복수 역할). accountStatus(AccountStatus). mustChangePassword. sortOrder. 소프트 삭제 시 `accountStatus = INACTIVE` |
| TeamMembership | 다중 팀 소속 M:M. `@@unique([memberId, teamId])`. teamId + partId(팀 내 파트) + roles[] |
| TeamJoinRequest | 팀 가입 신청. status: `PENDING` / `APPROVED` / `REJECTED` |
| TeamProject | 팀별 프로젝트 선택 M:M. `@@unique([teamId, projectId])` |
| Project | 프로젝트코드 전역 UNIQUE (`code` 단독 UNIQUE). category: `COMMON` / `EXECUTION`. status: `ACTIVE` / `INACTIVE` |
| WeeklyReport | 팀원당 주차당 1건 (`@@unique([memberId, weekStart])`). status: `DRAFT` / `SUBMITTED` |
| WorkItem | WeeklyReport에 종속. doneWork(한일), planWork(할일), remarks(비고) — `@db.Text` |
| PartSummary | `@@unique([partId, weekStart])`. scope(SummaryScope), title, teamId 포함. 파트장/팀장이 작성 |
| SummaryWorkItem | PartSummary에 종속 |

### 주요 Enum

| Enum | 값 |
|---|---|
| MemberRole | `ADMIN`, `LEADER`, `PART_LEADER`, `MEMBER` |
| AccountStatus | `PENDING`, `APPROVED`, `ACTIVE`, `INACTIVE` |
| TeamStatus | `PENDING`, `APPROVED`, `ACTIVE`, `INACTIVE` |
| JoinRequestStatus | `PENDING`, `APPROVED`, `REJECTED` |
| SummaryScope | `PART`, `TEAM` |
| ProjectCategory | `COMMON`, `EXECUTION` |
| ProjectStatus | `ACTIVE`, `INACTIVE` |
| ReportStatus | `DRAFT`, `SUBMITTED` |

### 소프트 삭제 원칙
- `DELETE` SQL / Prisma `delete` 사용 금지
- Member: `accountStatus = INACTIVE`
- Project: `status = 'INACTIVE'`
- WeeklyReport, WorkItem: `onDelete: Cascade` (Report 삭제 시 하위 WorkItem 자동 삭제)

### 성능 인덱스
- WorkItem: `@@index([weeklyReportId])`, `@@index([projectId])`
- WeeklyReport: `@@index([weekStart])`
- TeamMembership: `@@index([memberId])`, `@@index([teamId])`
- PartSummary: `@@index([weekStart])`
- SummaryWorkItem: `@@index([partSummaryId])`
- TeamJoinRequest: `@@index([memberId])`, `@@index([teamId])`

### 마스터 데이터 시드 (seed.ts)
시드 실행 시 아래 데이터를 자동 생성한다.

| 데이터 | 내용 |
|--------|------|
| 팀 | 선행연구개발팀 1개 |
| 파트 | DX, AX 2개 |
| 팀원 | 9명 (홍길동/LEADER, 최수진/PART_LEADER, 나머지/MEMBER) |
| 프로젝트 | 공통 3개 + 수행 8개 = 총 11개 (현행 엑셀 기준값설정 시트 기준) |

---

## 9. API 공통 규칙

### 응답 형식
```json
// 성공
{ "success": true, "data": { ... }, "message": null }
// 목록 (페이지네이션)
{ "success": true, "data": [ ... ], "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 } }
// 에러
{ "success": false, "data": null, "message": "해당 주간업무를 찾을 수 없습니다.", "errorCode": "WEEKLY_REPORT_NOT_FOUND" }
```

### URL 규칙
```
GET/POST  /api/v1/{resource}
GET/PATCH/DELETE  /api/v1/{resource}/{id}
POST  /api/v1/{resource}/{action}          예) /api/v1/weekly-reports/carry-forward
```

### 주요 API 엔드포인트

| Module | Method | Endpoint | 설명 |
|--------|--------|----------|------|
| **Auth** | POST | `/api/v1/auth/register` | 회원가입 |
| Auth | POST | `/api/v1/auth/login` | 로그인 (JWT 발급) |
| Auth | POST | `/api/v1/auth/refresh` | 토큰 갱신 |
| Auth | GET | `/api/v1/auth/me` | 현재 사용자 정보 |
| Auth | POST | `/api/v1/auth/change-password` | 비밀번호 변경 |
| **Admin** | GET | `/api/v1/admin/accounts` | 계정 목록 |
| Admin | PATCH | `/api/v1/admin/accounts/:id/status` | 계정 상태 변경 |
| Admin | PATCH | `/api/v1/admin/accounts/:id/reset-password` | 비밀번호 초기화 |
| Admin | GET | `/api/v1/admin/teams` | 팀 목록 |
| Admin | PATCH | `/api/v1/admin/teams/:id/status` | 팀 상태 변경 |
| Admin | GET | `/api/v1/admin/projects` | 전역 프로젝트 목록 |
| Admin | POST | `/api/v1/admin/projects` | 전역 프로젝트 생성 |
| Admin | PATCH | `/api/v1/admin/projects/:id` | 전역 프로젝트 수정 |
| **Team** | GET | `/api/v1/teams` | 팀 목록 (검색/필터/페이지네이션) |
| Team | POST | `/api/v1/teams/request` | 팀 생성 신청 |
| Team | GET | `/api/v1/teams/:teamId/parts` | 파트 목록 |
| Team | PATCH | `/api/v1/teams/:teamId/parts/reorder` | 파트 정렬 |
| Team | GET | `/api/v1/teams/:teamId/members` | 팀원 목록 |
| Team | PATCH | `/api/v1/teams/:teamId/members/reorder` | 팀원 정렬 |
| Team | POST | `/api/v1/teams/:teamId/join` | 팀 가입 신청 |
| Team | GET | `/api/v1/teams/:teamId/join-requests` | 가입 신청 목록 |
| Team | PATCH | `/api/v1/teams/:teamId/join-requests/:id` | 가입 신청 승인/거절 |
| Team | GET | `/api/v1/teams/:teamId/projects` | 팀 프로젝트 목록 |
| Team | POST | `/api/v1/teams/:teamId/projects` | 팀 프로젝트 추가 |
| Team | DELETE | `/api/v1/teams/:teamId/projects/:projectId` | 팀 프로젝트 제거 |
| Team | PATCH | `/api/v1/teams/:teamId/projects/reorder` | 팀 프로젝트 정렬 |
| Team | POST | `/api/v1/members` | 팀원 등록 |
| Team | PATCH | `/api/v1/members/:id` | 팀원 수정 |
| Team | GET | `/api/v1/my/teams` | 내 소속 팀 목록 |
| Team | GET | `/api/v1/teams/:teamId/members-weekly-status` | 팀원 주간업무 현황 |
| **Project** | GET | `/api/v1/projects` | 프로젝트 목록 |
| Project | POST | `/api/v1/projects` | 프로젝트 생성 |
| Project | PATCH | `/api/v1/projects/:id` | 프로젝트 수정 |
| **Weekly** | GET | `/api/v1/weekly-reports/me?week=2026-W09` | 내 주간업무 조회 |
| Weekly | POST | `/api/v1/weekly-reports` | 주간업무 생성 |
| Weekly | PATCH | `/api/v1/weekly-reports/:id` | 상태 변경 (제출) |
| Weekly | POST | `/api/v1/weekly-reports/:id/work-items` | 업무항목 추가 |
| Weekly | PATCH | `/api/v1/work-items/:id` | 업무항목 수정 (자동저장) |
| Weekly | DELETE | `/api/v1/work-items/:id` | 업무항목 삭제 |
| Weekly | PATCH | `/api/v1/work-items/reorder` | 업무항목 정렬 |
| Weekly | POST | `/api/v1/weekly-reports/carry-forward` | 전주 할일 → 이번주 한일 |
| **Summary** | GET | `/api/v1/summaries` | 취합보고 조회 (PART/TEAM) |
| Summary | POST | `/api/v1/summaries` | 취합보고 생성 |
| Summary | POST | `/api/v1/summaries/:id/load-rows` | 멤버 행 로드 |
| Summary | POST | `/api/v1/summaries/:id/merge-rows` | 행 병합 |
| Summary | PATCH | `/api/v1/summary-work-items/:id` | 취합 업무항목 수정 |
| Summary | DELETE | `/api/v1/summary-work-items/:id` | 취합 업무항목 삭제 |
| Part | GET | `/api/v1/parts/:partId/weekly-status?week=` | 파트원 업무 현황 |
| Part | GET | `/api/v1/parts/:partId/submission-status?week=` | 작성 현황 |
| **Export** | GET | `/api/v1/export/excel?type=part&partId=&week=` | Excel 다운로드 |

---

## 10. 코딩 컨벤션

### Back-end (NestJS)
- 응답: 모든 컨트롤러는 통일된 응답 인터셉터를 통해 `{ success, data, message }` 형태로 반환
- 예외: 커스텀 `BusinessException(errorCode, message)`을 사용하고, 전역 ExceptionFilter에서 처리
- 모듈 구조: 각 모듈은 `module.ts`, `controller.ts`, `service.ts`, `dto/` 로 구성
- DTO: `class-validator` 데코레이터로 입력값 검증, `class-transformer`로 변환
- DTO 페이지네이션: `PaginationDto extends`로 page/limit 상속 (중복 선언 금지)
- Prisma 타입: `where` 조건에 `Prisma.XxxWhereInput` 타입 사용 (`any` 사용 금지)
- 환경변수: 보안 관련 값(비밀번호 등)은 ConfigService로 주입, 하드코딩 금지
- 공통 include 패턴: 반복되는 Prisma include를 상수로 추출
- 로깅: NestJS 내장 Logger 사용 (`this.logger.log/warn/error`)
- 트랜잭션: Prisma `$transaction()`을 사용한 명시적 트랜잭션

### Front-end (React)
- 색상: CSS 변수 `var(--primary)` 사용 — **HEX 하드코딩 절대 금지**
- 타입: `I` 접두사 금지, PascalCase 사용 (예: `WeeklyReport`, `WorkItem`)
- 상태: 서버 상태는 TanStack Query, UI 상태는 Zustand — 혼용 금지
- 자동저장: `useMutation` + `onMutate`(낙관적 업데이트) + debounce 500ms
- 그리드 셀 편집: `gridStore`에서 `focusedCell`, `editingValue`, `dirtyMap` 관리
- 컴포넌트: 파일 1개 = 컴포넌트 1개, default export 사용
- staleTime 설정: 모든 `useQuery`에 staleTime 필수 설정 (주간업무: 30s, 팀/프로젝트: 60s)
- 상수: 역할 라벨, 상태 라벨 등은 `src/constants/labels.ts`에서 import (인라인 선언 금지)
- 팀 ID: 팀 범위 API 호출 시 authStore가 아닌 `teamStore.currentTeamId` 사용

### 공통
- 주차 계산: `packages/shared/constants/week-utils.ts` 의 공유 함수 사용 (프론트·백 동일 로직, 페이지 내 인라인 함수 선언 금지)
- weekLabel 형식: `"2026-W09"` (ISO 8601 주차)
- weekStart 형식: `DateTime` (해당 주 월요일 00:00:00 UTC)

---

## 11. 색상 시스템

| 역할 | HEX | CSS 변수 |
|---|---|---|
| Primary | `#6B5CE7` | `--primary` |
| Primary Dark | `#5647CC` | `--primary-dark` |
| Primary BG | `#EDE9FF` | `--primary-bg` |
| Accent | `#F5A623` | `--accent` |
| OK 정상 | `#27AE60` | `--ok` |
| OK BG | `#E8F8F0` | `--ok-bg` |
| Warn 경고 | `#E67E22` | `--warn` |
| Warn BG | `#FFF3E0` | `--warn-bg` |
| Danger 위험 | `#E74C3C` | `--danger` |
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

---

## 12. 핵심 비즈니스 로직

### 12.1 전주 할일 → 이번주 한일 불러오기 (carry-forward)
```
POST /api/v1/weekly-reports/carry-forward
Body: { "targetWeek": "2026-W09", "sourceWorkItemIds": ["id1", "id2"] }

1. 전주(W08) WeeklyReport에서 선택된 WorkItem 조회
2. 이번주(W09) WeeklyReport 생성 (없으면 새로 생성)
3. 각 WorkItem의 planWork → 새 WorkItem의 doneWork로 복사
   - projectId 유지, planWork·remarks는 빈 값
4. 생성된 WorkItem 목록 반환
```

### 12.2 자동저장 (Autosave) 흐름
```
셀 편집 완료 (onBlur)
  → Zustand gridStore 즉시 업데이트 (UI 반영)
  → Debounce 500ms
  → TanStack Query mutation: PATCH /api/v1/work-items/:id
  → 성공: 캐시 무효화 + 저장 표시 | 실패: 롤백 + 토스트 알림
```

### 12.3 취합보고 행 병합 (merge-rows)
```
POST /api/v1/summaries/:id/merge-rows

1. 해당 파트/팀 멤버들의 WeeklyReport(해당 주차) 전체 조회
2. WorkItem을 Project별로 그룹화
3. 동일 프로젝트의 doneWork, planWork를 줄바꿈으로 병합
4. SummaryWorkItem으로 생성 → 파트장/팀장이 편집 가능
```

### 12.4 역할별 접근 권한 (RBAC)

| API 그룹 | ADMIN | LEADER (팀장) | PART_LEADER (파트장) | MEMBER (팀원) |
|----------|:---:|:---:|:---:|:---:|
| 계정 관리 (승인/초기화) | ✅ | ❌ | ❌ | ❌ |
| 팀 상태 관리 (승인) | ✅ | ❌ | ❌ | ❌ |
| 전역 프로젝트 관리 | ✅ | ❌ | ❌ | ❌ |
| 본인 주간업무 CRUD | ✅ | ✅ | ✅ | ✅ |
| 소속 파트원 업무 조회 | ✅ 전체 | ✅ 전체 | ✅ 소속 파트만 | ❌ |
| 파트 취합보고 작성 | ❌ | ❌ | ✅ 소속 파트만 | ❌ |
| 팀 전체 조회 | ✅ | ✅ | ❌ | ❌ |
| 팀·파트·프로젝트 관리 | ✅ | ✅ | ❌ | ❌ |
| Excel 내보내기 | ✅ | ✅ | ✅ 소속 파트 | ❌ |

### 12.5 업무 작성 서식 규칙
진행업무, 예정업무 셀의 텍스트는 아래 패턴으로 구조화 렌더링한다.

| 입력 패턴 | 의미 | 렌더링 |
|----------|------|--------|
| `[텍스트]` | 업무항목 (1단계) | 볼드, Primary 색상 |
| `*텍스트` | 세부업무 (2단계) | 불릿(•) 변환, 1단 들여쓰기 |
| `ㄴ텍스트` | 상세작업 (3단계) | 2단 들여쓰기, 보조 텍스트 색상 |

### 12.6 회원가입 및 계정 승인 프로세스
```
1. POST /api/v1/auth/register
   → Member 생성 (accountStatus: PENDING, mustChangePassword: true)

2. Admin이 PATCH /api/v1/admin/accounts/:id/status
   → PENDING → APPROVED → ACTIVE 단계 전환

3. 로그인 시 mustChangePassword: true이면 비밀번호 변경 강제
   → POST /api/v1/auth/change-password 호출 필수

4. 비밀번호 변경 완료 후 정상 로그인 (mustChangePassword: false)
```

### 12.7 팀 생성 신청 및 승인 프로세스
```
1. POST /api/v1/teams/request
   → Team 생성 (teamStatus: PENDING, requestedById: memberId)

2. Admin이 PATCH /api/v1/admin/teams/:id/status
   → PENDING → APPROVED 전환

3. 승인 시 신청자를 LEADER로 설정 + TeamMembership 생성

4. APPROVED → ACTIVE 전환 후 정상 사용
```

### 12.8 팀 가입 신청 프로세스
```
1. POST /api/v1/teams/:teamId/join
   → TeamJoinRequest 생성 (status: PENDING)

2. 팀장/파트장이 PATCH /api/v1/teams/:teamId/join-requests/:id 처리

3. 승인(APPROVED) 시
   → TeamMembership 생성 (roles: [MEMBER])

4. 거절(REJECTED) 시
   → 상태만 변경 (재신청 가능)
```

### 12.9 다중 팀 소속 구조
```
Member (1)
  ├─ accountStatus — 전역 계정 상태
  └─ teamMemberships (M) — 팀별 멤버십
     ├─ teamId (FK) — 소속 팀
     ├─ partId (FK) — 팀 내 파트
     └─ roles[] — 팀별 역할 (LEADER/PART_LEADER/MEMBER)

- currentTeamId: teamStore에서 관리, 팀 전환 시 변경
- API 호출 시 currentTeamId를 파라미터로 전달
- 팀 범위 API는 반드시 teamStore.currentTeamId 사용 (authStore 사용 금지)
```

---

## 13. 완료 기준 (Definition of Done)

각 TASK는 아래를 **모두 만족**해야 완료로 인정한다.

- [ ] TASK MD 체크리스트 전 항목 완료
- [ ] 요구사항 문서(설계서) 기능 100% 구현
- [ ] 스타일 가이드 색상·크기 하드코딩 없음 (CSS 변수 사용)
- [ ] Back-end: 단위 테스트 작성 및 통과
- [ ] Front-end: 컴포넌트 단위 테스트 작성 및 통과
- [ ] 빌드 오류 0건 (`bun run build` 성공)
- [ ] 린트 오류 0건 (`bun run lint` 성공)
- [ ] 주요 예외 케이스 처리 확인
- [ ] 결과 보고서 생성 완료

---

## 14. 수행결과 보고서 규칙

### 생성 조건
- 자동화 가능한 모든 검증 항목이 통과된 후 생성한다
- 수동 확인 항목(브라우저 렌더링, 그리드 인터랙션, 색상 확인 등)은 보고서 **섹션 5에 "수동 확인 필요"로 별도 표기**한다

### 파일 경로
```
tasks/multi-tasks/WORK-XX/WORK-XX-TASK-YY-result.md   — WORK 파이프라인
tasks/simple-tasks/S-TASK-NNNNN-result.md — 단독 작업
```

### 필수 섹션 구성

```markdown
# WORK-XX-TASK-YY 수행 결과 보고서

> 작업일: YYYY-MM-DD
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요
(해당 TASK의 목적 1~2줄 요약)

---

## 2. 완료 기준 달성 현황
(TASK MD의 완료 기준 항목별 ✅ / ❌ 표)

---

## 3. 체크리스트 완료 현황
(TASK MD의 체크리스트 항목을 소분류별 표로 정리)

---

## 4. 발견 이슈 및 수정 내역
(작업 중 발생한 오류·수정 사항을 이슈별로 기술)
(이슈가 없으면 "발견된 이슈 없음" 으로 기재)

각 이슈는 아래 형식으로 작성한다:
### 이슈 #N — 이슈 제목
**증상**: 오류 메시지 또는 현상
**원인**: 원인 분석
**수정**: 수정 파일 및 변경 내용

---

## 5. 최종 검증 결과
(빌드 로그, 테스트 결과, 실행 확인 내용 기재)

---

## 6. 후속 TASK 유의사항
(다음 TASK 진행 시 알아야 할 사항, 없으면 생략)

---

## 7. 산출물 목록
(신규 생성 파일 / 수정 파일 전체 목록을 표로 기재)
```

### 작성 원칙
- 이슈가 없더라도 섹션 4는 **반드시 포함**한다 ("발견된 이슈 없음" 기재)
- 빌드/테스트 결과는 실제 출력 로그를 코드 블록으로 첨부한다
- 수정 파일이 없으면 섹션 7의 "수정 파일" 표를 생략한다

---

## 15. WORK 파이프라인 도구 사용 규칙

### 15.1 계획 수립 시 Sequential Thinking 필수 사용
- WORK 계획 수립(planner) 단계에서는 **반드시 `mcp__sequential-thinking__sequentialthinking` 도구를 사용**하여 사고 과정을 구조화한다
- Sequential Thinking 사용 흐름:
  1. 요구사항 분석 및 핵심 변경 포인트 정리
  2. 기존 아키텍처 영향도 분석
  3. DB 스키마 변경 설계
  4. TASK 분해 및 의존성 DAG 설계
  5. 각 TASK 세부 체크리스트 정의
  6. 리스크 및 마이그레이션 전략 정리
- 최소 5단계 이상의 사고 과정을 거친 후 PLAN.md를 작성한다

### 15.2 소스 코드 분석 시 Serena 필수 사용
- WORK 파이프라인의 **모든 단계**(계획 수립, 작업 수행, 검증)에서 소스 코드를 분석할 때는 **Serena MCP 도구를 우선 사용**한다
- Serena 도구 사용 우선순위:
  1. `get_symbols_overview` — 파일 내 심볼 구조 파악 (파일 전체 읽기 전 필수)
  2. `find_symbol` — 특정 클래스/함수/메서드 검색 및 본문 조회
  3. `find_referencing_symbols` — 심볼 참조 관계 추적 (영향도 분석)
  4. `search_for_pattern` — 코드 패턴 검색 (심볼명을 모를 때)
  5. `replace_symbol_body` / `insert_after_symbol` / `insert_before_symbol` — 심볼 단위 편집
- **파일 전체 읽기(`Read`)는 최후 수단**으로만 사용한다 (Prisma 스키마 등 심볼릭 분석이 불가능한 경우에 한해 허용)
- 코드 수정 시에도 가능하면 Serena의 심볼 단위 편집 도구를 사용한다
