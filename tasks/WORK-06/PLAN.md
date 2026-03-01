# WORK-06: 통합 검증

## 목적
전체 UI 재작업 결과를 빌드·린트·테스트로 검증하고, 수동 확인 체크리스트를 문서화

## 선행 WORK
WORK-05

## TASK 목록

### TASK-00: 빌드·린트 검증
- **선행 TASK**: 없음
- **작업 내용**:
  1. `cd packages/frontend && bun run build` — 빌드 오류 0건 확인
  2. `cd packages/frontend && bun run lint` — 린트 오류 0건 확인
  3. 오류 발생 시 해당 파일 수정 후 재검증
  4. HEX 하드코딩 검사: 컴포넌트 파일에서 직접 HEX 색상 사용 여부 확인 (허용: globals.css 변수 정의, #fafaff 등 시안 지정값)
- **완료 기준**: 빌드 0 에러, 린트 0 에러

### TASK-01: 테스트 통과 확인
- **선행 TASK**: TASK-00
- **작업 내용**:
  1. `cd packages/frontend && bun run test` — Vitest 테스트 통과 확인
  2. 실패 테스트가 있으면 UI 변경에 맞춰 테스트 코드 수정
- **완료 기준**: 테스트 전체 통과

### TASK-02: 수동 UI 체크리스트 문서화
- **선행 TASK**: TASK-01
- **작업 내용**:
  1. 아래 항목을 `tasks/UI-REWORK-수행결과.md`에 수동 확인 필요 항목으로 기재:
     - 사이드바 210px, 아이콘 + 메뉴, 하단 유저 프로필
     - 헤더 48px, 날짜 + pulse dot
     - 콘텐츠 영역 정상 크기, 스크롤 동작
     - 각 페이지 테이블 셀 패딩/폰트 시안 일치
     - 그리드 컬럼 너비 11/8/30/30/18/3 비율
     - Badge pill 형태, CSS 변수 색상 사용
     - Modal/Toast 애니메이션 동작
- **완료 기준**: 수행결과 보고서 생성 완료
