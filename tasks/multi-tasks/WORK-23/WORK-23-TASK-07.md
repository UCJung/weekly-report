# WORK-23-TASK-07: 작업 소요시간 기록 + 목록 메모 표시

> **Phase:** 추가
> **선행 TASK:** WORK-23-TASK-06
> **목표:** 개인 작업에 소요시간(자동 측정 + 수동 입력) 기록 기능을 추가하고, 작업 목록에서 메모 내용을 텍스트로 표시한다

## 요청사항
1. 작업소요 시간 기록 기능 추가
   - 자동: 작업 진행 시작 시간과 완료 시간의 차이로 입력
   - 수동: 작업완료 시 직접 입력 가능
2. 작업 목록에 작업 내용(메모) 텍스트로 표시

---

## Step 1 — 계획서

### 1.1 작업 범위
PersonalTask 모델에 `startedAt`(진행 시작 시각)과 `elapsedMinutes`(소요시간, 분 단위) 필드를 추가한다. 상태가 TODO→IN_PROGRESS로 전환될 때 `startedAt`을 자동 기록하고, IN_PROGRESS→DONE 전환 시 `startedAt`과 `completedAt`의 차이로 `elapsedMinutes`를 자동 계산한다. 사용자가 직접 소요시간을 입력/수정할 수도 있다. 프론트엔드 TaskItem에 메모 텍스트 한 줄 미리보기를 추가하고, TaskDetailPanel에 소요시간 표시/입력 UI를 추가한다.

### 1.2 산출물 목록

| 구분 | 산출물 |
|------|--------|
| DB | `schema.prisma` — PersonalTask에 `startedAt`, `elapsedMinutes` 필드 추가 |
| DB | Prisma 마이그레이션 파일 |
| Backend | `personal-task.service.ts` — 상태 전환 시 시간 자동 기록 로직 |
| Backend | `update-personal-task.dto.ts` — `elapsedMinutes` 필드 추가 |
| Frontend | `personal-task.api.ts` — PersonalTask 인터페이스 필드 추가 |
| Frontend | `TaskItem.tsx` — 메모 미리보기 + 소요시간 표시 |
| Frontend | `TaskDetailPanel.tsx` — 소요시간 표시/수동 입력 UI |

---

## Step 2 — 체크리스트

### 2.1 DB 스키마 변경
- [ ] PersonalTask 모델에 `startedAt DateTime?` 필드 추가 (진행 시작 시각)
- [ ] PersonalTask 모델에 `elapsedMinutes Int?` 필드 추가 (소요시간, 분 단위)
- [ ] Prisma 마이그레이션 실행 (`bunx prisma migrate dev`)
- [ ] Prisma Client 재생성 (`bunx prisma generate`)

### 2.2 Backend 서비스 수정
- [ ] `toggleDone` 메서드: TODO/IN_PROGRESS → DONE 전환 시 `startedAt`이 있으면 `elapsedMinutes` = (now - startedAt) / 60000 자동 계산, `completedAt` = now
- [ ] `update` 메서드: status가 IN_PROGRESS로 변경될 때 `startedAt`이 null이면 현재 시각 자동 설정
- [ ] `update` 메서드: status가 DONE으로 변경될 때 `startedAt`이 있으면 `elapsedMinutes` 자동 계산, `completedAt` = now
- [ ] `update` 메서드: `elapsedMinutes` 수동 입력 허용 (DTO에 포함, 사용자가 직접 값을 넘기면 자동 계산값 대신 수동값 사용)
- [ ] `create` 메서드: status가 IN_PROGRESS로 생성되면 `startedAt` = now 자동 설정
- [ ] UpdatePersonalTaskDto에 `elapsedMinutes` (number, optional, Min(0)) 추가

### 2.3 Frontend API 타입 수정
- [ ] `PersonalTask` 인터페이스에 `startedAt?: string`, `elapsedMinutes?: number` 추가
- [ ] `UpdatePersonalTaskDto`에 `elapsedMinutes?: number` 추가

### 2.4 TaskItem 수정 — 메모 미리보기 + 소요시간
- [ ] 제목 아래에 메모 텍스트 한 줄 표시 (최대 1줄, 말줄임 처리)
- [ ] 메모가 없으면 표시하지 않음
- [ ] DONE 상태이고 `elapsedMinutes`가 있으면 소요시간 배지 표시 (예: "1h 30m", "45m")
- [ ] 소요시간 포맷: 60분 이상이면 "Xh Ym", 미만이면 "Xm"

### 2.5 TaskDetailPanel 수정 — 소요시간 UI
- [ ] "소요시간" 필드 추가 (마감일 아래 위치)
- [ ] DONE 상태일 때: 자동 계산된 소요시간 표시 + 수동 수정 가능 (시간/분 입력)
- [ ] IN_PROGRESS 상태일 때: "진행 중 (시작: HH:MM)" 경과시간 표시
- [ ] TODO 상태일 때: 소요시간 필드 숨김 또는 "-" 표시
- [ ] 수동 입력 시 시간(h)과 분(m) 분리 입력 → elapsedMinutes로 변환하여 API 호출

### 2.6 테스트
- [ ] 백엔드 빌드 오류 없음
- [ ] 프론트엔드 빌드 오류 없음
- [ ] 전체 테스트 통과

---

## Step 3 — 완료 검증

```bash
# 1. 마이그레이션
cd packages/backend
bunx prisma migrate dev --name add-task-elapsed-time
bunx prisma generate

# 2. 전체 빌드
cd ../..
bun run build

# 3. 테스트
bun run test
```
