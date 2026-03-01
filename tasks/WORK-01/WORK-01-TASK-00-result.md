# WORK-01-TASK-00 수행 결과 보고서

> 작업일: 2026-03-02
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

`packages/frontend/src/styles/globals.css`에 누락된 CSS 변수(사이드바, 배지 관련), 애니메이션 키프레임(pulse, toastIn, modalIn), 커스텀 스크롤바 스타일을 추가하였다. `index.html`의 Noto Sans KR 폰트 링크는 이미 존재하여 변경 불필요였다. 빌드 과정에서 발견된 기존 TypeScript 타입 오류(PartStatus.tsx, TeamStatus.tsx)도 함께 수정하였다.

---

## 2. 완료 기준 달성 현황

| 기준 | 상태 |
|------|------|
| CSS 변수 정의됨 (사이드바·배지 관련 7종 추가) | ✅ |
| @keyframes 추가 (pulse, toastIn, modalIn) | ✅ |
| 커스텀 스크롤바 스타일 추가 | ✅ |
| Noto Sans KR 폰트 link 확인 | ✅ (기존 존재) |
| 빌드 오류 없음 (`bun run build` 성공) | ✅ |

---

## 3. 체크리스트 완료 현황

| 항목 | 내용 | 상태 |
|------|------|------|
| 누락 CSS 변수 추가 | `--sidebar-active`, `--sidebar-divider`, `--sidebar-text`, `--sidebar-menu-title`, `--badge-blue-bg`, `--badge-blue-text` | ✅ |
| 기존 `--content-pad` 유지 | `18px 20px` (스타일 가이드 기준값 유지) | ✅ |
| `@keyframes pulse` | 0%/100% opacity:1, 50% opacity:0.3 | ✅ |
| `@keyframes toastIn` | translateX(20px)→0, opacity 0→1 | ✅ |
| `@keyframes modalIn` | translateY(-12px) scale(0.97)→정상 | ✅ |
| 커스텀 스크롤바 | 6px, thumb `var(--gray-border)`, hover `var(--text-sub)` | ✅ |
| Noto Sans KR 폰트 link | index.html에 이미 존재 | ✅ |
| body font-family 확인 | 'Noto Sans KR', sans-serif 이미 설정됨 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — TypeScript 타입 오류 (기존 코드, CSS 변경과 무관)

**증상**: `bun run build` 실행 시 TypeScript 오류 2건 발생
```
src/pages/PartStatus.tsx(70,96): error TS2339: Property 'workItems' does not exist on type '{ id: string; weekLabel: string; status: "DRAFT" | "SUBMITTED"; workItems: WorkItem[]; } | null'.
src/pages/TeamStatus.tsx(40,38): error TS2339: Property 'workItems' does not exist on type '{ id: string; weekLabel: string; status: "DRAFT" | "SUBMITTED"; workItems: WorkItem[]; } | null'.
```
**원인**: `MemberWeeklyStatus['report']`가 `null` 가능한 union 타입임에도 인덱스로 `['workItems']`에 직접 접근
**수정**:
- `packages/frontend/src/pages/PartStatus.tsx` — `MemberWeeklyStatus['report']` → `NonNullable<MemberWeeklyStatus['report']>`
- `packages/frontend/src/pages/TeamStatus.tsx` — 동일

---

## 5. 최종 검증 결과

```
$ tsc -b && vite build
vite v6.4.1 building for production...
transforming...
✓ 175 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:   0.40 kB
dist/assets/index-DhEhlyRN.css   20.45 kB │ gzip:   4.92 kB
dist/assets/index-BafJGWko.js   337.67 kB │ gzip: 103.79 kB
✓ built in 5.28s
```

---

## 6. 후속 TASK 유의사항

- `--content-pad`는 `18px 20px` (shorthand) 형태로 유지됨. AppLayout에서 `padding: var(--content-pad)`로 사용 가능.
- `--sidebar-active`, `--sidebar-divider` 등 신규 변수를 Sidebar.tsx 리팩터링 시 활용 가능.

---

## 7. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/frontend/src/styles/globals.css` | CSS 변수 6종 추가, @keyframes 3종 추가, 커스텀 스크롤바 추가 |
| `packages/frontend/src/pages/PartStatus.tsx` | TypeScript 타입 오류 수정 (NonNullable 적용) |
| `packages/frontend/src/pages/TeamStatus.tsx` | TypeScript 타입 오류 수정 (NonNullable 적용) |
