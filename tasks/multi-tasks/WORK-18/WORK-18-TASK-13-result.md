# WORK-18-TASK-13 수행 결과 보고서

> 작업일: 2026-03-04
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

횡스크롤 시 날짜/요일/근태/합계 4열을 좌측 고정(sticky)하여 프로젝트 열만 스크롤되도록 개선하고, 검증오류 알림 및 목록의 너비를 월 선택 헤더 영역과 동일하게 통일했다.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| 횡스크롤 시 날짜/요일/근태/합계 좌측 고정 | ✅ |
| 프로젝트 열만 횡스크롤 | ✅ |
| thead/tfoot 고정열 z-index 겹침 처리 | ✅ |
| 검증오류/읽기전용 배너 너비를 헤더와 동일하게 통일 | ✅ |
| `bun run build` — 0 에러 | ✅ |
| `bun run lint` — 0 에러 | ✅ |

---

## 3. 체크리스트 완료 현황

### 3.1 sticky 고정열
| 항목 | 상태 |
|------|------|
| COL_W / COL_LEFT 상수 정의 (날짜 46, 요일 36, 근태 90, 합계 60) | ✅ |
| thead 4열: sticky + left + z-index:3 + backgroundColor | ✅ |
| tbody 4열: sticky + left + z-index:1 + backgroundColor(rowBg) | ✅ |
| tfoot 4열: sticky + left + z-index:3 + backgroundColor | ✅ |
| tfoot colSpan(3) → 개별 셀 3개로 분리 (sticky 적용 위해) | ✅ |
| 합계열 우측 borderRight 2px 구분선 | ✅ |

### 3.2 너비 통일
| 항목 | 상태 |
|------|------|
| 검증오류/읽기전용 배너를 그리드와 동일 px-6 컨테이너로 이동 | ✅ |
| mx-6 별도 배치 → px-6 공유 컨테이너 내부 flex-shrink-0 배치 | ✅ |

### 3.3 통합 검증
| 항목 | 상태 |
|------|------|
| `bun run build` — 0 에러 | ✅ |
| `bun run lint` — 0 에러 (7 warnings, 기존 동일) | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — tfoot colSpan과 sticky 호환 문제
**증상**: tfoot에서 `colSpan={3}`으로 "월간 합계"를 표시하면 개별 열에 sticky left를 적용할 수 없음
**수정**: colSpan을 제거하고 3개 개별 셀("월간", "합계", 빈 셀)로 분리하여 각각 sticky 적용

---

## 5. 최종 검증 결과

```
 Tasks:    3 successful, 3 total
Cached:    2 cached, 3 total
  Time:    17.282s
```

**빌드 결과**: 3 packages 모두 성공

```
✖ 7 problems (0 errors, 7 warnings)
```

**린트 결과**: 0 errors, 7 warnings (기존 코드의 pre-existing warnings 동일)

### 수동 확인 필요 항목 (브라우저)
- 프로젝트 5개 이상 추가 → 횡스크롤 시 날짜/요일/근태/합계 좌측 고정 확인
- 스크롤 시 고정열과 프로젝트열 사이 구분선(2px) 표시 확인
- 세로 스크롤 시 헤더/푸터 고정 + 고정열도 정상 고정 확인
- 검증오류 알림/읽기전용 배너의 좌우 너비가 테이블과 동일한지 확인

---

## 6. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/frontend/src/pages/MyTimesheet.tsx` | COL_W/COL_LEFT 상수, thead/tbody/tfoot 4열 sticky left 적용, tfoot colSpan→개별셀 분리, 검증오류/배너를 그리드 동일 컨테이너로 이동 |

### 신규 생성 파일

| 파일 | 내용 |
|------|------|
| `tasks/multi-tasks/WORK-18/WORK-18-TASK-13.md` | TASK 체크리스트 |
| `tasks/multi-tasks/WORK-18/WORK-18-TASK-13-result.md` | 본 결과 보고서 |
