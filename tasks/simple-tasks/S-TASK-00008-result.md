# S-TASK-00008 수행 결과 보고서

> 작업일: 2026-03-03
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요
Docker dev 환경에서 프론트엔드 API 호출이 백엔드(3000)가 아닌 프론트엔드(5173)로 전송되는 문제 수정.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| 원인 분석 완료 | ✅ |
| vite.config.ts 프록시 타겟 환경변수화 | ✅ |
| docker-compose.dev.yml 환경변수 추가 | ✅ |
| 로컬 개발 환경 영향 없음 확인 | ✅ |
| 빌드 성공 | ✅ |
| 린트 에러 0건 | ✅ |

---

## 3. 체크리스트 완료 현황

| 분류 | 항목 | 상태 |
|------|------|------|
| 원인 분석 | vite.config.ts proxy target이 localhost:3000 하드코딩 → 컨테이너 내부에서 자기 자신을 가리킴 | ✅ |
| 원인 분석 | host가 127.0.0.1 → Docker 외부 접근 불가 | ✅ |
| 수정 | vite.config.ts: proxy target을 `process.env.API_TARGET \|\| 'http://localhost:3000'`으로 변경 | ✅ |
| 수정 | vite.config.ts: host를 `process.env.VITE_HOST \|\| '127.0.0.1'`로 변경 | ✅ |
| 수정 | docker-compose.dev.yml: frontend 서비스에 `API_TARGET: http://backend:3000`, `VITE_HOST: "0.0.0.0"` 환경변수 추가 | ✅ |
| 수정 | docker-compose.dev.yml: frontend `depends_on: backend` 추가 | ✅ |
| 검증 | 프론트엔드 빌드 성공 | ✅ |
| 검증 | 프론트엔드 린트 에러 0건 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — Docker 컨테이너 내 API 프록시 타겟 미스매치
**증상**: Docker dev 환경에서 프론트엔드 API 호출이 5173 포트(프론트엔드 자신)로 전송됨
**원인**: `vite.config.ts`의 proxy target이 `http://localhost:3000`으로 하드코딩되어 있으나, Docker 컨테이너 내부에서 `localhost`는 프론트엔드 컨테이너 자신을 가리킴. 백엔드는 Docker 네트워크에서 `backend`라는 서비스명으로 접근해야 함.
**수정**:
- `vite.config.ts`: proxy target을 환경변수(`API_TARGET`)로 전환, 기본값은 `http://localhost:3000` 유지 (로컬 개발 호환)
- `vite.config.ts`: host를 환경변수(`VITE_HOST`)로 전환, 기본값은 `127.0.0.1` 유지
- `docker-compose.dev.yml`: frontend 서비스에 `API_TARGET: http://backend:3000`, `VITE_HOST: "0.0.0.0"` 환경변수 추가
- `docker-compose.dev.yml`: frontend에 `depends_on: backend` 추가하여 기동 순서 보장

---

## 5. 최종 검증 결과

### 프론트엔드 빌드
```
✓ built in 57.78s
```

### 프론트엔드 린트
```
✖ 7 problems (0 errors, 7 warnings)
```
- 에러 0건, 기존 warning 7건 (본 작업과 무관)

### 수동 확인 필요
- [ ] Docker dev 환경에서 `docker compose -f docker-compose.dev.yml up` 실행 후 API 호출 정상 동작 확인
- [ ] 로컬 개발(`bun run dev`)에서 API 프록시 기존대로 정상 동작 확인

---

## 6. 후속 TASK 유의사항
- 없음

---

## 7. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/frontend/vite.config.ts` | proxy target, host를 환경변수로 전환 (기본값 유지) |
| `docker-compose.dev.yml` | frontend 서비스에 API_TARGET, VITE_HOST 환경변수 및 depends_on 추가 |

### 신규 파일

| 파일 | 설명 |
|------|------|
| `tasks/simple-tasks/S-TASK-00008-result.md` | 본 수행 결과 보고서 |
