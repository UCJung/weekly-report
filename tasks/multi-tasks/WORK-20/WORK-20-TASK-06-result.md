# WORK-20-TASK-06 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요
관리자 계정관리에서 직위/직책 수정 시 404 에러 발생 — 백엔드에 PATCH /api/v1/admin/accounts/:id/info 엔드포인트 누락. DTO, 서비스, 컨트롤러 추가.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| UpdateAccountInfoDto 생성 | ✅ |
| AdminService.updateAccountInfo 메서드 추가 | ✅ |
| @Patch('accounts/:id/info') 엔드포인트 추가 | ✅ |
| listAccounts에 position/jobTitle 포함 | ✅ |
| 빌드 성공 | ✅ |
| 테스트 통과 (153 pass) | ✅ |

---

## 3. 체크리스트 완료 현황

| 소분류 | 항목 | 완료 |
|--------|------|------|
| DTO | UpdateAccountInfoDto (Position enum, jobTitle string) | ✅ |
| 서비스 | updateAccountInfo — 계정 검증 + position/jobTitle 업데이트 | ✅ |
| 컨트롤러 | PATCH accounts/:id/info 엔드포인트 | ✅ |
| 응답 보완 | listAccounts select에 position, jobTitle 추가 | ✅ |
| 검증 | 빌드 + 테스트 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — PATCH /admin/accounts/:id/info 엔드포인트 누락
**증상**: 프론트엔드에서 직위/직책 저장 시 404 Not Found
**원인**: 프론트엔드 admin.api.ts에 updateAccountInfo API 호출이 구현되어 있으나 백엔드에 대응 엔드포인트가 없음
**수정**: DTO, 서비스 메서드, 컨트롤러 엔드포인트 추가

### 이슈 #2 — listAccounts 응답에 position/jobTitle 누락
**증상**: 계정 목록 조회 시 position, jobTitle 필드가 응답에 포함되지 않음
**원인**: listAccounts의 Prisma select에 해당 필드 미포함
**수정**: select에 position: true, jobTitle: true 추가

---

## 5. 최종 검증 결과

```
Build: nest build — 성공
Test: 153 pass, 0 fail, 306 expect() calls
```

---

## 6. 후속 TASK 유의사항
없음

---

## 7. 산출물 목록

| 구분 | 파일 |
|------|------|
| 신규 | packages/backend/src/admin/dto/update-account-info.dto.ts |
| 수정 | packages/backend/src/admin/admin.service.ts |
| 수정 | packages/backend/src/admin/admin.controller.ts |
