# WORK-18-TASK-18: 시간표 화면 레이아웃 통일 (컨텐츠 너비 수정)

> 의존: WORK-18-TASK-17 (이전 TASK 완료)
> 상태: **대기**

---

## 1. 문제 분석

### 현재 상태

**기존 페이지 (MyWeeklyReport, Dashboard 등) 레이아웃:**
```
AppLayout <main className="flex-1 overflow-y-auto p-5">
  └─ <div>  (plain div, 자연스러운 흐름)
       ├─ 툴바: bg-white rounded-lg border (카드 형태, 동일 너비)
       └─ 컨텐츠: bg-white rounded-lg border (카드 형태, 동일 너비)
```
→ 툴바와 컨텐츠가 **동일한 너비** (p-5 내부에서 자연스럽게 확장)

**시간표 페이지 (MyTimesheet, TeamTimesheetReview, ProjectAllocation) 레이아웃:**
```
AppLayout <main className="flex-1 overflow-y-auto p-5">
  └─ <div className="flex flex-col h-full">  (자체 레이아웃)
       ├─ 헤더: px-6 py-3 (독립 흰색 바, 전체 폭)
       └─ 컨텐츠: flex-1 overflow-auto (스크롤 영역)
            └─ 테이블/카드 (overflow로 인한 스크롤바 공간 차지)
```
→ 헤더와 컨텐츠 영역 **너비 불일치** (스크롤바 차이 + 패딩 차이)

### 근본 원인

1. **시간표 페이지들이 `h-full` + 자체 헤더바 패턴**을 사용하여 AppLayout의 표준 `p-5` 흐름과 다름
2. **MyTimesheet**: 상단 헤더(`px-6`)와 그리드 패널 툴바(`px-4`)의 패딩 불일치
3. **컨텐츠 영역에 `overflow: auto`** → 세로 스크롤바가 컨텐츠 너비를 줄임
4. **카드(rounded-lg border) 래퍼 없이** 직접 배치되어 기존 페이지와 시각적 불일치

---

## 2. 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/frontend/src/pages/MyTimesheet.tsx` | 레이아웃을 표준 카드 패턴으로 변경 |
| `packages/frontend/src/pages/TeamTimesheetReview.tsx` | 헤더→카드 툴바, 컨텐츠→카드 래핑 |
| `packages/frontend/src/pages/ProjectAllocation.tsx` | 동일 패턴 적용 |
| `packages/frontend/src/pages/admin/AdminTimesheetOverview.tsx` | 이미 표준 패턴이므로 확인만 |

---

## 3. 수정 방향

### 3.1 표준 페이지 레이아웃 패턴으로 통일

모든 시간표 페이지를 아래 구조로 변경:

```jsx
<div>  {/* plain div, AppLayout p-5 안에서 자연스러운 흐름 */}
  {/* 툴바 카드 (기존 페이지와 동일) */}
  <div className="bg-white rounded-lg border border-[var(--gray-border)] mb-4"
       style={{ padding: '10px 16px' }}>
    {/* 월 탐색 + 상태 배지 + 액션 버튼 */}
  </div>

  {/* 알림 영역 (검증 오류 / 읽기전용 배너) */}
  {validationErrors && <div className="mb-3 ...">...</div>}

  {/* 컨텐츠 카드 */}
  <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
    {/* 테이블/그리드/카드 목록 */}
  </div>
</div>
```

### 3.2 MyTimesheet 특수 처리

- 테이블은 수평/수직 스크롤이 필요하므로 **카드 내부에서 스크롤**
- 카드 높이를 `calc(100vh - 헤더 - 툴바 - 패딩)` 등으로 제한하여 스크롤 영역 확보
- 전체화면 모드는 기존 유지 (fixed overlay)
- 툴바 내 프로젝트 선택/제출 버튼은 카드 툴바로 이동

### 3.3 TeamTimesheetReview / ProjectAllocation

- 자체 헤더바(`px-6 py-3 white border-bottom`) → 카드 툴바(`bg-white rounded-lg border mb-4`)
- 컨텐츠 영역의 카드들은 이미 `rounded-lg` 사용 중 → 래퍼 padding 통일

---

## 4. 체크리스트

### 4.1 MyTimesheet.tsx
- [ ] 루트 `flex flex-col h-full` → plain `<div>` 변경
- [ ] 헤더 바 → `bg-white rounded-lg border mb-4` 카드 툴바로 변경
- [ ] 알림(검증오류/읽기전용) → `mb-3` 카드 형태로 변경
- [ ] 그리드 패널 → `bg-white rounded-lg border overflow-hidden` 카드 내부 배치
- [ ] 그리드 카드에 적절한 높이 제한 적용 (스크롤 가능)
- [ ] 전체화면 모드는 기존 유지

### 4.2 TeamTimesheetReview.tsx
- [ ] 루트 `flex flex-col h-full` → plain `<div>` 변경
- [ ] 헤더 바 → 카드 툴바로 변경
- [ ] 컨텐츠 영역 패딩 통일

### 4.3 ProjectAllocation.tsx
- [ ] 루트 `flex flex-col h-full` → plain `<div>` 변경
- [ ] 헤더 바 → 카드 툴바로 변경
- [ ] 컨텐츠 영역 패딩 통일

### 4.4 AdminTimesheetOverview.tsx
- [ ] 현재 표준 패턴 확인 (수정 불필요 시 SKIP)

### 4.5 통합 검증
- [ ] `bun run build` — 0 에러
- [ ] `bun run lint` — 0 에러

---

## 5. 완료 기준

- 모든 시간표 페이지의 툴바/필터 영역과 컨텐츠 영역 너비가 동일
- MyTimesheet 레이아웃이 MyWeeklyReport 등 기존 페이지와 동일한 카드 패턴
- 전체화면 모드 정상 동작
- 테이블 수평/수직 스크롤 정상 동작
- sticky 헤더/푸터/컬럼 정상 동작
- 빌드/린트 0 에러
