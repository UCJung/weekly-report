# TASK-02 수행 결과 보고서

> 작업일: 2026-03-01
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

JWT 인증 체계(Access 15분/Refresh 7일+Redis), 역할 기반 접근 제어(RBAC), 팀·파트·팀원 관리 CRUD API, 전역 응답 인터셉터/예외 필터/유효성 검증 파이프 구현 완료.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| TASK MD 체크리스트 전 항목 완료 | ✅ |
| 요구사항 문서 기능 100% 구현 | ✅ |
| Back-end: 빌드 오류 0건 | ✅ |
| Back-end: 린트 오류 0건 | ✅ |
| Back-end: 단위 테스트 통과 (14건) | ✅ |
| 전체 빌드 성공 (3 패키지) | ✅ |
| 전체 테스트 통과 (23건) | ✅ |
| API 수동 테스트 통과 | ✅ |

---

## 3. 체크리스트 완료 현황

### 3.1 공통 인프라 (common/)

| 항목 | 상태 |
|------|------|
| response.interceptor.ts — `{ success, data, message }` 응답 포맷 | ✅ |
| http-exception.filter.ts — 전역 예외 필터 | ✅ |
| business-exception.ts — 커스텀 비즈니스 예외 | ✅ |
| ValidationPipe — class-validator 기반 전역 유효성 검증 | ✅ |
| current-user.decorator.ts — @CurrentUser() | ✅ |
| roles.decorator.ts — @Roles() | ✅ |
| jwt-auth.guard.ts — JWT 토큰 검증 | ✅ |
| roles.guard.ts — 역할 기반 접근 제어 | ✅ |
| pagination.dto.ts — page, limit 쿼리 DTO | ✅ |
| main.ts에 전역 파이프, 필터, 인터셉터 등록 | ✅ |

### 3.2 인증 모듈 (auth/)

| 항목 | 상태 |
|------|------|
| auth.module.ts — PassportModule, JwtModule 등록 | ✅ |
| auth.controller.ts — login, refresh, me, logout | ✅ |
| auth.service.ts — validateMember, login, refresh, getMe, logout | ✅ |
| jwt.strategy.ts — JWT 토큰 디코딩 | ✅ |
| local.strategy.ts — 이메일+비밀번호 검증 | ✅ |
| login.dto.ts, refresh.dto.ts — DTO 검증 | ✅ |
| Access Token 15분, Refresh Token 7일 | ✅ |
| Refresh Token Redis 저장/검증/삭제 | ✅ |
| 단위 테스트 7건 통과 | ✅ |

### 3.3 팀 관리 모듈 (team/)

| 항목 | 상태 |
|------|------|
| team.module.ts | ✅ |
| team.controller.ts — 팀 조회, 파트 목록, 팀원 목록, 팀원 등록/수정 | ✅ |
| team.service.ts — 팀 조회, 파트 목록 | ✅ |
| member.service.ts — 팀원 CRUD, 소프트 삭제 | ✅ |
| create-member.dto.ts, update-member.dto.ts — DTO | ✅ |
| 이메일 중복 체크 | ✅ |
| 소프트 삭제 (isActive = false) | ✅ |
| password 응답 제외 | ✅ |
| 단위 테스트 6건 통과 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — bcryptjs import 방식
**증상**: `TypeError: Cannot read properties of undefined (reading 'compare')`
**원인**: NestJS의 CommonJS 출력에서 `import bcrypt from 'bcryptjs'` 형태가 `bcrypt.default`로 변환되어 `compare`를 찾지 못함
**수정**: `import * as bcrypt from 'bcryptjs'`로 변경

### 이슈 #2 — nest build 시 spec 파일 컴파일 오류
**증상**: `nest start --watch`가 `.spec.ts` 파일의 타입 오류로 실패
**수정**: `tsconfig.build.json` 생성 (`spec.ts` 파일 제외), `nest-cli.json`에 `tsConfigPath` 설정

### 이슈 #3 — nest build 후 dist 디렉토리 미생성
**증상**: `nest build` 성공 출력이지만 `dist/` 디렉토리가 존재하지 않음
**원인**: `incremental: true` + `deleteOutDir: true` 조합으로 tsbuildinfo 캐시가 "변경 없음"으로 판단하여 파일 미생성
**수정**: 빌드 전 `tsconfig.tsbuildinfo`, `tsconfig.build.tsbuildinfo` 삭제

### 이슈 #4 — JwtModuleOptions expiresIn 타입
**증상**: `Type 'string' is not assignable to type 'number | StringValue | undefined'`
**원인**: `@nestjs/jwt` v11의 `signOptions.expiresIn`이 `StringValue` 타입만 허용 (일반 `string` 거부)
**수정**: 환경변수를 숫자(초 단위)로 변환하여 전달

### 이슈 #5 — 팀원 목록 응답에 password 노출
**증상**: `GET /api/v1/teams/:teamId/members` 응답에 해시된 비밀번호 포함
**수정**: `findByTeam`에서 `select`를 사용하여 password 필드 제외

---

## 5. 최종 검증 결과

### 빌드 결과
```
$ turbo run build
Tasks:    3 successful, 3 total
Time:    8.998s
```

### 린트 결과
```
$ turbo run lint
Tasks:    3 successful, 3 total (0 errors, 0 warnings)
```

### 테스트 결과
```
$ turbo run test
@weekly-report/shared:test: 8 pass
@weekly-report/backend:test: 14 pass
@weekly-report/frontend:test: 1 passed
Tasks:    6 successful, 6 total
```

### API 수동 테스트
```
POST /api/v1/auth/login → ✅ JWT 토큰 발급 (accessToken + refreshToken)
GET  /api/v1/auth/me     → ✅ 사용자 정보 반환 (password 제외)
GET  /api/v1/teams/:id/members → ✅ 9명 팀원 목록 (password 미포함)
GET  /api/v1/teams/:id/parts   → ✅ DX(4명), AX(5명) 파트 목록
```

---

## 6. 후속 TASK 유의사항

- **bcryptjs import**: NestJS CommonJS 환경에서는 반드시 `import * as bcrypt from 'bcryptjs'` 사용
- **nest build 캐시**: incremental 빌드 캐시(tsbuildinfo)가 이슈를 일으킬 수 있음. 문제 발생 시 tsbuildinfo 파일 삭제 후 재빌드
- **tsconfig.build.json**: spec 파일은 tsconfig.build.json에서 제외됨. nest build와 nest start:dev는 이 설정을 사용

---

## 7. 산출물 목록

### 신규 생성 파일

| 파일 경로 | 설명 |
|-----------|------|
| `src/common/filters/business-exception.ts` | 커스텀 비즈니스 예외 클래스 |
| `src/common/filters/http-exception.filter.ts` | 전역 예외 필터 |
| `src/common/interceptors/response.interceptor.ts` | 응답 포맷 인터셉터 |
| `src/common/decorators/current-user.decorator.ts` | @CurrentUser() 데코레이터 |
| `src/common/decorators/roles.decorator.ts` | @Roles() 데코레이터 |
| `src/common/guards/jwt-auth.guard.ts` | JWT 인증 가드 |
| `src/common/guards/roles.guard.ts` | 역할 기반 접근 제어 가드 |
| `src/common/dto/pagination.dto.ts` | 페이지네이션 DTO |
| `src/auth/auth.module.ts` | 인증 모듈 |
| `src/auth/auth.controller.ts` | 인증 컨트롤러 |
| `src/auth/auth.service.ts` | 인증 서비스 |
| `src/auth/auth.service.spec.ts` | 인증 단위 테스트 |
| `src/auth/strategies/jwt.strategy.ts` | JWT 전략 |
| `src/auth/strategies/local.strategy.ts` | 로컬 전략 |
| `src/auth/dto/login.dto.ts` | 로그인 DTO |
| `src/auth/dto/refresh.dto.ts` | 토큰 갱신 DTO |
| `src/team/team.module.ts` | 팀 관리 모듈 |
| `src/team/team.controller.ts` | 팀 컨트롤러 |
| `src/team/team.service.ts` | 팀 서비스 |
| `src/team/member.service.ts` | 팀원 서비스 |
| `src/team/member.service.spec.ts` | 팀원 단위 테스트 |
| `src/team/dto/create-member.dto.ts` | 팀원 생성 DTO |
| `src/team/dto/update-member.dto.ts` | 팀원 수정 DTO |
| `tsconfig.build.json` | 빌드용 tsconfig (spec 제외) |

### 수정 파일

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `src/main.ts` | 전역 필터, 인터셉터 등록. api/v1 prefix 제거 (컨트롤러에서 직접 지정) |
| `src/app.module.ts` | AuthModule, TeamModule import 추가. envFilePath 배열로 변경 |
| `nest-cli.json` | tsConfigPath: tsconfig.build.json 설정 |
| `package.json` | passport, jwt, class-validator, ioredis 등 의존성 추가 |
