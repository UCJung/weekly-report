# API 명세서

> UC TeamSpace Backend REST API
> Base URL: `http://localhost:3000`
> Global Prefix: `api/v1`

---

## 목차

1. [공통 규격](#1-공통-규격)
2. [API 목록표](#2-api-목록표)
3. [Auth — 인증](#3-auth--인증)
4. [Team — 팀·파트·멤버 관리](#4-team--팀파트멤버-관리)
5. [Project — 프로젝트 관리](#5-project--프로젝트-관리)
6. [Weekly Report — 주간업무](#6-weekly-report--주간업무)
7. [Part Summary — 취합보고](#7-part-summary--취합보고)
8. [Export — Excel 내보내기](#8-export--excel-내보내기)
9. [Admin — 관리자](#9-admin--관리자)
10. [Enum / 타입 정의](#10-enum--타입-정의)

---

## 1. 공통 규격

### 인증

| 항목 | 값 |
|------|-----|
| 방식 | JWT Bearer Token |
| 헤더 | `Authorization: Bearer <accessToken>` |
| Access Token 유효기간 | 15분 |
| Refresh Token 유효기간 | 7일 (Redis 저장) |

### 응답 형식

```jsonc
// 성공
{ "success": true, "data": { ... }, "message": null }

// 목록 (페이지네이션)
{ "success": true, "data": { "data": [...], "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 } } }

// 에러
{ "success": false, "data": null, "message": "에러 메시지", "errorCode": "ERROR_CODE" }
```

### 페이지네이션 기본값

| 파라미터 | 기본값 | 범위 |
|----------|--------|------|
| `page` | 1 | min 1 |
| `limit` | 20 | min 1, max 100 |

### HTTP 상태 코드

| 코드 | 의미 |
|------|------|
| 200 | 성공 (GET, PATCH, DELETE) |
| 201 | 생성 성공 (POST) |
| 400 | 잘못된 요청 / 유효성 검증 실패 |
| 401 | 인증 실패 (토큰 없음 또는 만료) |
| 403 | 권한 부족 |
| 404 | 리소스 없음 |
| 409 | 중복 충돌 |
| 500 | 서버 내부 오류 |

### 역할 (RBAC)

| 역할 | 설명 |
|------|------|
| `ADMIN` | 시스템 관리자 (계정/팀/프로젝트 전역 관리) |
| `LEADER` | 팀장 (팀 전체 관리 + 조회) |
| `PART_LEADER` | 파트장 (소속 파트 취합 + 조회) |
| `MEMBER` | 팀원 (본인 업무 작성) |

---

## 2. API 목록표

### Auth (인증)

| # | Method | Endpoint | 설명 | 인증 | 역할 |
|---|--------|----------|------|------|------|
| A1 | POST | `/auth/register` | 계정 신청 | - | - |
| A2 | POST | `/auth/login` | 로그인 | - | - |
| A3 | POST | `/auth/refresh` | 토큰 갱신 | - | - |
| A4 | GET | `/auth/me` | 내 정보 조회 | JWT | ALL |
| A5 | POST | `/auth/logout` | 로그아웃 | JWT | ALL |
| A6 | POST | `/auth/change-password` | 비밀번호 변경 | JWT | ALL |

### Team (팀·파트·멤버)

| # | Method | Endpoint | 설명 | 인증 | 역할 |
|---|--------|----------|------|------|------|
| T1 | GET | `/teams` | 팀 목록 (검색/필터/페이지네이션) | JWT | ALL |
| T2 | GET | `/teams/:teamId` | 팀 상세 | JWT | ALL |
| T3 | POST | `/teams/request` | 팀 생성 신청 | JWT | ALL |
| T4 | GET | `/teams/:teamId/parts` | 파트 목록 | JWT | ALL |
| T5 | PATCH | `/teams/:teamId/parts/reorder` | 파트 정렬 | JWT | LEADER |
| T6 | GET | `/teams/:teamId/members` | 팀원 목록 | JWT | ALL |
| T7 | PATCH | `/teams/:teamId/members/reorder` | 팀원 정렬 | JWT | LEADER |
| T8 | POST | `/teams/:teamId/join` | 팀 가입 신청 | JWT | ALL |
| T9 | GET | `/teams/:teamId/join-requests` | 가입 신청 목록 | JWT | LEADER, PART_LEADER |
| T10 | PATCH | `/teams/:teamId/join-requests/:id` | 가입 승인/거절 | JWT | LEADER, PART_LEADER |
| T11 | POST | `/members` | 팀원 등록 | JWT | LEADER |
| T12 | PATCH | `/members/:id` | 팀원 수정 | JWT | LEADER |
| T13 | GET | `/my/teams` | 내 소속 팀 목록 | JWT | ALL |
| T14 | GET | `/teams/:teamId/projects` | 팀 프로젝트 목록 | JWT | ALL |
| T15 | POST | `/teams/:teamId/projects` | 팀 프로젝트 추가 | JWT | LEADER |
| T16 | DELETE | `/teams/:teamId/projects/:projectId` | 팀 프로젝트 제거 | JWT | LEADER |
| T17 | PATCH | `/teams/:teamId/projects/reorder` | 팀 프로젝트 정렬 | JWT | LEADER |

### Project (프로젝트)

| # | Method | Endpoint | 설명 | 인증 | 역할 |
|---|--------|----------|------|------|------|
| P1 | GET | `/projects` | 프로젝트 목록 | JWT | ALL |
| P2 | GET | `/projects/:id` | 프로젝트 상세 | JWT | ALL |

### Weekly Report (주간업무)

| # | Method | Endpoint | 설명 | 인증 | 역할 |
|---|--------|----------|------|------|------|
| W1 | GET | `/weekly-reports/me?week=` | 내 주간업무 조회 | JWT | ALL |
| W2 | POST | `/weekly-reports` | 주간업무 생성 | JWT | ALL |
| W3 | PATCH | `/weekly-reports/:id` | 주간업무 상태 변경 | JWT | ALL |
| W4 | POST | `/weekly-reports/carry-forward` | 전주 불러오기 | JWT | ALL |
| W5 | GET | `/weekly-reports/:id/work-items` | 업무항목 목록 | JWT | ALL |
| W6 | POST | `/weekly-reports/:id/work-items` | 업무항목 추가 | JWT | ALL |
| W7 | PATCH | `/work-items/:id` | 업무항목 수정 (자동저장) | JWT | ALL |
| W8 | PATCH | `/work-items/reorder` | 업무항목 정렬 | JWT | ALL |
| W9 | DELETE | `/work-items/:id` | 업무항목 삭제 | JWT | ALL |
| W10 | DELETE | `/weekly-reports/:reportId/work-items?projectId=` | 프로젝트별 업무항목 일괄 삭제 | JWT | ALL |

### Part Summary (취합보고)

| # | Method | Endpoint | 설명 | 인증 | 역할 |
|---|--------|----------|------|------|------|
| S1 | GET | `/parts/:partId/weekly-status?week=` | 파트원 업무 현황 | JWT | LEADER, PART_LEADER |
| S2 | GET | `/parts/:partId/submission-status?week=` | 파트 작성 현황 | JWT | LEADER, PART_LEADER |
| S3 | POST | `/part-summaries` | 파트 취합보고 생성 | JWT | LEADER, PART_LEADER |
| S4 | POST | `/part-summaries/:id/auto-merge` | 자동 취합 | JWT | LEADER, PART_LEADER |
| S5 | PATCH | `/part-summaries/:id` | 취합보고 수정/제출 | JWT | LEADER, PART_LEADER |
| S6 | GET | `/teams/:teamId/weekly-overview?week=` | 팀 전체 현황 | JWT | LEADER |
| S7 | GET | `/teams/:teamId/members-weekly-status?week=` | 팀원 전체 업무 현황 | JWT | LEADER |
| S8 | GET | `/summaries?scope=&week=` | 취합보고 조회 | JWT | LEADER, PART_LEADER |
| S9 | POST | `/summaries` | 취합보고 생성 (scope 지정) | JWT | LEADER, PART_LEADER |
| S10 | POST | `/summaries/:id/load-rows` | 팀원 업무 불러오기 | JWT | LEADER, PART_LEADER |
| S11 | POST | `/summaries/:id/merge-rows` | 행 병합 | JWT | LEADER, PART_LEADER |
| S12 | PATCH | `/summaries/:id` | 취합보고 상태 변경 | JWT | LEADER, PART_LEADER |
| S13 | PATCH | `/summary-work-items/:id` | 취합 업무항목 수정 | JWT | LEADER, PART_LEADER |
| S14 | DELETE | `/summary-work-items/:id` | 취합 업무항목 삭제 | JWT | LEADER, PART_LEADER |

### Export (Excel 내보내기)

| # | Method | Endpoint | 설명 | 인증 | 역할 |
|---|--------|----------|------|------|------|
| E1 | GET | `/export/excel?type=&week=` | Excel 다운로드 | JWT | LEADER, PART_LEADER |

### Admin (관리자)

| # | Method | Endpoint | 설명 | 인증 | 역할 |
|---|--------|----------|------|------|------|
| D1 | GET | `/admin/accounts` | 계정 목록 | JWT | ADMIN |
| D2 | PATCH | `/admin/accounts/:id/status` | 계정 상태 변경 | JWT | ADMIN |
| D3 | PATCH | `/admin/accounts/:id/reset-password` | 비밀번호 초기화 | JWT | ADMIN |
| D4 | GET | `/admin/teams` | 팀 목록 | JWT | ADMIN |
| D5 | PATCH | `/admin/teams/:id/status` | 팀 상태 변경 | JWT | ADMIN |
| D6 | GET | `/admin/projects` | 전역 프로젝트 목록 | JWT | ADMIN |
| D7 | POST | `/admin/projects` | 전역 프로젝트 생성 | JWT | ADMIN |
| D8 | PATCH | `/admin/projects/:id` | 전역 프로젝트 수정 | JWT | ADMIN |

### Health Check

| # | Method | Endpoint | 설명 | 인증 | 역할 |
|---|--------|----------|------|------|------|
| H1 | GET | `/health` | 서버 상태 확인 | - | - |

---

## 3. Auth — 인증

### A1. POST `/auth/register`

계정 신청. 승인 전까지 로그인 불가.

**Request Body:**
```typescript
{
  name: string       // 성명 (필수, max 50)
  email: string      // 이메일 (필수, 유효한 이메일 형식)
  password: string   // 비밀번호 (필수, min 8, max 100)
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "홍길동",
    "email": "hong@example.com",
    "accountStatus": "PENDING",
    "createdAt": "2026-03-03T00:00:00.000Z"
  }
}
```

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `EMAIL_DUPLICATE` | 409 | 이미 등록된 이메일 |

---

### A2. POST `/auth/login`

로그인 후 Access Token + Refresh Token 발급.

**Request Body:**
```typescript
{
  email: string      // 이메일 (필수)
  password: string   // 비밀번호 (필수)
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "member-id",
    "email": "hong@example.com",
    "name": "홍길동",
    "roles": ["MEMBER"],
    "mustChangePassword": false,
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호 불일치 |
| `ACCOUNT_NOT_APPROVED` | 403 | 계정 미승인 상태 |

---

### A3. POST `/auth/refresh`

Refresh Token으로 새 Access Token 발급.

**Request Body:**
```typescript
{
  refreshToken: string  // Refresh Token (필수)
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `INVALID_REFRESH_TOKEN` | 401 | 유효하지 않거나 만료된 토큰 |

---

### A4. GET `/auth/me`

현재 인증된 사용자 정보 조회.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "member-id",
    "email": "hong@example.com",
    "name": "홍길동",
    "roles": ["MEMBER"],
    "partId": "part-id",
    "partName": "DX",
    "teamId": "team-id",
    "teamName": "선행연구개발팀",
    "isActive": true,
    "mustChangePassword": false
  }
}
```

---

### A5. POST `/auth/logout`

로그아웃. Redis에서 Refresh Token 삭제.

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "로그아웃되었습니다." }
}
```

---

### A6. POST `/auth/change-password`

비밀번호 변경. 첫 로그인 시 필수 변경.

**Request Body:**
```typescript
{
  currentPassword: string  // 현재 비밀번호 (필수)
  newPassword: string      // 새 비밀번호 (필수, min 8, max 100)
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "비밀번호가 변경되었습니다." }
}
```

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `INVALID_PASSWORD` | 400 | 현재 비밀번호 불일치 |

---

## 4. Team — 팀·파트·멤버 관리

### T1. GET `/teams`

팀 목록 조회. 검색, 필터(가입/미가입), 페이지네이션 지원.

**Query Params:**
```typescript
{
  search?: string           // 팀명 검색 (부분일치)
  filter?: "all" | "joined" | "unjoined"  // 기본값: "all"
  page?: number             // 기본값: 1
  limit?: number            // 기본값: 20
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "team-id",
        "name": "선행연구개발팀",
        "description": "팀 설명",
        "teamStatus": "ACTIVE",
        "memberCount": 9,
        "isMember": true,
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

---

### T2. GET `/teams/:teamId`

팀 상세 정보 조회.

**Path Params:** `teamId` — 팀 ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "team-id",
    "name": "선행연구개발팀",
    "description": "...",
    "teamStatus": "ACTIVE",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

### T3. POST `/teams/request`

팀 생성 신청. Admin 승인 필요.

**Request Body:**
```typescript
{
  teamName: string       // 팀 이름 (필수)
  description?: string   // 팀 설명
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "team-id",
    "name": "새팀",
    "teamStatus": "PENDING",
    "requestedById": "member-id"
  }
}
```

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `TEAM_NAME_DUPLICATE` | 409 | 이미 존재하는 팀 이름 |

---

### T4. GET `/teams/:teamId/parts`

팀 내 파트 목록 조회.

**Path Params:** `teamId` — 팀 ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "part-id",
      "name": "DX",
      "teamId": "team-id",
      "leaderId": "leader-id",
      "leader": { "id": "...", "name": "최수진", "email": "choi@example.com" },
      "sortOrder": 1
    }
  ]
}
```

---

### T5. PATCH `/teams/:teamId/parts/reorder`

파트 정렬 순서 변경. 팀장 전용.

**Path Params:** `teamId` — 팀 ID

**Request Body:**
```typescript
{
  orderedIds: string[]   // 파트 ID 배열 (정렬 순서대로, 필수, min 1)
}
```

**Response (200):** 정렬된 파트 목록

---

### T6. GET `/teams/:teamId/members`

팀원 목록 조회. 파트 필터 지원.

**Path Params:** `teamId` — 팀 ID

**Query Params:**
```typescript
{
  partId?: string   // 특정 파트 필터
}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "member-id",
      "name": "홍길동",
      "email": "hong@example.com",
      "roles": ["LEADER"],
      "partId": "part-id",
      "part": { "id": "...", "name": "DX" },
      "isActive": true,
      "sortOrder": 1
    }
  ]
}
```

---

### T7. PATCH `/teams/:teamId/members/reorder`

팀원 정렬 순서 변경. 팀장 전용.

**Path Params:** `teamId` — 팀 ID

**Request Body:**
```typescript
{
  orderedIds: string[]   // 멤버 ID 배열 (정렬 순서대로, 필수)
}
```

**Response (200):** 정렬된 팀원 목록

---

### T8. POST `/teams/:teamId/join`

팀 가입 신청. 팀장/파트장 승인 필요.

**Path Params:** `teamId` — 팀 ID

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "request-id",
    "memberId": "member-id",
    "teamId": "team-id",
    "status": "PENDING",
    "member": { "id": "...", "name": "홍길동", "email": "..." },
    "team": { "id": "...", "name": "선행연구개발팀" }
  }
}
```

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `TEAM_NOT_FOUND` | 404 | 팀 없음 |
| `TEAM_NOT_AVAILABLE` | 400 | 가입 불가 상태 |
| `ALREADY_JOINED` | 409 | 이미 가입된 팀 |
| `JOIN_REQUEST_ALREADY_EXISTS` | 409 | 이미 가입 신청 중 |

---

### T9. GET `/teams/:teamId/join-requests`

팀 가입 신청 목록. 팀장/파트장 전용.

**Path Params:** `teamId` — 팀 ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "request-id",
      "memberId": "member-id",
      "teamId": "team-id",
      "status": "PENDING",
      "createdAt": "2026-03-03T00:00:00Z",
      "member": { "id": "...", "name": "홍길동", "email": "...", "roles": ["MEMBER"] }
    }
  ]
}
```

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `FORBIDDEN` | 403 | 팀장/파트장이 아님 |

---

### T10. PATCH `/teams/:teamId/join-requests/:id`

가입 신청 승인 또는 거절. 팀장/파트장 전용.

**Path Params:** `teamId` — 팀 ID, `id` — 신청 ID

**Request Body:**
```typescript
{
  status: "APPROVED" | "REJECTED"   // 필수
  partId?: string                    // 승인 시 배치할 파트 ID
}
```

**Response (200):** 처리된 가입 신청 객체

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `JOIN_REQUEST_NOT_FOUND` | 404 | 신청 없음 |
| `JOIN_REQUEST_ALREADY_PROCESSED` | 400 | 이미 처리됨 |
| `PART_NOT_FOUND` | 404 | 파트 없음 (승인 시) |

---

### T11. POST `/members`

팀원 등록. 팀장 전용.

**Request Body:**
```typescript
{
  name: string          // 성명 (필수)
  email: string         // 이메일 (필수)
  password: string      // 초기 비밀번호 (필수, min 6)
  roles: MemberRole[]   // 역할 배열 (필수, min 1)
  partId: string        // 소속 파트 ID (필수)
}
```

**Response (201):** 생성된 멤버 객체

---

### T12. PATCH `/members/:id`

팀원 정보 수정. 팀장 전용.

**Path Params:** `id` — 멤버 ID

**Request Body (모든 필드 선택):**
```typescript
{
  name?: string
  password?: string       // min 6
  roles?: MemberRole[]
  partId?: string
  isActive?: boolean      // false = 비활성화 (소프트 삭제)
}
```

**Response (200):** 수정된 멤버 객체

---

### T13. GET `/my/teams`

현재 로그인 사용자의 소속 팀 목록.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "membershipId": "membership-id",
      "teamId": "team-id",
      "teamName": "선행연구개발팀",
      "teamDescription": "...",
      "teamStatus": "ACTIVE",
      "memberCount": 9,
      "partId": "part-id",
      "partName": "DX",
      "roles": ["MEMBER"],
      "joinedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### T14. GET `/teams/:teamId/projects`

팀에 연결된 프로젝트 목록.

**Path Params:** `teamId` — 팀 ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "team-project-id",
      "projectId": "project-id",
      "teamId": "team-id",
      "sortOrder": 1,
      "project": {
        "id": "project-id",
        "name": "프로젝트명",
        "code": "PRJ-001",
        "category": "COMMON",
        "status": "ACTIVE"
      }
    }
  ]
}
```

---

### T15. POST `/teams/:teamId/projects`

팀에 프로젝트 추가. 팀장 전용.

**Path Params:** `teamId` — 팀 ID

**Request Body:**
```typescript
{
  projectIds: string[]   // 추가할 프로젝트 ID 배열 (필수, min 1)
}
```

**Response (201):** 생성된 TeamProject 레코드 배열

---

### T16. DELETE `/teams/:teamId/projects/:projectId`

팀에서 프로젝트 제거. 팀장 전용.

**Path Params:** `teamId` — 팀 ID, `projectId` — 프로젝트 ID

**Response (200):**
```json
{ "success": true, "data": { "message": "프로젝트가 제거되었습니다." } }
```

---

### T17. PATCH `/teams/:teamId/projects/reorder`

팀 프로젝트 정렬 순서 변경. 팀장 전용.

**Path Params:** `teamId` — 팀 ID

**Request Body:**
```typescript
{
  orderedIds: string[]   // TeamProject ID 배열 (정렬 순서대로, 필수)
}
```

**Response (200):** 정렬된 팀 프로젝트 목록

---

## 5. Project — 프로젝트 관리

### P1. GET `/projects`

전역 프로젝트 목록 조회. 카테고리/상태 필터, 페이지네이션 지원.

**Query Params:**
```typescript
{
  page?: number                                    // 기본값: 1
  limit?: number                                   // 기본값: 20
  category?: "COMMON" | "EXECUTION"                // 카테고리 필터
  status?: "ACTIVE" | "INACTIVE"                   // 상태 필터
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "project-id",
        "name": "공통연구과제",
        "code": "CMN-001",
        "category": "COMMON",
        "status": "ACTIVE",
        "sortOrder": 1,
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 11, "totalPages": 1 }
  }
}
```

---

### P2. GET `/projects/:id`

프로젝트 상세 조회.

**Path Params:** `id` — 프로젝트 ID

**Response (200):** 프로젝트 객체

---

## 6. Weekly Report — 주간업무

### W1. GET `/weekly-reports/me?week=`

현재 사용자의 특정 주차 주간업무 조회. 없으면 `null` 반환.

**Query Params:**
```typescript
{
  week: string   // 필수. 형식: "2026-W09" (ISO 8601 주차)
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "report-id",
    "memberId": "member-id",
    "weekLabel": "2026-W09",
    "weekStart": "2026-02-23T00:00:00.000Z",
    "status": "DRAFT",
    "createdAt": "2026-03-03T00:00:00Z",
    "updatedAt": "2026-03-03T00:00:00Z",
    "workItems": [
      {
        "id": "item-id",
        "projectId": "project-id",
        "project": { "id": "...", "name": "...", "code": "..." },
        "doneWork": "[과제A]\n*세부작업1\nㄴ상세작업",
        "planWork": "*다음주 계획",
        "remarks": "비고",
        "sortOrder": 0
      }
    ]
  }
}
```

---

### W2. POST `/weekly-reports`

주간업무 생성. 팀원당 주차당 1건만 생성 가능.

**Request Body:**
```typescript
{
  weekLabel: string   // 필수. 형식: "2026-W09"
}
```

**Response (201):** 생성된 WeeklyReport 객체 (workItems: [])

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `WEEKLY_REPORT_ALREADY_EXISTS` | 409 | 해당 주차에 이미 보고서 존재 |

---

### W3. PATCH `/weekly-reports/:id`

주간업무 상태 변경 (제출 등).

**Path Params:** `id` — 보고서 ID

**Request Body:**
```typescript
{
  status: "DRAFT" | "SUBMITTED"   // 필수
}
```

**Response (200):** 수정된 WeeklyReport 객체

---

### W4. POST `/weekly-reports/carry-forward`

전주 할일(planWork)을 이번주 한일(doneWork)로 복사.

**Request Body:**
```typescript
{
  targetWeek: string              // 필수. 대상 주차 "2026-W09"
  sourceWorkItemIds?: string[]    // 선택. 특정 항목만 복사 (없으면 전체 복사)
}
```

**처리 로직:**
1. 전주(W08) WeeklyReport에서 WorkItem 조회
2. 이번주(W09) WeeklyReport 자동 생성 (없으면)
3. 각 WorkItem의 `planWork` → 새 WorkItem의 `doneWork`로 복사
4. `projectId` 유지, `planWork`/`remarks`는 빈 값

**Response (200):** 생성된 WorkItem 배열

---

### W5. GET `/weekly-reports/:id/work-items`

보고서의 업무항목 목록 조회.

**Path Params:** `id` — 보고서 ID

**Response (200):** WorkItem 배열 (project 포함, sortOrder 정렬)

---

### W6. POST `/weekly-reports/:id/work-items`

업무항목 추가.

**Path Params:** `id` — 보고서 ID

**Request Body:**
```typescript
{
  projectId?: string   // 프로젝트 ID
  doneWork: string     // 한일 (필수)
  planWork: string     // 할일 (필수)
  remarks?: string     // 비고
}
```

**Response (201):** 생성된 WorkItem 객체

---

### W7. PATCH `/work-items/:id`

업무항목 수정. 프론트엔드에서 debounce 500ms 후 자동저장으로 호출.

**Path Params:** `id` — 업무항목 ID

**Request Body (모든 필드 선택):**
```typescript
{
  projectId?: string
  doneWork?: string
  planWork?: string
  remarks?: string
}
```

**Response (200):** 수정된 WorkItem 객체

---

### W8. PATCH `/work-items/reorder`

업무항목 정렬 순서 일괄 변경.

**Request Body:**
```typescript
{
  items: Array<{
    id: string         // 업무항목 ID
    sortOrder: number  // 새 정렬 순서
  }>
}
```

**Response (200):** 정렬된 WorkItem 배열

---

### W9. DELETE `/work-items/:id`

업무항목 삭제.

**Path Params:** `id` — 업무항목 ID

**Response (200):**
```json
{ "success": true, "data": { "deleted": true } }
```

---

### W10. DELETE `/weekly-reports/:reportId/work-items?projectId=`

특정 프로젝트의 업무항목 일괄 삭제.

**Path Params:** `reportId` — 보고서 ID

**Query Params:**
```typescript
{
  projectId: string   // 삭제할 프로젝트 ID (필수)
}
```

**Response (200):**
```json
{ "success": true, "data": { "deletedCount": 3 } }
```

---

## 7. Part Summary — 취합보고

### S1. GET `/parts/:partId/weekly-status?week=`

파트원들의 주간업무 작성 현황. 파트장/팀장 전용.

**Path Params:** `partId` — 파트 ID

**Query Params:**
```typescript
{
  week: string   // 필수. "2026-W09"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "member": {
        "id": "member-id",
        "name": "홍길동",
        "roles": ["MEMBER"],
        "partId": "part-id",
        "partName": "DX"
      },
      "report": {
        "id": "report-id",
        "status": "SUBMITTED",
        "workItems": [
          {
            "id": "item-id",
            "projectId": "...",
            "project": { "id": "...", "name": "...", "code": "..." },
            "doneWork": "...",
            "planWork": "...",
            "remarks": "...",
            "sortOrder": 0
          }
        ]
      }
    }
  ]
}
```

---

### S2. GET `/parts/:partId/submission-status?week=`

파트원별 작성 제출 현황 요약.

**Path Params:** `partId` — 파트 ID

**Query Params:** `week` (필수)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "memberId": "member-id",
      "memberName": "홍길동",
      "status": "SUBMITTED"
    },
    {
      "memberId": "member-id-2",
      "memberName": "김철수",
      "status": "NOT_STARTED"
    }
  ]
}
```

---

### S3. POST `/part-summaries`

파트 취합보고 생성. 파트장/팀장 전용.

**Request Body:**
```typescript
{
  partId: string      // 파트 ID (필수)
  weekLabel: string   // 주차 "2026-W09" (필수)
}
```

**Response (201):** PartSummary 객체 (summaryWorkItems: [])

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `PART_SUMMARY_ALREADY_EXISTS` | 409 | 해당 파트·주차 취합보고 이미 존재 |

---

### S4. POST `/part-summaries/:id/auto-merge`

파트원 업무항목을 프로젝트별로 자동 병합.

**Path Params:** `id` — PartSummary ID

**처리 로직:**
1. 해당 파트 팀원들의 WeeklyReport(해당 주차) 조회
2. WorkItem을 Project별로 그룹화
3. 동일 프로젝트의 doneWork/planWork를 `[이름] 내용` 형식으로 줄바꿈 병합
4. SummaryWorkItem으로 생성

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": { "id": "...", "status": "DRAFT" },
    "summaryWorkItems": [ ... ],
    "mergedCount": 5
  }
}
```

---

### S5. PATCH `/part-summaries/:id`

취합보고 상태 변경 (제출 등).

**Path Params:** `id` — PartSummary ID

**Request Body:**
```typescript
{
  status?: "DRAFT" | "SUBMITTED"
}
```

**Response (200):** 수정된 PartSummary 객체

---

### S6. GET `/teams/:teamId/weekly-overview?week=`

팀 전체 파트별 주간업무 현황 개요. 팀장 전용.

**Path Params:** `teamId` — 팀 ID

**Query Params:** `week` (필수)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "part": { "id": "part-id", "name": "DX" },
      "summaryStatus": "DRAFT",
      "members": [
        {
          "member": { "id": "...", "name": "홍길동", "roles": ["MEMBER"] },
          "report": { "id": "...", "status": "SUBMITTED", "workItems": [...] }
        }
      ]
    }
  ]
}
```

---

### S7. GET `/teams/:teamId/members-weekly-status?week=`

팀 전체 팀원 업무 현황 (파트 구분 포함). 팀장 전용.

**Path Params:** `teamId` — 팀 ID

**Query Params:** `week` (필수)

**Response (200):** S1과 동일 형식 (전체 팀원 대상)

---

### S8. GET `/summaries?scope=&week=`

scope(PART/TEAM)별 취합보고 조회.

**Query Params:**
```typescript
{
  scope: "PART" | "TEAM"   // 필수
  partId?: string           // scope=PART 시 필수
  teamId?: string           // scope=TEAM 시 필수
  week: string              // 필수. "2026-W09"
}
```

**Response (200):** PartSummary 객체 (summaryWorkItems 포함) 또는 `null`

---

### S9. POST `/summaries`

scope 지정 취합보고 생성.

**Request Body:**
```typescript
{
  scope: "PART" | "TEAM"   // 필수
  partId?: string           // scope=PART 시 필수
  teamId?: string           // scope=TEAM 시 필수
  weekLabel: string         // 필수. "2026-W09"
  title?: string            // 제목 (기본: "파트 취합보고" / "팀 취합보고")
}
```

**Response (201):** 생성된 PartSummary 객체

---

### S10. POST `/summaries/:id/load-rows`

팀원 업무를 개별 SummaryWorkItem으로 불러오기. 기존 항목은 초기화.

**Path Params:** `id` — Summary ID

**처리 로직:**
1. scope에 따라 파트원 또는 팀 전체 멤버 조회
2. 기존 SummaryWorkItem 삭제
3. 각 멤버의 WorkItem을 개별 SummaryWorkItem으로 생성
4. `memberNames`에 `이름(파트명)` 형식 기록
5. `sortOrder`는 프로젝트 정렬 기준

**Response (200):** Summary 객체 (summaryWorkItems 포함)

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `SUMMARY_ALREADY_SUBMITTED` | 400 | 이미 제출된 취합보고 |

---

### S11. POST `/summaries/:id/merge-rows`

선택한 SummaryWorkItem을 하나로 병합. 같은 프로젝트만 병합 가능.

**Path Params:** `id` — Summary ID

**Request Body:**
```typescript
{
  summaryWorkItemIds: string[]   // 병합할 항목 ID (필수, min 2)
}
```

**처리 로직:**
1. 같은 프로젝트 검증
2. doneWork/planWork/remarks를 줄바꿈으로 연결
3. memberNames를 쉼표로 연결
4. 첫 번째 항목에 병합, 나머지 삭제

**Response (200):** 병합된 SummaryWorkItem 객체

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `MERGE_MIN_TWO` | 400 | 최소 2개 필요 |
| `MERGE_DIFFERENT_PROJECTS` | 400 | 서로 다른 프로젝트 |

---

### S12. PATCH `/summaries/:id`

취합보고 상태 변경.

**Path Params:** `id` — Summary ID

**Request Body:**
```typescript
{
  status?: "DRAFT" | "SUBMITTED"
}
```

**Response (200):** 수정된 Summary 객체

---

### S13. PATCH `/summary-work-items/:id`

취합 업무항목 내용 수정.

**Path Params:** `id` — SummaryWorkItem ID

**Request Body (모든 필드 선택):**
```typescript
{
  doneWork?: string
  planWork?: string
  remarks?: string
}
```

**Response (200):** 수정된 SummaryWorkItem 객체

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `SUMMARY_WORK_ITEM_NOT_FOUND` | 404 | 항목 없음 |
| `SUMMARY_ALREADY_SUBMITTED` | 400 | 이미 제출됨 |

---

### S14. DELETE `/summary-work-items/:id`

취합 업무항목 삭제.

**Path Params:** `id` — SummaryWorkItem ID

**Response (200):**
```json
{ "success": true, "data": { "deleted": true } }
```

**에러:**
| errorCode | 상태 | 설명 |
|-----------|------|------|
| `SUMMARY_WORK_ITEM_NOT_FOUND` | 404 | 항목 없음 |
| `SUMMARY_ALREADY_SUBMITTED` | 400 | 이미 제출됨 |

---

## 8. Export — Excel 내보내기

### E1. GET `/export/excel?type=&week=`

주간업무보고를 Excel 파일로 다운로드. 파트장/팀장 전용.

**Query Params:**
```typescript
{
  type: "part" | "team" | "summary"   // 필수. 내보내기 유형
  week: string                         // 필수. "2026-W09"
  partId?: string                      // type=part 시 필수
  teamId?: string                      // type=team 시 사용
  summaryId?: string                   // type=summary 시 사용
}
```

**Response (200):** Excel 파일 바이너리
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="주간업무보고_2026-W09.xlsx"
```

---

## 9. Admin — 관리자

> 모든 Admin API는 `ADMIN` 역할 필수.

### D1. GET `/admin/accounts`

계정 목록 조회. 상태 필터, 검색, 페이지네이션 지원.

**Query Params:**
```typescript
{
  page?: number         // 기본값: 1
  limit?: number        // 기본값: 20
  status?: AccountStatus   // "PENDING" | "APPROVED" | "ACTIVE" | "INACTIVE"
  search?: string       // 이름 또는 이메일 검색
}
```

**Response (200):** 페이지네이션된 계정 목록

---

### D2. PATCH `/admin/accounts/:id/status`

계정 상태 변경 (승인, 비활성화 등).

**Path Params:** `id` — 계정 ID

**Request Body:**
```typescript
{
  status: AccountStatus   // 필수
}
```

**Response (200):** 수정된 계정 객체

---

### D3. PATCH `/admin/accounts/:id/reset-password`

비밀번호 초기화. 환경변수 `DEFAULT_PASSWORD` 값으로 설정.

**Path Params:** `id` — 계정 ID

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "비밀번호가 초기화되었습니다." }
}
```

---

### D4. GET `/admin/teams`

전체 팀 목록 조회.

**Query Params:**
```typescript
{
  page?: number
  limit?: number
  status?: TeamStatus   // "PENDING" | "APPROVED" | "ACTIVE" | "INACTIVE"
}
```

**Response (200):** 페이지네이션된 팀 목록

---

### D5. PATCH `/admin/teams/:id/status`

팀 상태 변경 (승인, 비활성화 등).

**Path Params:** `id` — 팀 ID

**Request Body:**
```typescript
{
  status: TeamStatus   // 필수
}
```

**Response (200):** 수정된 팀 객체

---

### D6. GET `/admin/projects`

전역 프로젝트 목록 조회.

**Query Params:**
```typescript
{
  page?: number
  limit?: number
  category?: "COMMON" | "EXECUTION"
  status?: "ACTIVE" | "INACTIVE"
}
```

**Response (200):** 페이지네이션된 프로젝트 목록

---

### D7. POST `/admin/projects`

전역 프로젝트 생성.

**Request Body:**
```typescript
{
  name: string                       // 프로젝트명 (필수)
  code: string                       // 프로젝트 코드 (필수)
  category: "COMMON" | "EXECUTION"   // 카테고리 (필수)
}
```

**Response (201):** 생성된 프로젝트 객체

---

### D8. PATCH `/admin/projects/:id`

전역 프로젝트 수정.

**Path Params:** `id` — 프로젝트 ID

**Request Body (모든 필드 선택):**
```typescript
{
  name?: string
  code?: string
  category?: "COMMON" | "EXECUTION"
  status?: "ACTIVE" | "INACTIVE"
}
```

**Response (200):** 수정된 프로젝트 객체

---

## 10. Enum / 타입 정의

### MemberRole
```typescript
"ADMIN" | "LEADER" | "PART_LEADER" | "MEMBER"
```

### ReportStatus
```typescript
"DRAFT" | "SUBMITTED"
```

### ProjectCategory
```typescript
"COMMON" | "EXECUTION"
```

### ProjectStatus
```typescript
"ACTIVE" | "INACTIVE"
```

### AccountStatus
```typescript
"PENDING" | "APPROVED" | "ACTIVE" | "INACTIVE"
```

### TeamStatus
```typescript
"PENDING" | "APPROVED" | "ACTIVE" | "INACTIVE"
```

### JoinRequestStatus
```typescript
"PENDING" | "APPROVED" | "REJECTED"
```

### SummaryScope
```typescript
"PART" | "TEAM"
```

### TeamFilter
```typescript
"all" | "joined" | "unjoined"
```

### weekLabel 형식
```
"YYYY-Www"  예: "2026-W09" (ISO 8601 주차)
```

### weekStart 형식
```
DateTime (해당 주 월요일 00:00:00 UTC)
```
