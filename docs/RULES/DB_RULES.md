# DB 핵심 규칙

> 이 파일은 백엔드/DB 관련 작업 시 참조한다.

---

## Prisma 스키마 엔티티

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

---

## 주요 Enum

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

---

## 소프트 삭제 원칙
- `DELETE` SQL / Prisma `delete` 사용 금지
- Member: `accountStatus = INACTIVE`
- Project: `status = 'INACTIVE'`
- WeeklyReport, WorkItem: `onDelete: Cascade` (Report 삭제 시 하위 WorkItem 자동 삭제)

---

## 성능 인덱스
- WorkItem: `@@index([weeklyReportId])`, `@@index([projectId])`
- WeeklyReport: `@@index([weekStart])`
- TeamMembership: `@@index([memberId])`, `@@index([teamId])`
- PartSummary: `@@index([weekStart])`
- SummaryWorkItem: `@@index([partSummaryId])`
- TeamJoinRequest: `@@index([memberId])`, `@@index([teamId])`

---

## 마스터 데이터 시드 (seed.ts)
시드 실행 시 아래 데이터를 자동 생성한다.

| 데이터 | 내용 |
|--------|------|
| 팀 | 선행연구개발팀 1개 |
| 파트 | DX, AX 2개 |
| 팀원 | 9명 (홍길동/LEADER, 최수진/PART_LEADER, 나머지/MEMBER) |
| 프로젝트 | 공통 3개 + 수행 8개 = 총 11개 (현행 엑셀 기준값설정 시트 기준) |
