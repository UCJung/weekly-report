# WORK-20-TASK-06: 관리자 계정 정보 수정 API 누락 수정

> **Phase:** 추가 작업
> **선행 TASK:** 없음
> **목표:** PATCH /api/v1/admin/accounts/:id/info 엔드포인트 추가

## 요청사항
관리자 > 계정관리 > 수정 > 레이어팝업 > 직위선택 및 직책입력후 저장시 404 에러 발생.
프론트엔드가 PATCH /api/v1/admin/accounts/:id/info를 호출하지만 백엔드에 해당 엔드포인트가 없음.

---

## Step 1 — 계획서

### 1.1 작업 범위
프론트엔드 AccountManagement 페이지에서 계정의 직위(position)와 직책(jobTitle)을 수정할 때 호출하는 API가 백엔드에 누락되어 있다. DTO, 서비스 메서드, 컨트롤러 엔드포인트를 추가한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| CREATE | packages/backend/src/admin/dto/update-account-info.dto.ts |
| MODIFY | packages/backend/src/admin/admin.service.ts |
| MODIFY | packages/backend/src/admin/admin.controller.ts |

---

## Step 2 — 체크리스트

### 2.1 DTO
- [x] UpdateAccountInfoDto 생성 (position?: Position, jobTitle?: string)

### 2.2 서비스
- [x] AdminService.updateAccountInfo 메서드 추가
- [x] 계정 존재 여부 검증
- [x] position, jobTitle 업데이트 후 반환

### 2.3 컨트롤러
- [x] @Patch('accounts/:id/info') 엔드포인트 추가

### 2.4 listAccounts 응답 보완
- [x] listAccounts select에 position, jobTitle 포함

### 2.5 검증
- [x] bun run build 성공
- [x] bun run test 통과 (153 pass)

---

## Step 3 — 완료 검증

```bash
cd packages/backend && bun run build && bun run test
```
