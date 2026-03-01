# WORK-04: Grid 컴포넌트 (EditableGrid/GridCell/ExpandedEditor/FormattedText/ProjectDropdown)

## 목적
그리드 컴포넌트의 컬럼 너비를 시안에 맞추고, 셀 스타일·포커스·에디터 UI를 개선

## 선행 WORK
WORK-03

## TASK 목록

### TASK-00: EditableGrid.tsx — 컬럼 너비·table-layout fixed
- **파일**: `packages/frontend/src/components/grid/EditableGrid.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. 컬럼 너비 시안 기준으로 변경: `11%/8%/30%/30%/18%/3%`
  2. `table-layout: fixed` + `<colgroup>` 적용
  3. 헤더: `px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]`
  4. 바디 셀: `px-3 py-[8px] text-[12.5px]`
  5. 코드 컬럼에 연한 배경색 적용
- **완료 기준**: 컬럼 비율 정확, 빌드 오류 없음

### TASK-01: GridCell.tsx — min-height·focus outline
- **파일**: `packages/frontend/src/components/grid/GridCell.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. min-height 통일 `52px`
  2. focus outline: `2px solid var(--primary)`, `outline-offset: -2px`
  3. 셀 패딩 정리
- **완료 기준**: 포커스 아웃라인 동작, 빌드 오류 없음

### TASK-02: ExpandedEditor.tsx — 스타일 수정
- **파일**: `packages/frontend/src/components/grid/ExpandedEditor.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. placeholder `\n` 줄바꿈 수정
  2. 상단: `border-t-2 border-[var(--primary)]`
  3. 배경: `bg-[#fafaff]`
  4. 패딩/마진 정리
- **완료 기준**: 스타일 시안 일치, 빌드 오류 없음

### TASK-03: FormattedText.tsx — indent 조정
- **파일**: `packages/frontend/src/components/grid/FormattedText.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. `*` 항목 indent: `pl-2` (8px)
  2. `ㄴ` 항목 indent: `pl-[18px]`, font `text-[11.5px]`
  3. 색상 정리 (보조 텍스트 `var(--text-sub)`)
- **완료 기준**: 들여쓰기 시안 일치, 빌드 오류 없음

### TASK-04: ProjectDropdown.tsx — click-outside·스타일 정리
- **파일**: `packages/frontend/src/components/grid/ProjectDropdown.tsx`
- **선행 TASK**: 없음
- **작업 내용**:
  1. click-outside 핸들러 추가 (useEffect + document.addEventListener)
  2. 검색 input: `h-[30px]`, `text-[12.5px]`
  3. 드롭다운 max-height, 스크롤 스타일
- **완료 기준**: 외부 클릭 시 닫힘, 빌드 오류 없음
