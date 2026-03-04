# WORK-19-TASK-07: Backend 빌드 아티팩트 불일치로 인한 500 에러 수정

> **Phase:** 오류수정
> **선행 TASK:** 없음
> **목표:** Backend dist 빌드 아티팩트 불일치로 인한 `Cannot find module './app.module'` 에러 해결

## 요청사항
API 호출 시 모두 500 에러 발생. 에러 로그: `Cannot find module './app.module'` (dist/main.js에서 발생)

---

## Step 1 — 계획서

### 1.1 원인 분석

- 에러: `Cannot find module './app.module'` — `dist/main.js`에서 `./app.module` require 실패
- 원인: incremental 빌드(`.tsbuildinfo`) 사용 시 이전 빌드 캐시와 현재 소스의 불일치로 일부 파일이 dist에 올바르게 생성되지 않는 경우 발생
- `nest-cli.json`에 `deleteOutDir: true`가 있지만 incremental 빌드 파일(`.tsbuildinfo`)이 dist 내에 위치하여 간헐적 충돌 가능
- 해결: clean 빌드 (`rm -rf dist && nest build`) 후 정상 기동 확인 완료

### 1.2 재발 방지

- `nest-cli.json`의 `deleteOutDir: true`가 이미 설정되어 있으므로 정상적인 `nest build` 시에는 dist가 정리됨
- 이슈는 빌드 중단이나 파일 시스템 동기화 문제로 인해 간헐적으로 발생할 수 있음
- 추가 조치 불필요 (clean 빌드로 해결)

### 1.3 산출물 목록

| 구분 | 산출물 |
|------|--------|
| 조치 | clean 빌드 (`rm -rf dist && bun run build`) 실행으로 해결 |

---

## Step 2 — 체크리스트

### 2.1 진단
- [x] 에러 원인 분석 완료
- [x] dist 디렉터리 clean 빌드 후 정상 기동 확인

### 2.2 검증
- [x] 빌드 0 에러
- [x] 서버 정상 기동 확인

---

## Step 3 — 완료 검증

```bash
cd packages/backend && rm -rf dist && bun run build
node -e "require('./dist/main')"
```
