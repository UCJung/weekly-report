# WORK-18-TASK-10: 시간표 이전 일자 복사 기능 + 횡스크롤 개선

> 의존성: TASK-09 (완료)
> 우선순위: 보통

---

## Step 1. 계획

### 1.1 이전 일자 복사 기능

각 행(일자)에 "이전 일자 복사" 버튼을 추가한다.
- 클릭 시 바로 위 행(전일)의 근태, 프로젝트별 투입시간, 근무형태를 현재 행에 복사
- 첫째 날(1일)에는 버튼 비표시
- 제출 완료 상태(isSubmitted)에서는 비표시
- 복사 후 자동저장 트리거

### 1.2 횡스크롤 지원

프로젝트 열이 많아질 때 테이블이 화면을 넘기면 횡스크롤이 되도록 한다.
- 날짜/요일/근태 열은 sticky로 좌측 고정
- 합계 열은 sticky로 우측 고정
- 프로젝트 열들만 횡스크롤 영역에 표시
- 테이블 wrapper에 `overflow-x: auto` 적용

---

## Step 2. 체크리스트

### 2.1 이전 일자 복사
- [ ] `handleCopyFromPrevDay(dateStr)` 핸들러 추가
- [ ] 전일 entryData(근태, workLogs) → 현재 일자에 복사
- [ ] 복사 후 `scheduleAutoSave` 호출
- [ ] 각 행 날짜 옆에 복사 버튼 아이콘 (CopyIcon)
- [ ] 1일 및 isSubmitted일 때 버튼 숨김

### 2.2 횡스크롤
- [ ] 날짜/요일/근태 3열 — `position: sticky; left: 0` 고정
- [ ] 합계 열 — `position: sticky; right: 0` 고정
- [ ] 테이블 container에 `overflow-x: auto`
- [ ] sticky 열 z-index 설정

### 2.3 통합 검증
- [ ] `bun run build` — 0 에러
- [ ] `bun run lint` — 0 에러
