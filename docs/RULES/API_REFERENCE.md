# API 공통 규칙 및 엔드포인트 목록

> 이 파일은 API 관련 작업 시 참조한다.

---

## 응답 형식
```json
// 성공
{ "success": true, "data": { ... }, "message": null }
// 목록 (페이지네이션)
{ "success": true, "data": [ ... ], "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 } }
// 에러
{ "success": false, "data": null, "message": "해당 주간업무를 찾을 수 없습니다.", "errorCode": "WEEKLY_REPORT_NOT_FOUND" }
```

## URL 규칙
```
GET/POST  /api/v1/{resource}
GET/PATCH/DELETE  /api/v1/{resource}/{id}
POST  /api/v1/{resource}/{action}          예) /api/v1/weekly-reports/carry-forward
```

---

## 주요 API 엔드포인트

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
