# WORK-03: UI 컴포넌트 (Badge/Button/SummaryCard/Toast/Modal)

## 목적
공통 UI 컴포넌트를 스타일 가이드에 맞춰 CSS 변수 사용, 애니메이션 적용, 크기/패딩 조정

## 선행 WORK
WORK-02

## TASK 목록

### TASK-00: Badge.tsx — CSS 변수·pill 형태
- **파일**: `packages/frontend/src/components/ui/Badge.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. blue/gray 변형: Tailwind 하드코딩 → CSS 변수 (`var(--badge-blue-bg)`, `var(--badge-blue-text)` 등) 사용
  2. `rounded-[20px]` pill 형태
  3. `font-semibold`
  4. dot: `w-[5px] h-[5px]` 원형
  5. 패딩: `px-2 py-0.5`, 텍스트 `text-[11px]`
- **완료 기준**: CSS 변수 사용, pill 형태, 빌드 오류 없음

### TASK-01: Button.tsx — 스타일 가이드 맞춤
- **파일**: `packages/frontend/src/components/ui/Button.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. `rounded-[5px]`
  2. `text-[12.5px]`
  3. 아이콘-텍스트 `gap-[5px]`
  4. `transition-all duration-150`
  5. hover/active 상태 스타일 조정
- **완료 기준**: 스타일 가이드 맞춤, 빌드 오류 없음

### TASK-02: SummaryCard.tsx — iconBg prop·패딩 조정
- **파일**: `packages/frontend/src/components/ui/SummaryCard.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. padding `14px 16px`
  2. 아이콘-텍스트 gap `12px`
  3. value 폰트 `text-[22px] font-bold`
  4. `iconBg` prop 추가 (카드별 아이콘 배경색 지정)
  5. subText `text-[10.5px]` 스타일링
- **완료 기준**: iconBg prop 동작, 패딩 맞춤, 빌드 오류 없음

### TASK-03: Toast.tsx — 슬라이드인 애니메이션
- **파일**: `packages/frontend/src/components/ui/Toast.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. `rounded-lg`
  2. `min-w-[280px]`
  3. `toastIn` 애니메이션 적용 (globals.css의 @keyframes 사용)
  4. box-shadow `0 4px 16px rgba(0,0,0,0.12)`
- **완료 기준**: 애니메이션 적용, 빌드 오류 없음

### TASK-04: Modal.tsx — 페이드인 애니메이션·overlay
- **파일**: `packages/frontend/src/components/ui/Modal.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. `rounded-[10px]`
  2. `modalIn` 애니메이션 적용
  3. overlay: `bg-black/45`, `backdrop-blur-[1px]`
  4. 패딩: header `py-4 px-5`, body `p-5`, footer `py-3.5 px-5`
  5. shadow `0 20px 60px rgba(0,0,0,0.2)`
- **완료 기준**: 애니메이션 동작, overlay 스타일, 빌드 오류 없음
