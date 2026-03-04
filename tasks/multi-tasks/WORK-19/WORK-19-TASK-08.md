# WORK-19-TASK-08: 프로젝트투입현황 행선택·승인완료 색상 중복 수정

> **Phase:** 오류수정
> **선행 TASK:** TASK-06
> **목표:** 프로젝트 목록에서 행선택 색상과 승인완료 Badge 색상이 동일하여 구분되지 않는 문제 수정

## 요청사항
- 행선택과 승인완료 버튼이 중복되어 승인완료가 클릭되지 않음
- 행선택 색상과 승인완료 색상이 동일해서 구분 불가
- 승인완료 Badge를 보라색(primary) 색상으로 변경

---

## Step 1 — 계획서

### 1.1 현황 분석

- 행선택 배경색: `var(--ok-bg)` (#E8F8F0, 녹색 배경)
- 승인완료 Badge 배경색: `var(--ok-bg)` (#E8F8F0, 녹색 배경) — **동일 색상**
- 선택된 행에서 승인완료 Badge가 배경에 묻혀 보이지 않음

### 1.2 수정 방안

- 승인완료 Badge 색상을 `var(--primary-bg)` / `var(--primary)` (보라색)으로 변경
- 미승인 Badge는 기존 `var(--warn-bg)` / `var(--warn)` 유지

### 1.3 산출물 목록

| 구분 | 산출물 |
|------|--------|
| 수정 | `packages/frontend/src/pages/ProjectAllocation.tsx` — 승인완료 Badge 색상 변경 |

---

## Step 2 — 체크리스트

- [ ] 승인완료 Badge: `--ok-bg`/`--ok` → `--primary-bg`/`--primary` 변경
- [ ] 빌드 0 에러
