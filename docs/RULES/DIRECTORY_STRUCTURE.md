# 디렉터리 구조

> 이 파일은 프로젝트 구조 파악 시 참조한다.

```
weekly-report/
├── CLAUDE.md                                 ← 개발 마스터 가이드
├── docs/                                     ← 설계 문서
│   ├── 주간업무보고_시스템_설계_요구사항.md
│   ├── 주간업무보고_개발_아키텍처_설계서.md
│   ├── STYLE_GUIDE_WEB.md
│   └── RULES/                               ← 상세 규칙 (필요 시 참조)
│       ├── WORK_PIPELINE.md
│       ├── TASK_TEMPLATE.md
│       ├── REPORT_TEMPLATE.md
│       ├── DB_RULES.md
│       ├── API_REFERENCE.md
│       ├── BUSINESS_LOGIC.md
│       └── DIRECTORY_STRUCTURE.md
├── tasks/                                    ← TASK MD + 수행결과
│   ├── singles/                              ←   단독 작업 결과 (S-TASK-NNNNN-result.md)
│   ├── multi-tasks/WORK-*/                   ←   WORK별 계획·결과
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
│   │   │   ├── admin/                        ← 관리자 모듈
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
