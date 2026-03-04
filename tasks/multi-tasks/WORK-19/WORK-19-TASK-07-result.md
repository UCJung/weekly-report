# WORK-19-TASK-07 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요
Backend API 호출 시 모든 요청에서 500 에러가 발생하는 문제를 진단하고 해결한다.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| 에러 원인 분석 | ✅ |
| clean 빌드 후 정상 기동 확인 | ✅ |
| 빌드 0 에러 | ✅ |

---

## 3. 체크리스트 완료 현황

| # | 항목 | 상태 |
|---|------|------|
| 1 | 에러 원인 분석 — incremental 빌드 캐시 불일치 | ✅ |
| 2 | dist 삭제 + clean 빌드 실행 | ✅ |
| 3 | 서버 정상 기동 확인 (NestJS bootstrap 성공) | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — Cannot find module './app.module'
**증상**: `dist/main.js`에서 `require('./app.module')` 실패 → 모든 API 500 에러
**원인**: TypeScript incremental 빌드(`.tsbuildinfo`)와 `nest build`의 `deleteOutDir: true` 설정 간 타이밍 충돌. 빌드 중단이나 파일 시스템 동기화 문제로 dist 내 일부 `.js` 파일이 누락 또는 불일치 상태
**수정**: `rm -rf dist && bun run build` (clean 빌드)로 해결. 코드 변경 없음.

---

## 5. 최종 검증 결과

```
$ cd packages/backend && rm -rf dist && bun run build
$ nest build

$ node -e "require('./dist/main')"
[Nest] Starting Nest application...
[InstanceLoader] AppModule dependencies initialized
[RoutesResolver] HealthController {/health}
...
[Bootstrap] Server running on http://localhost:3000
```

clean 빌드 후 정상 기동 확인.

---

## 6. 산출물 목록

| 구분 | 파일 |
|------|------|
| 조치 | clean 빌드 실행 (코드 변경 없음) |
