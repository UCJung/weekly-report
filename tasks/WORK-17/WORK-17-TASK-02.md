# WORK-17-TASK-02: BE — 보안/페이지네이션 DTO/any 타입 개선

## WORK
WORK-17: 코드 품질 개선 — CRITICAL/HIGH 이슈 수정

## Dependencies
- WORK-17-TASK-01 (공유 타입 정합성 확보 완료 필요)

## Scope

수정 대상 이슈: #1 (CRITICAL), #4 (HIGH), #5 (HIGH)

### 1. [CRITICAL #1] 하드코딩 비밀번호 제거

**파일**: `packages/backend/src/admin/admin.service.ts:160`

현재 코드:
```
const hashedPassword = await bcrypt.hash('password123', 10);
```

수정 방향:
- AdminModule에 ConfigModule import 추가
- AdminService 생성자에 ConfigService 주입
- `this.configService.get('DEFAULT_PASSWORD', 'ChangeMe!2024')` 로 교체
- .env.example에 `DEFAULT_PASSWORD=ChangeMe!2024` 항목 추가

### 2. [HIGH #4] 페이지네이션 DTO 중복 제거

**대상 파일**:
- `packages/backend/src/admin/dto/list-accounts.dto.ts`
- `packages/backend/src/admin/dto/list-teams.dto.ts`

현재: 각 DTO에 page, limit 필드 직접 선언
수정: PaginationDto extends 후 고유 필드만 유지

주의사항: PaginationDto에 @Max(100) 제약이 있으므로 기존 limit 기본값 20과 충돌 여부 확인

### 3. [HIGH #5] any 타입 제거

**파일**: `packages/backend/src/admin/admin.service.ts`

현재:
```
const where: any = {};
```

수정:
```
const where: Prisma.MemberWhereInput = {};
```

import 추가: `import { Prisma } from '@prisma/client';`

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/backend/src/admin/admin.service.ts` | MODIFY | ConfigService 주입, any 타입 제거 |
| `packages/backend/src/admin/admin.module.ts` | MODIFY | ConfigModule import 추가 |
| `packages/backend/src/admin/dto/list-accounts.dto.ts` | MODIFY | PaginationDto 상속 |
| `packages/backend/src/admin/dto/list-teams.dto.ts` | MODIFY | PaginationDto 상속 |
| `packages/backend/.env.example` | MODIFY | DEFAULT_PASSWORD 항목 추가 |

## Acceptance Criteria

- [ ] admin.service.ts에 'password123' 문자열 리터럴 없음
- [ ] admin.service.ts에 ConfigService 주입 확인
- [ ] ListAccountsDto가 PaginationDto extends
- [ ] ListTeamsDto(admin)가 PaginationDto extends
- [ ] admin.service.ts에서 `any` 타입 사용 0건
- [ ] 백엔드 빌드 오류 0건
- [ ] 백엔드 단위 테스트 통과

## Verify

```
grep -n "password123" packages/backend/src/admin/admin.service.ts || echo "OK"
grep -n "where: any\|: any" packages/backend/src/admin/admin.service.ts || echo "OK"
grep -n "extends PaginationDto" packages/backend/src/admin/dto/list-accounts.dto.ts
grep -n "extends PaginationDto" packages/backend/src/admin/dto/list-teams.dto.ts
cd packages/backend && bun run build 2>&1 | tail -20
cd packages/backend && bun run test 2>&1 | tail -30
```
