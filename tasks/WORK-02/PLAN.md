# WORK-02: Layout 컴포넌트 (Sidebar + Header)

## 목적
Sidebar에 아이콘·유저 프로필 추가, 하드코딩 색상을 CSS 변수로 전환. Header를 static 배치로 변경하고 pulse dot 추가.

## 선행 WORK
WORK-01

## TASK 목록

### TASK-00: Sidebar.tsx — 아이콘·유저 프로필·hover transition
- **파일**: `packages/frontend/src/components/layout/Sidebar.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. 각 메뉴 항목에 이모지 아이콘 추가 (📊 대시보드, ✏️ 주간업무, 📋 내 이력, 👥 파트현황, 📑 취합보고, 🏢 팀 현황, ⚙️ 팀 관리, 📁 프로젝트 관리)
  2. 하드코딩 `#252D48` → `var(--sidebar-active)` CSS 변수 사용
  3. active 항목: `border-l-[3px] border-[var(--primary)]`, bg `var(--sidebar-active)`
  4. 텍스트: `text-[12.5px]`, 아이콘-텍스트 gap `gap-[9px]`
  5. 하단 유저 프로필 섹션 추가 (아바타 원형 + 이름 + 파트/역할)
  6. hover transition `duration-150` 추가
  7. 메뉴 그룹 구분 (개인/파트/팀/관리) 섹션 타이틀 추가
- **완료 기준**: 아이콘 표시, CSS 변수 사용, 유저 프로필 표시, 빌드 오류 없음

### TASK-01: Header.tsx — static 전환·pulse dot 애니메이션
- **파일**: `packages/frontend/src/components/layout/Header.tsx`
- **선행 TASK**: TASK-00
- **작업 내용**:
  1. `fixed` positioning 제거 → static (AppLayout flex 안에서 자연 배치)
  2. 높이 48px, border-bottom
  3. 타이틀: `text-[15px] font-bold`
  4. 우측: 날짜 표시 (YYYY.MM.DD 형식)
  5. 녹색 pulse dot 애니메이션 추가 (`animate-pulse` 활용)
  6. padding 조정: `px-6 py-3`
- **완료 기준**: Header 정상 표시, pulse dot 동작, 빌드 오류 없음
