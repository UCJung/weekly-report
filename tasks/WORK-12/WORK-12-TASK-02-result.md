# WORK-12-TASK-02 수행 결과 보고서

> 작업일: 2026-03-02
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

팀원 역할을 단일 enum에서 배열로 변경했다. DTO, MemberService, AuthService, JWT 전략, RolesGuard, part-summary.service 전반에서 role -> roles 배열로 처리하도록 수정했다.

---

## 2. 완료 기준 달성 현황

| 기준 | 결과 |
|------|------|
| POST /api/v1/members로 roles 배열 저장 가능 | ✅ |
| PATCH /api/v1/members/:id로 roles 배열 수정 가능 | ✅ |
| GET /api/v1/auth/me 응답에 roles 배열 포함 | ✅ |
| JWT 토큰에 roles 배열 인코딩 | ✅ |
| RolesGuard가 roles 배열 중 하나라도 매칭 시 허용 | ✅ |
| bun run build 성공 | ✅ |
| bun run test 성공 (46/46) | ✅ |

---

## 3. 발견 이슈 및 수정 내역

### 이슈 #1 - part-summary.service.ts에서 member.role 참조
**증상**: part-summary.service.ts에서 member.role을 사용하는 코드가 3곳 존재
**원인**: DB 마이그레이션 이후 role 컬럼 삭제됨
**수정**: getPartWeeklyStatus(), getTeamMembersWeeklyStatus(), getTeamWeeklyOverview()에서 roles 배열로 변경

### 이슈 #2 - part-summary.service.spec.ts 테스트 실패
**증상**: mockMember에 part 필드 없어서 member.part.name 접근 실패
**원인**: 테스트 목 데이터가 구 스키마 기준으로 작성됨
**수정**: mockMember에 roles 배열 및 part 객체 추가

---

## 4. 최종 검증 결과

```
$ bun run build
nest build
(성공)

$ bun run test
46 pass
0 fail
75 expect() calls
Ran 46 tests across 8 files.
```

---

## 5. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/backend/src/team/dto/create-member.dto.ts` | role -> roles 배열 |
| `packages/backend/src/team/dto/update-member.dto.ts` | role? -> roles? 배열 |
| `packages/backend/src/team/member.service.ts` | roles 배열 처리 |
| `packages/backend/src/auth/auth.service.ts` | JWT payload roles 배열 |
| `packages/backend/src/auth/strategies/jwt.strategy.ts` | JwtPayload roles 배열 |
| `packages/backend/src/common/guards/roles.guard.ts` | 배열 포함 여부 체크 |
| `packages/backend/src/weekly-report/part-summary.service.ts` | roles 배열로 변경 |
| `packages/backend/src/weekly-report/part-summary.service.spec.ts` | 테스트 목 데이터 업데이트 |
