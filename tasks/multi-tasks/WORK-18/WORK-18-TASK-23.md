# WORK-18-TASK-23: 관리자 화면 레이아웃 통일 (사용자 영역 UI 패턴 적용)

> **선행 TASK:** WORK-18-TASK-22
> **목표:** 관리자 4개 페이지의 컨텐츠 영역 레이아웃을 사용자 영역과 동일한 툴바 카드 패턴으로 통일

## 요청사항
[기능개선] 관리자 화면 컨텐츠 영역도 사용자 영역의 UI레이아웃으로 수정해줘

---

## Step 1 — 계획서

### 1.1 작업 범위

사용자 영역의 표준 레이아웃 패턴:
- **툴바 카드**: `bg-white rounded-lg border border-[var(--gray-border)]` + `padding: '10px 16px'` + `flex items-center gap-3 mb-4`
  - 내부: 페이지 제목(`text-[16px] font-semibold`) → 구분선(`w-px h-5`) → 필터/컨트롤 인라인
- **컨텐츠 카드**: `bg-white rounded-lg border` + 테이블/내용

관리자 4개 페이지를 위 패턴으로 수정:

1. **AccountManagement**: 필터 바 카드(p-4) → 툴바 카드(제목 + 검색 + 필터 인라인)
2. **TeamManagement**: 필터 바 카드(p-4) → 툴바 카드(제목 + 필터 인라인)
3. **ProjectManagement**: 떠있는 제목 + 필터 카드(rounded-xl) → 툴바 카드(제목 + 검색 + 필터 + 버튼 인라인), 테이블 rounded-xl → rounded-lg
4. **AdminTimesheetOverview**: 떠있는 제목 → 툴바 카드(제목 + 월탐색 + 버튼 인라인)

---

## Step 2 — 체크리스트

- [ ] AccountManagement: 툴바 카드 (제목 + 검색 + 상태필터 + 건수) 통합
- [ ] TeamManagement: 툴바 카드 (제목 + 상태필터 + 건수) 통합
- [ ] ProjectManagement: 툴바 카드 (제목 + 검색 + 분류필터 + 상태필터 + 프로젝트 생성 버튼) 통합, rounded-xl → rounded-lg
- [ ] AdminTimesheetOverview: 툴바 카드 (제목 + 월탐색 + 엑셀 + 최종승인 버튼) 통합
- [ ] `bun run build` — 0 에러
- [ ] `bun run lint` — 0 에러

---

## Step 3 — 검증 명령

```bash
bun run build
bun run lint
```
