# 주간업무보고 시스템 — 웹 스타일 가이드

> **대상:** React 18 + TypeScript + Tailwind CSS 3
> **기준 해상도:** 1280px 이상 고정 (반응형 불필요)
> **최종 확정 레이아웃 기준** — 2026년 3월

---

## 목차

1. [디자인 원칙](#1-디자인-원칙)
2. [색상 시스템](#2-색상-시스템)
3. [타이포그래피](#3-타이포그래피)
4. [레이아웃 구조](#4-레이아웃-구조)
5. [컴포넌트 — 버튼](#5-컴포넌트--버튼)
6. [컴포넌트 — 배지 (Badge)](#6-컴포넌트--배지-badge)
7. [컴포넌트 — 입력 폼](#7-컴포넌트--입력-폼)
8. [컴포넌트 — 테이블](#8-컴포넌트--테이블)
9. [컴포넌트 — 카드](#9-컴포넌트--카드)
10. [컴포넌트 — 모달](#10-컴포넌트--모달)
11. [컴포넌트 — 토스트 알림](#11-컴포넌트--토스트-알림)
12. [컴포넌트 — 페이지네이션](#12-컴포넌트--페이지네이션)
13. [상태별 시각 규칙](#13-상태별-시각-규칙)
14. [CSS 변수 전체 목록](#14-css-변수-전체-목록)

---

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **정보 밀도** | 업무 관리 도구이므로 한 화면에 많은 정보를 표시. 여백은 최소화하되 가독성 확보 |
| **상태 명시** | 모든 데이터 행·배지·카드는 상태(제출완료/임시저장/미작성/활성/비활성)를 색으로 즉시 식별 가능 |
| **액션 최소화** | 자주 쓰는 액션(조회·다운로드·제출)은 항상 상단 우측 고정 |
| **일관된 구조** | 모든 목록 페이지 = 필터 바 → 테이블 패널 → 페이지네이션 구조 유지 |

---

## 2. 색상 시스템

### 2.1 Primary Palette

| 역할 | 변수 | HEX | 사용처 |
|------|------|-----|--------|
| Primary | `--primary` | `#6b5ce7` | 버튼, 활성 메뉴, 링크, 강조 |
| Primary Dark | `--primary-dark` | `#5647cc` | 버튼 hover, focus |
| Primary BG | `--primary-bg` | `#ede9ff` | 배지 배경, 카드 아이콘 배경 |
| Accent | `--accent` | `#f5a623` | 로고 강조, 주의 레이블 |

### 2.2 Semantic Colors (상태 색상)

| 상태 | 변수 | HEX | 배경 변수 | 배경 HEX |
|------|------|-----|-----------|----------|
| 정상 (OK) | `--ok` | `#27ae60` | `--ok-bg` | `#e8f8f0` |
| 경고 (Warn) | `--warn` | `#e67e22` | `--warn-bg` | `#fff3e0` |
| 위험 (Danger) | `--danger` | `#e74c3c` | `--danger-bg` | `#fdecea` |

### 2.3 Neutral Colors (중립색)

| 역할 | 변수 | HEX |
|------|------|-----|
| 기본 텍스트 | `--text` | `#1c2333` |
| 보조 텍스트 | `--text-sub` | `#6c7a89` |
| 테두리 | `--gray-border` | `#e0e4ea` |
| 배경 (페이지) | `--gray-light` | `#f0f2f5` |
| 테이블 홀수 행 | `--row-alt` | `#f8f9fb` |
| 테이블 헤더 | `--tbl-header` | `#f4f6fa` |
| 흰색 | `--white` | `#ffffff` |

### 2.4 Sidebar Colors

| 역할 | 변수 | HEX |
|------|------|-----|
| 사이드바 배경 | `--sidebar-bg` | `#181d2e` |
| 메뉴 구분선 | `--sidebar-divider` | `#2a3045` |
| 활성 메뉴 배경 | `--sidebar-active` | `#252d48` |
| 비활성 메뉴 텍스트 | `--sidebar-text` | `#8896b3` |
| 메뉴 그룹 타이틀 | `--sidebar-menu-title` | `#4a5470` |
| 서브메뉴 활성 | `--sidebar-sub-active` | `#a89ef5` |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
font-family: 'Noto Sans KR', sans-serif;
```

```html
<!-- index.html <head> 에 추가 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 3.2 크기 체계

| 용도 | 크기 | 굵기 | 색상 |
|------|------|------|------|
| 페이지 제목 | `15px` | `700` | `--text` |
| 섹션 헤더 | `13px` | `600` | `--text` |
| 테이블 헤더 | `12px` | `600` | `--text-sub` |
| 기본 본문 | `13px` | `400` | `--text` |
| 테이블 데이터 | `12.5px` | `400` | `--text` |
| 보조 텍스트 | `12px` | `400` | `--text-sub` |
| 캡션 / 힌트 | `11px` | `400` | `--text-sub` |
| 배지 텍스트 | `11px` | `600` | 상태별 |
| 메뉴 그룹 타이틀 | `10px` | `600` | `var(--sidebar-menu-title)` |

---

## 4. 레이아웃 구조

### 4.1 전체 레이아웃

```
┌──────────┬────────────────────────────────────────┐
│          │  Header (48px)                          │
│ Sidebar  ├────────────────────────────────────────┤
│ (210px)  │                                         │
│          │  Content Area (padding: 18px 20px)      │
│          │  ┌──────────────────────────────────┐   │
│          │  │  Page Title                      │   │
│          │  ├──────────────────────────────────┤   │
│          │  │  Summary Cards (4-col grid)      │   │
│          │  ├──────────────────────────────────┤   │
│          │  │  Filter Bar                      │   │
│          │  ├──────────────────────────────────┤   │
│          │  │  Table Panel (flex: 1)           │   │
│          │  └──────────────────────────────────┘   │
└──────────┴────────────────────────────────────────┘
```

### 4.2 사이드바

```css
.sidebar {
  width: 210px;
  background: #181d2e;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
}

/* 로고 영역 */
.sidebar-logo {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--sidebar-divider);
  display: flex;
  align-items: center;
}

/* 메뉴 그룹 타이틀 */
.menu-group-title {
  padding: 8px 16px 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--sidebar-menu-title);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

/* 메뉴 아이템 */
.menu-item {
  padding: 7px 16px;
  font-size: 12.5px;
  color: var(--sidebar-text);
  border-left: 3px solid transparent;
  gap: 9px;
}
.menu-item.active {
  color: #ffffff;
  background: var(--sidebar-active);
  border-left-color: var(--primary);
  font-weight: 500;
}
```

### 4.3 헤더

```css
.header {
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid var(--gray-border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### 4.4 콘텐츠 영역

```css
.content {
  padding: 18px 20px;
  background: var(--gray-light);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
```

---

## 5. 컴포넌트 — 버튼

### 5.1 크기 및 형태

```css
/* 기본 버튼 공통 */
.btn {
  height: 30px;
  padding: 0 12px;
  border-radius: 5px;
  font-size: 12.5px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid transparent;
  transition: all 0.15s;
}
```

### 5.2 종류

| 종류 | 배경 | 텍스트 | 테두리 | hover |
|------|------|--------|--------|-------|
| **Primary** | `#6b5ce7` | `#fff` | `#6b5ce7` | `#5647cc` |
| **Outline** | `#fff` | `--text` | `--gray-border` | `--gray-light` 배경 |
| **Danger** | `#e74c3c` | `#fff` | `#e74c3c` | 어둡게 |
| **소형 (테이블 내)** | 위와 동일 | 동일 | 동일 | `height: 26px, font-size: 11px, padding: 0 8px` |

```tsx
// React 사용 예시
<button className="btn btn-primary">✓ 제출</button>
<button className="btn btn-outline">취소</button>
<button className="btn btn-danger">삭제 확인</button>

// 테이블 내 소형 버튼
<button className="btn btn-outline" style={{ height: 26, fontSize: 11, padding: '0 8px' }}>조회</button>
```

---

## 6. 컴포넌트 — 배지 (Badge)

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;   /* pill 형태 */
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
```

### 배지 종류

| 배지 | 배경 | 텍스트 | 사용처 |
|------|------|--------|--------|
| `badge-ok` | `#e8f8f0` | `#27ae60` | 제출완료, ACTIVE, 소속됨 |
| `badge-warn` | `#fff3e0` | `#e67e22` | 임시저장, PENDING |
| `badge-danger` | `#fdecea` | `#e74c3c` | 미작성, INACTIVE |
| `badge-blue` | `#e0f0ff` | `#1a6bb5` | 수행과제 |
| `badge-purple` | `#ede9ff` | `#6b5ce7` | 공통업무, APPROVED |
| `badge-gray` | `#f0f2f5` | `#6c7a89` | 미생성, 비활성 |

```tsx
// 주간업무 상태 배지 예시
<span className="badge badge-ok">
  <span className="badge-dot" /> 제출완료
</span>
<span className="badge badge-warn">
  <span className="badge-dot" /> 임시저장
</span>
<span className="badge badge-danger">
  <span className="badge-dot" /> 미작성
</span>
<span className="badge badge-gray">— 미생성</span>
```

---

## 7. 컴포넌트 — 입력 폼

### 7.1 공통 Input

```css
.form-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--gray-border);
  border-radius: 5px;
  font-size: 12.5px;
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
}
.form-input:focus   { border-color: var(--primary); }
.form-input.error   { border-color: var(--danger); }
.form-input.readonly {
  background: var(--tbl-header);
  cursor: default;
}
```

### 7.2 Select

```css
.form-select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--gray-border);
  border-radius: 5px;
  font-size: 12.5px;
  background: white;
  cursor: pointer;
}
.form-select:focus { border-color: var(--primary); }
```

### 7.3 필터 바용 Select / Input (약간 더 낮음)

```css
.filter-select {
  height: 30px;  /* 필터 바에서는 30px */
  padding: 0 10px;
  border: 1px solid var(--gray-border);
  border-radius: 5px;
  font-size: 12.5px;
}
```

### 7.4 폼 레이아웃 (모달 내)

```css
/* 라벨 90px 고정, 입력 flex:1 */
.form-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: center;
  gap: 10px;
}
.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-sub);
  white-space: nowrap;
}
.form-label .req { color: var(--danger); margin-left: 2px; }
```

---

## 8. 컴포넌트 — 테이블

### 8.1 테이블 패널 구조

```
┌─────────────────────────────────────────────┐
│  Panel Header: 제목 + 건수 + 액션 버튼       │  padding: 11px 16px
├─────────────────────────────────────────────┤
│  Table (thead + tbody)                      │
├─────────────────────────────────────────────┤
│  Pagination                                 │  padding: 10px 16px
└─────────────────────────────────────────────┘
```

### 8.2 CSS

```css
/* 패널 */
.table-panel {
  background: #ffffff;
  border: 1px solid var(--gray-border);
  border-radius: 8px;
  overflow: hidden;
}

/* 헤더 */
thead th {
  background: var(--tbl-header);
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--gray-border);
}

/* 바디 */
tbody td {
  padding: 9px 12px;
  font-size: 12.5px;
  color: var(--text);
  border-bottom: 1px solid var(--gray-light);
}
tbody tr:hover         { background: #f5f7ff; }

/* 홀수 행 강조 (선택적) */
tbody tr:nth-child(odd) { background: var(--row-alt); }
tbody tr:nth-child(odd):hover { background: #f0f3ff; }
```

### 8.3 행 상태 강조

```css
/* 미작성 팀원 행 경고 강조 */
tbody tr.warn-row          { background: #fff8f0; }
tbody tr.warn-row:hover    { background: #ffefd9; }
```

---

## 9. 컴포넌트 — 카드

### 9.1 요약 카드 (Summary Card, 4-col)

```css
.sum-card {
  background: #ffffff;
  border: 1px solid var(--gray-border);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-icon {
  width: 40px; height: 40px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.card-label { font-size: 11px; color: var(--text-sub); }
.card-value { font-size: 22px; font-weight: 700; color: var(--text); }
.card-sub   { font-size: 10.5px; color: var(--text-sub); }
```

### 9.2 아이콘 배경색

| 카드 | 아이콘 배경 |
|------|------------|
| 전체 팀원 | `#eef2ff` |
| 제출 완료 | `#e8f8f0` |
| 임시저장 | `#fff3e0` |
| 미작성 | `#fdecea` |

---

## 10. 컴포넌트 — 모달

### 10.1 오버레이

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(1px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
```

### 10.2 모달 박스

```css
.modal {
  background: #ffffff;
  border-radius: 10px;
  width: 480px;           /* 일반 폼 모달 */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modalIn 0.2s ease-out;
}
.confirm-modal { width: 360px; }  /* 확인 다이얼로그 */

@keyframes modalIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* 헤더 */
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-border);
  display: flex; align-items: center; justify-content: space-between;
}
.modal-title { font-size: 14px; font-weight: 700; }

/* 바디 */
.modal-body  { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

/* 푸터 */
.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--gray-border);
  display: flex; justify-content: flex-end; gap: 8px;
}
```

### 10.3 확인 다이얼로그 구조

```
┌─────────────────────────┐
│  모달 제목 · X           │  ← modal-header
├─────────────────────────┤
│    아이콘 (36px)         │
│    타이틀 (14px bold)    │
│    설명 (12.5px gray)    │  ← confirm-body (text-center)
│    [선택 입력 필드]       │
├─────────────────────────┤
│      [취소] [위험 버튼]  │  ← modal-footer
└─────────────────────────┘
```

---

## 11. 컴포넌트 — 토스트 알림

```css
.toast {
  background: white;
  border: 1px solid var(--gray-border);
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 280px;
  display: flex; align-items: flex-start; gap: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  animation: toastIn 0.25s ease-out;
}
@keyframes toastIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

### 좌측 색상 줄 (종류별)

| 종류 | border-left 색상 |
|------|-----------------|
| 성공 | `3px solid #27ae60` |
| 경고 | `3px solid #e67e22` |
| 정보 | `3px solid #6b5ce7` |
| 위험 | `3px solid #e74c3c` |

```css
/* 위치: 우상단 고정 */
.toast-wrap {
  position: fixed;
  top: 60px; right: 20px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 2000;
}
```

```
아이콘(16px)  |  제목(13px bold) + 메시지(12px gray)
```

---

## 12. 컴포넌트 — 페이지네이션

```css
.pagination {
  padding: 10px 16px;
  border-top: 1px solid var(--gray-border);
  display: flex; align-items: center;
  justify-content: flex-end; gap: 3px;
}
.pg-btn {
  width: 26px; height: 26px;
  border: 1px solid var(--gray-border);
  border-radius: 4px;
  background: white;
  font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.pg-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.page-info {
  font-size: 12px;
  color: var(--text-sub);
  margin-right: 8px;
}
```

---

## 13. 상태별 시각 규칙

### 13.1 주간업무 상태

| 상태 | 배지 | 행 배경 | 설명 |
|------|------|---------|------|
| SUBMITTED (제출완료) | `badge-ok` | 기본 | 해당 주차 보고서 제출 완료 |
| DRAFT (임시저장) | `badge-warn` | `#fff8f0` 주황 강조 | 작성 중, 미제출 |
| NOT_STARTED (미작성) | `badge-danger` | 기본 (텍스트 회색) | 아직 보고서 미생성 |

### 13.2 계정 상태

| 상태 | 배지 | 설명 |
|------|------|------|
| PENDING | `badge-warn` | 승인 대기 중 |
| APPROVED | `badge-purple` | 승인 완료 |
| ACTIVE | `badge-ok` | 정상 활성 계정 |
| INACTIVE | `badge-danger` | 비활성(소프트 삭제) 계정 |

### 13.3 팀 / 프로젝트 상태

| 상태 | 배지 | 설명 |
|------|------|------|
| ACTIVE | `badge-ok` | 진행 중 / 활성 |
| HOLD | `badge-warn` | 보류 중 |
| COMPLETED | `badge-gray` | 완료(비활성) |

### 13.4 자동 저장 인디케이터

```css
/* 자동 저장 중 살아있는 점 */
.autosave-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #27ae60;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
```

---

## 14. CSS 변수 전체 목록

```css
:root {
  /* Primary */
  --primary:      #6b5ce7;
  --primary-dark: #5647cc;
  --primary-bg:   #ede9ff;
  --accent:       #f5a623;

  /* Semantic */
  --ok:           #27ae60;
  --ok-bg:        #e8f8f0;
  --warn:         #e67e22;
  --warn-bg:      #fff3e0;
  --danger:       #e74c3c;
  --danger-bg:    #fdecea;

  /* Neutral */
  --gray:         #6c7a89;
  --gray-light:   #f0f2f5;
  --gray-border:  #e0e4ea;
  --text:         #1c2333;
  --text-sub:     #6c7a89;
  --white:        #ffffff;
  --row-alt:      #f8f9fb;
  --tbl-header:   #f4f6fa;

  /* Sidebar */
  --sidebar-bg:           #181d2e;
  --sidebar-w:            210px;
  --sidebar-active:       #252d48;
  --sidebar-divider:      #2a3045;
  --sidebar-text:         #8896b3;
  --sidebar-menu-title:   #4a5470;
  --sidebar-sub-active:   #a89ef5;

  /* Badge */
  --badge-blue-bg:   #e0f0ff;
  --badge-blue-text: #1a6bb5;

  /* Layout */
  --header-h:     48px;
  --content-gap:  14px;
  --content-pad:  18px 20px;
}
```

---

*주간업무보고 시스템 — Web Style Guide v2.0 / 2026년 3월 확정*
