# WORK-18-TASK-13: 횡스크롤 시 고정열(날짜~합계) sticky + 알림/목록 너비 통일

> 의존성: TASK-12 (완료)
> 우선순위: 보통

---

## Step 1. 계획

### 1.1 횡스크롤 시 고정열
- 날짜/요일/근태/합계 4열을 `position: sticky; left: *px`로 좌측 고정
- 프로젝트 열만 횡스크롤
- thead/tfoot의 고정열은 z-index를 높여 행 sticky + 열 sticky 겹침 처리
- 고정열과 스크롤 영역 사이 구분선(borderRight) 강화

### 1.2 알림/목록 너비 통일
- 검증오류 알림, 읽기전용 배너, 그리드 목록을 동일 컨테이너(px-6)에 배치
- 월 선택 헤더 영역과 동일 너비 보장

---

## Step 2. 체크리스트

### 2.1 sticky 고정열
- [ ] COL_W / COL_LEFT 상수 정의
- [ ] thead 4열: `position: sticky; left; z-index: 3; backgroundColor`
- [ ] tbody 4열: `position: sticky; left; z-index: 1; backgroundColor`
- [ ] tfoot 4열: `position: sticky; left; z-index: 3; backgroundColor`
- [ ] 합계열 우측 borderRight 2px 구분선

### 2.2 너비 통일
- [ ] 검증오류/읽기전용 배너를 그리드와 동일 컨테이너로 이동
- [ ] 동일 px-6 패딩으로 헤더와 너비 정렬

### 2.3 통합 검증
- [ ] `bun run build` — 0 에러
- [ ] `bun run lint` — 0 에러
