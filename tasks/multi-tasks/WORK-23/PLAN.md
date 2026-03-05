# WORK-23: 개인 작업 관리 기능 구현

> 작성일: 2026-03-05
> 요구사항: tasks/Require/Require-09.md
> 상태: **계획 수립 완료**

---

## 요청사항
tasks/Require/Require-09.md

---

## 1. 요구사항 분석

### 1.1 핵심 기능 요약

| 기능 영역 | 요구사항 |
|----------|---------|
| **작업 등록** | 빠른 등록(Enter), 제목 필수 + 프로젝트/우선순위/마감일/메모 선택, 반복 작업 설정 |
| **상태 관리** | 할일(TODO) -> 진행중(IN_PROGRESS) -> 완료(DONE), 체크박스 클릭으로 빠른 완료/취소 |
| **목록 조회** | 마감일순 기본 정렬, 상태/프로젝트/우선순위/기간 필터, 텍스트 검색, DnD 정렬 |
| **주간업무 연동** | 완료 작업 -> 한일 반영, 진행중 작업 -> 할일 반영, 주간업무 할일 -> 작업 가져오기 |
| **대시보드 위젯** | 오늘 할 작업 수, 마감 임박, 이번 주 완료 수, 마감 지난 작업 강조 표시 |
| **접근 권한** | 본인 작업만 조회/수정, 파트장/팀장은 건수 요약만 조회 가능 |
| **UX** | 자동저장, 사이드바 "내 작업" 메뉴, 우측 상세 패널/모달, 모바일 대응 |

### 1.2 우선순위 정의

| 값 | 한글 | 정렬 가중치 |
|---|------|-----------|
| HIGH | 높음 | 1 |
| MEDIUM | 보통 | 2 |
| LOW | 낮음 | 3 |

### 1.3 반복 작업 설계

반복 설정은 JSON 컬럼으로 저장하며, 별도의 반복 생성 스케줄러 없이 **사용자가 작업 목록에 접근할 때 해당 주/일의 작업이 없으면 자동 생성**하는 방식으로 구현한다.

repeatConfig JSON 구조:
```json
{
  "type": "WEEKLY",
  "dayOfWeek": 1,
  "startDate": "2026-03-02"
}
```

---

## 2. 현행 아키텍처 영향도 분석

### 2.1 영향받는 백엔드 파일

| 파일 | 변경 유형 | 이유 |
|------|----------|------|
| packages/backend/prisma/schema.prisma | 수정 | PersonalTask 모델, TaskStatus/TaskPriority Enum 추가 |
| packages/backend/prisma/migrations/ | 추가 | 새 마이그레이션 파일 |
| packages/backend/src/app.module.ts | 수정 | PersonalTaskModule 등록 |

### 2.2 영향받는 프론트엔드 파일

| 파일 | 변경 유형 | 이유 |
|------|----------|------|
| packages/frontend/src/components/layout/Sidebar.tsx | 수정 | "내 작업" 메뉴 항목 추가 |
| packages/frontend/src/App.tsx | 수정 | /my-tasks 라우트 추가 |
| packages/frontend/src/pages/Dashboard.tsx | 수정 | 작업 현황 위젯 추가 |
| packages/frontend/src/pages/MyWeeklyReport.tsx | 수정 | "내 작업에서 가져오기" 버튼 + 모달 추가 |

### 2.3 신규 생성 파일 (백엔드)

```
packages/backend/src/personal-task/
├── personal-task.module.ts
├── personal-task.controller.ts
├── personal-task.service.ts
└── dto/
    ├── create-personal-task.dto.ts
    ├── update-personal-task.dto.ts
    ├── list-personal-tasks-query.dto.ts
    └── import-to-weekly-report.dto.ts
```

### 2.4 신규 생성 파일 (프론트엔드)

```
packages/frontend/src/
├── api/personal-task.api.ts
├── hooks/usePersonalTasks.ts
├── pages/MyTasks.tsx
└── components/personal-task/
    ├── TaskQuickInput.tsx
    ├── TaskList.tsx
    ├── TaskItem.tsx
    ├── TaskDetailPanel.tsx
    ├── TaskFilterBar.tsx
    └── ImportFromTasksModal.tsx
```

---

## 3. DB 스키마 설계

### 3.1 신규 Enum (2개)

```
TaskStatus: TODO, IN_PROGRESS, DONE
TaskPriority: HIGH, MEDIUM, LOW
```

### 3.2 신규 모델: PersonalTask

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| memberId | String (FK) | 작성자 |
| teamId | String (FK) | 소속 팀 (팀별 격리) |
| title | String | 작업 제목 (필수) |
| memo | String? (Text) | 상세 메모 |
| projectId | String? (FK) | 연결 프로젝트 (선택) |
| priority | TaskPriority | 우선순위 (기본: MEDIUM) |
| status | TaskStatus | 상태 (기본: TODO) |
| dueDate | DateTime? (Date) | 마감일 |
| sortOrder | Int | 정렬 순서 |
| linkedWeekLabel | String? | 반영된 주간업무 주차 라벨 |
| repeatConfig | Json? | 반복 설정 JSON |
| completedAt | DateTime? | 완료 처리 시각 |
| isDeleted | Boolean | 소프트 삭제 (기본: false) |
| createdAt | DateTime | 생성 시각 |
| updatedAt | DateTime | 수정 시각 |

인덱스:
- @@index([memberId, teamId])
- @@index([memberId, teamId, status])
- @@index([memberId, teamId, dueDate])
- @@index([projectId])

### 3.3 기존 모델 변경

| 모델 | 변경 내용 |
|------|----------|
| Member | personalTasks PersonalTask[] 관계 추가 |
| Team | personalTasks PersonalTask[] 관계 추가 |
| Project | personalTasks PersonalTask[] 관계 추가 |

---

## 4. API 설계

### 4.1 개인 작업 CRUD

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | /api/v1/personal-tasks | 내 작업 목록 (필터/검색/정렬) | 본인 |
| POST | /api/v1/personal-tasks | 작업 생성 | 본인 |
| PATCH | /api/v1/personal-tasks/:id | 작업 수정 | 본인 |
| DELETE | /api/v1/personal-tasks/:id | 작업 삭제 (소프트) | 본인 |
| PATCH | /api/v1/personal-tasks/reorder | DnD 정렬 | 본인 |

### 4.2 상태 전환

| Method | Endpoint | 설명 |
|--------|----------|------|
| PATCH | /api/v1/personal-tasks/:id/toggle-done | 할일<->완료 빠른 전환 |

### 4.3 주간업무 연동

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | /api/v1/personal-tasks/import-to-weekly | 선택 작업 -> 주간업무 WorkItem 생성 | 본인 |
| POST | /api/v1/personal-tasks/import-from-weekly | 주간업무 할일 -> 개인 작업 생성 | 본인 |

### 4.4 대시보드 요약

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | /api/v1/personal-tasks/summary | 오늘/마감임박/이번주완료/마감지남 카운트 | 본인 |

### 4.5 파트장/팀장 건수 요약

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | /api/v1/personal-tasks/part-overview | 파트원별 작업 건수 요약 | PART_LEADER, LEADER |
| GET | /api/v1/personal-tasks/team-overview | 팀원별 작업 건수 요약 | LEADER |

### 4.6 쿼리 파라미터 (GET /api/v1/personal-tasks)

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| teamId | string | 팀 ID (필수) |
| status | TODO, IN_PROGRESS, DONE, ALL | 상태 필터 |
| projectId | string? | 프로젝트 필터 |
| priority | HIGH, MEDIUM, LOW? | 우선순위 필터 |
| period | today, this-week, this-month, overdue? | 기간 필터 |
| q | string? | 제목/메모 검색 |
| sortBy | dueDate, priority, createdAt, project? | 정렬 기준 (기본: dueDate) |

---

## 5. 화면 설계

### 5.1 내 작업 페이지 (/my-tasks)

- 상단: 빠른 등록 입력란 (Enter 즉시 추가)
- 필터 바: 상태/프로젝트/우선순위/기간 필터 + 텍스트 검색
- 작업 목록: 체크박스 + 제목 + 프로젝트 태그 + 마감일 + 우선순위 배지
- 완료 작업: 취소선 + 목록 하단 그룹 표시
- 작업 클릭 시: 우측 슬라이드인 상세 패널
- 상세 패널: 제목 인라인 편집, 상태/우선순위/프로젝트/마감일/반복 셀렉터, 메모 자유입력, 주간업무 반영 현황 표시

### 5.2 주간업무 작성 화면 연동

- 기존 "전주 불러오기" 버튼 근처에 "내 작업에서 가져오기" 버튼 추가
- 모달: 한일(완료)/할일(진행중) 탭, 작업 목록에서 선택, 선택 항목 주간업무 반영

### 5.3 대시보드 위젯

기존 Dashboard.tsx SummaryCard 행에 4개 작업 요약 카드 추가:
- 오늘 할 작업 N건
- 마감 임박 N건 (3일 이내)
- 이번 주 완료 N건
- 마감 지남 N건 (danger 색상 강조)

### 5.4 사이드바 메뉴

"업무관리" 그룹에 "내 작업" 항목을 "내 주간업무" 다음에 추가 (CheckSquare 아이콘)

---

## 6. TASK 분해 및 의존성

### 6.1 TASK 목록

| TASK | 제목 | 의존 |
|------|------|------|
| WORK-23-TASK-01 | DB 스키마 변경 + Prisma 마이그레이션 | 없음 |
| WORK-23-TASK-02 | 백엔드 — 개인 작업 CRUD + 상태 전환 API | TASK-01 |
| WORK-23-TASK-03 | 백엔드 — 주간업무 연동 + 대시보드 요약 API | TASK-02 |
| WORK-23-TASK-04 | 프론트엔드 — 내 작업 페이지 구현 | TASK-02 |
| WORK-23-TASK-05 | 프론트엔드 — 주간업무 연동 + 대시보드 위젯 + 사이드바 | TASK-03, TASK-04 |
| WORK-23-TASK-06 | 통합 검증 + 빌드 정비 | TASK-05 |

### 6.2 의존성 DAG

```
TASK-01
  └──> TASK-02
         ├──> TASK-03 ──┐
         └──> TASK-04 ──┤
                         └──> TASK-05
                                └──> TASK-06
```

- TASK-03 와 TASK-04는 TASK-02 완료 후 병렬 실행 가능

### 6.3 실행 Phase

| Phase | TASK | 병렬 | 비고 |
|-------|------|------|------|
| 1 | TASK-01 | 1 | DB 스키마 (직렬 필수) |
| 2 | TASK-02 | 1 | 백엔드 기본 CRUD |
| 3 | TASK-03 + TASK-04 | 2 | 백엔드 연동 API + 프론트 기본 페이지 병렬 |
| 4 | TASK-05 | 1 | 프론트 통합 연동 |
| 5 | TASK-06 | 1 | 최종 빌드 검증 |

---

## 7. 리스크 및 주의사항

### 7.1 기존 기능 영향 최소화

- PersonalTask 모델은 WeeklyReport, WorkItem과 직접 관계 없이 독립 설계
- 주간업무 연동은 기존 WorkItem 생성 API를 재사용하여 사이드이펙트 없음
- Sidebar에 메뉴 항목 추가 시 MENU_GROUPS 상수 구조 유지

### 7.2 다중 팀 소속

- PersonalTask에 teamId 필드를 두어 팀별 작업 분리
- 프론트엔드에서 teamStore.currentTeamId를 모든 API 호출에 전달
- 팀 전환 시 TanStack Query 캐시 무효화 (['personal-tasks'])

### 7.3 반복 작업 생성 전략

- 스케줄러(cron job) 없이 GET /api/v1/personal-tasks 호출 시 누락된 반복 작업 자동 생성
- 반복 작업 생성 범위: 현재 주/일만 생성 (과거 누적 생성 없음)
- 구현 복잡도를 고려하여 MVP 단계에서는 반복 작업 자동 생성 로직을 서비스 레이어에 분리

### 7.4 소프트 삭제

- isDeleted: true 처리, DB에서 실제 삭제하지 않음
- 모든 조회 쿼리에 where: { isDeleted: false } 필수 포함
- linkedWeekLabel이 있는 작업 삭제 시 주간업무 WorkItem 연동 해제 없음 (독립 유지)

### 7.5 자동저장 UX

- 상세 패널에서 메모/제목 수정은 debounce 500ms + useMutation 패턴 적용
- 체크박스 완료 처리는 낙관적 업데이트 (onMutate) 적용

### 7.6 DnD 정렬

- @dnd-kit 라이브러리 기존 사용 중 -> 동일 패턴으로 TaskList.tsx에 적용
- 정렬 변경 후 PATCH /api/v1/personal-tasks/reorder 호출

### 7.7 성능

- 작업 목록 기본 limit: 200건 (개인 작업 특성상 페이지네이션 불필요)
- 대시보드 summary는 별도 경량 집계 쿼리로 분리
- staleTime: 작업 목록 30s, 대시보드 요약 60s
