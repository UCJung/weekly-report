# WORK-05: 페이지 컴포넌트 (7개 페이지)

## 목적
각 페이지의 레이아웃, 테이블 셀 패딩/폰트, 필터 바, 툴바를 스타일 가이드에 맞춰 재작업

## 선행 WORK
WORK-04

## TASK 목록

### TASK-00: Dashboard.tsx — Summary cards·테이블 패널
- **파일**: `packages/frontend/src/pages/Dashboard.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. Summary cards: `gap-3`, 각 카드에 `iconBg` 색상 지정
  2. "팀원 작성 현황" 테이블 패널 추가 (파트 Badge, 작성상태 Badge, 경고 행 하이라이트)
  3. "파트 취합 현황" 테이블 패널 추가 (진행률 바)
  4. 테이블 셀: `padding 9px 12px`
  5. 패널: white bg, `rounded-lg`, `border border-[var(--gray-border)]`
- **완료 기준**: 대시보드 패널 2개 표시, 빌드 오류 없음

### TASK-01: MyWeeklyReport.tsx — 툴바 통합
- **파일**: `packages/frontend/src/pages/MyWeeklyReport.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. 주차 선택기 + 액션 버튼을 단일 툴바로 통합
  2. 툴바: white bg, `border border-[var(--gray-border)]`, `rounded-lg`, `py-2.5 px-4`
  3. 그리드 래퍼 여분 패딩 제거
  4. 제출 상태 Badge 표시
- **완료 기준**: 툴바 통합, 빌드 오류 없음

### TASK-02: PartStatus.tsx — 필터 바·rowspan 병합
- **파일**: `packages/frontend/src/pages/PartStatus.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. 필터 바 추가 (파트/팀원/프로젝트 select + Excel 버튼)
  2. 테이블 패널 헤더 (제목 + 주차 + 작성현황 인디케이터)
  3. 이름 컬럼 rowspan 병합 구현
  4. 테이블 셀 패딩 `px-3 py-[9px]`
- **완료 기준**: 필터 바, rowspan 동작, 빌드 오류 없음

### TASK-03: PartSummary.tsx — 컬럼 너비·툴바
- **파일**: `packages/frontend/src/pages/PartSummary.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. 컬럼 너비 EditableGrid 패턴에 맞춤
  2. 툴바 통합 (MyWeeklyReport와 동일 패턴)
  3. 자동취합/제출 버튼 스타일
- **완료 기준**: 컬럼 너비 맞춤, 빌드 오류 없음

### TASK-04: TeamStatus.tsx — rowspan·탭 버튼
- **파일**: `packages/frontend/src/pages/TeamStatus.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. rowspan 셀 border-right 스타일 정리
  2. 탭 버튼 스타일 가이드 맞춤 (height 26px)
  3. 테이블 셀 패딩 통일
- **완료 기준**: rowspan 스타일, 빌드 오류 없음

### TASK-05: TeamMgmt.tsx — 테이블 셀·모달 form
- **파일**: `packages/frontend/src/pages/TeamMgmt.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. 테이블 셀: `px-3 py-[9px]`
  2. 필터 바 스타일 통일
  3. 모달 form: `grid-template-columns: 90px 1fr`
- **완료 기준**: 테이블/모달 스타일, 빌드 오류 없음

### TASK-06: ProjectMgmt.tsx — Summary cards·테이블 패널
- **파일**: `packages/frontend/src/pages/ProjectMgmt.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. Summary cards: `grid-cols-3`으로 변경
  2. 테이블 패널 헤더 추가 (제목 + 건수 + 추가 버튼)
  3. 테이블 셀: `px-3 py-[9px]`
  4. 카테고리/상태 Badge 스타일 적용
- **완료 기준**: 테이블 패널 헤더, 빌드 오류 없음
