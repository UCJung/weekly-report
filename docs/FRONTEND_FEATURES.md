# UC TeamSpace — 프론트엔드 기능 명세서

> 최종 업데이트: 2026-03-03
> 기술 스택: React 18 + TypeScript 5 + Vite 6 + Tailwind CSS 3

## 목차
1. 시스템 개요
2. 사용자 역할 및 접근 권한
3. 페이지별 기능 명세
4. 공통 컴포넌트
5. 상태 관리
6. API 연동

---

## 1. 시스템 개요
- 주간업무보고를 디지털화한 웹 애플리케이션
- 역할 기반 접근 제어 (ADMIN / LEADER / PART_LEADER / MEMBER)
- 다중 팀 소속 지원, 팀별 프로젝트 관리
- URL 기반 라우팅, JWT 인증, 자동저장

## 2. 사용자 역할 및 접근 권한

### 역할 정의
| 역할 | 설명 |
|------|------|
| ADMIN | 시스템 관리자 — 계정 승인, 팀 승인, 전역 프로젝트 관리 |
| LEADER | 팀장 — 팀 전체 업무 조회, 취합보고, 팀/파트/프로젝트 관리 |
| PART_LEADER | 파트장 — 소속 파트 업무 조회, 파트 취합보고 |
| MEMBER | 팀원 — 개인 주간업무 작성 및 제출 |

### 페이지별 접근 권한 매트릭스
| 페이지 | 경로 | ADMIN | LEADER | PART_LEADER | MEMBER |
|--------|------|:---:|:---:|:---:|:---:|
| 로그인 | /login | ✅ | ✅ | ✅ | ✅ |
| 계정 신청 | /register | ✅ | ✅ | ✅ | ✅ |
| 대시보드 | / | — | ✅ | ✅ | ✅ |
| 팀 선택 | /teams | — | ✅ | ✅ | ✅ |
| 내 주간업무 | /my-weekly | — | ✅ | ✅ | ✅ |
| 업무현황 | /part-status | — | ✅ | ✅ | — |
| 보고서 취합 | /report-consolidation | — | ✅ | ✅ | — |
| 팀·파트 관리 | /team-mgmt | — | ✅ | — | — |
| 프로젝트 관리 | /project-mgmt | — | ✅ | — | — |
| 계정 관리 | /admin/accounts | ✅ | — | — | — |
| 팀 관리 | /admin/teams | ✅ | — | — | — |
| 프로젝트 관리 (Admin) | /admin/projects | ✅ | — | — | — |

## 3. 페이지별 기능 명세

### 3.1 로그인 (`/login`)
- 이메일 + 비밀번호 입력
- JWT 토큰 발급 (Access + Refresh)
- 첫 로그인 시 비밀번호 변경 강제 (mustChangePassword)
- 역할별 리다이렉트: ADMIN → /admin, 일반 → /

### 3.2 계정 신청 (`/register`)
- 성명, 이메일, 비밀번호 입력
- 비밀번호 8자 이상 + 확인 일치 검증
- 신청 완료 후 "관리자 승인 대기" 안내

### 3.3 대시보드 (`/`)
**접근**: LEADER, PART_LEADER

**기능:**
- 주차 탐색 (◀ 이전 주 | 주차명 | 다음 주 ▶)
- 요약 카드 4개:
  - 전체 팀원 수
  - 제출 완료 인원 (초록 배지)
  - 임시저장 인원 (주황 배지 + 이름 목록)
  - 미작성 인원 (빨강 배지)
- 팀원 작성 현황 테이블:
  - 컬럼: 파트 | 성명 | 역할 | 업무항목 수 | 작성 상태 | 최종 수정
  - 미작성 행 danger-bg 강조
- 보고서 취합 현황 테이블 (LEADER만):
  - 컬럼: 파트 | 파트장 | 취합 상태 | 팀원 제출률 (진행률 바)
- Excel 내보내기 (LEADER)

### 3.4 팀 선택 (`/teams`)
**접근**: 모든 인증 사용자

**기능:**
- 내 소속팀 빠른 선택 (상단 탭)
- 팀 검색 (팀명)
- 필터: 전체 / 소속팀 / 미소속팀
- 팀 목록: 팀명 | 팀장 | 인원 수 | 소속 여부
  - 소속팀: "소속됨" 표시 + "선택" 버튼
  - 미소속팀: "멤버 신청" 버튼
- 팀 생성 신청: 팀명 + 설명 입력 모달

### 3.5 내 주간업무 (`/my-weekly`)
**접근**: 모든 인증 사용자 (핵심 기능)

**기능:**
- 주차 탐색
- 주간업무 생성 (미존재 시)
- EditableGrid — 프로젝트별 인라인 그리드 편집:
  - 진행업무(한일) | 예정업무(할일) | 비고 3컬럼
  - 셀 클릭 → TextArea 인라인 편집
  - 자동저장 (500ms debounce, 낙관적 업데이트)
  - 행 추가/삭제
- 프로젝트 추가 모달 (미등록 프로젝트 선택)
- 프로젝트 제거 (해당 프로젝트 업무항목 전체 삭제)
- 전주 불러오기:
  - 전주 할일 → 이번주 한일로 변환
  - 프로젝트별 그룹화 체크박스
  - 전체 선택/해제
- 업무 서식 렌더링: [항목] / *세부 / -상세 3단계
- 제출 → 읽기 전용 전환
- 재편집 → DRAFT 복귀

### 3.6 업무현황 (`/part-status`)
**접근**: LEADER, PART_LEADER

**기능:**
- 필터 바: 주차 | 파트 | 팀원 | 프로젝트 | 초기화
- 보기 모드 전환:
  - 프로젝트별: 프로젝트 rowspan 병합
  - 팀원별: 팀원 rowspan 병합
- 테이블: 프로젝트/팀원 | 파트 | 진행업무 | 예정업무 | 비고
- FormattedText 서식 렌더링
- 건수 표시

### 3.7 보고서 취합 (`/report-consolidation`)
**접근**: LEADER, PART_LEADER

**기능:**
- 범위 선택 (LEADER: 전체/파트, PART_LEADER: 소속 파트)
- 주차 탐색
- 불러오기: 팀원 업무 자동 취합 (프로젝트별 병합)
- 행 선택 + 병합 (같은 프로젝트 2개 이상)
- GridCell 인라인 편집 (자동저장)
- 행 삭제
- 제출 → 읽기 전용 (프로젝트 rowspan 병합)
- 재편집 → DRAFT 복귀
- Excel 다운로드

### 3.8 팀·파트 관리 (`/team-mgmt`)
**접근**: LEADER

**기능:**
- **팀원 관리 탭:**
  - 파트/검색 필터
  - 팀원 테이블: 순서(⠿) | 이름 | 이메일 | 파트 | 역할 | 상태 | 수정
  - 드래그 앤 드롭 순서 변경 (dnd-kit)
  - 팀원 등록/수정 모달 (역할 다중 선택)
  - 멤버 가입 신청 관리 (승인 시 파트 배정, 거절)
- **파트 관리 탭:**
  - 파트 테이블 (드래그 순서 변경)

### 3.9 프로젝트 관리 (`/project-mgmt`)
**접근**: LEADER

**기능:**
- 요약 카드: 총 프로젝트 | 공통업무 | 수행과제 | 사용중/사용안함
- 분류 필터 (전체/공통/수행)
- 프로젝트 테이블: 순서(⠿) | 프로젝트명 | 코드 | 분류 | 상태 | 해제
- 드래그 앤 드롭 순서 변경
- 프로젝트 추가 모달 (전역 프로젝트에서 검색 + 다중 선택)
- 프로젝트 해제

### 3.10 Admin: 계정 관리 (`/admin/accounts`)
**접근**: ADMIN

**기능:**
- 상태별 필터 탭 (전체/신청/승인/사용중/종료)
- 계정 테이블: 이름 | 이메일 | 상태 | 신청일 | 액션
- 상태 전이: PENDING → APPROVED → ACTIVE ↔ INACTIVE
- PW 초기화 (확인 모달)

### 3.11 Admin: 팀 관리 (`/admin/teams`)
**접근**: ADMIN

**기능:**
- 상태별 필터 탭 (전체/신청/승인/사용중/종료)
- 팀 테이블: 팀명 | 신청자 | 상태 | 인원 | 신청일 | 액션
- 상태 전이: PENDING → APPROVED → ACTIVE ↔ INACTIVE
- 승인 시 신청자 LEADER 자동 설정

### 3.12 Admin: 프로젝트 관리 (`/admin/projects`)
**접근**: ADMIN

**기능:**
- 분류/상태 필터
- 프로젝트 테이블: 프로젝트명 | 코드 | 분류 | 상태 | 액션
- 프로젝트 생성 모달 (프로젝트명, 코드, 분류)
- 프로젝트 수정 모달
- 상태 전이: ACTIVE ↔ INACTIVE

## 4. 공통 컴포넌트

### 4.1 Grid 컴포넌트 (`components/grid/`)
| 컴포넌트 | 용도 |
|---------|------|
| EditableGrid | TanStack Table 기반 편집 그리드 (주간업무 작성) |
| GridCell | 인라인 편집 셀 (TextArea, 자동 높이, Ctrl+Enter) |
| FormattedText | [항목]/*세부/-상세 서식 렌더링 (읽기 전용) |
| ExpandedEditor | 확대 편집 패널 (F2 키) |
| ProjectDropdown | 프로젝트 선택 드롭다운 |
| ProjectSelectModal | 프로젝트 추가 모달 |

### 4.2 UI 컴포넌트 (`components/ui/`)
| 컴포넌트 | 용도 |
|---------|------|
| Badge | 상태/역할/분류 배지 (variant: ok/warn/danger/blue/purple/gray) |
| Button | 모든 버튼 (variant: primary/outline/ghost/ghost-danger, size: sm/md/lg) |
| Modal / ConfirmModal | 일반 모달 + 확인 다이얼로그 |
| Input / Label / Select | 폼 입력 요소 |
| Table (TableHeader/Body/Row/Cell) | 공통 테이블 |
| SummaryCard | 요약 카드 (아이콘 + 수치) |
| ChangePasswordModal | 비밀번호 변경 |
| TeamCreateRequestModal | 팀 생성 신청 |

### 4.3 Layout 컴포넌트 (`components/layout/`)
| 컴포넌트 | 용도 |
|---------|------|
| AppLayout | 인증 사용자 레이아웃 (Sidebar + Header + Content) |
| AdminLayout | Admin 전용 레이아웃 |
| Sidebar | 좌측 네비게이션 (역할별 메뉴, 팀 전환, 프로필) |
| Header | 상단 헤더 (페이지 제목 + 날짜) |

## 5. 상태 관리

### 5.1 Zustand 스토어
| 스토어 | 상태 | 역할 |
|--------|------|------|
| authStore | user, accessToken, refreshToken | 인증 정보, JWT 토큰 |
| teamStore | currentTeamId | 현재 선택 팀 (팀 전환) |
| gridStore | focusedCell, editingValue, dirtyMap, isSaving | 그리드 편집 상태 |
| uiStore | toasts[] | UI 토스트 알림 |

### 5.2 TanStack Query 캐시 전략
| 데이터 유형 | staleTime | 설명 |
|------------|-----------|------|
| 주간업무/Admin | 30초 | 자주 변경되는 데이터 |
| 팀/파트/프로젝트 | 60초 | 비교적 안정적 데이터 |

## 6. API 연동 (`api/`)

| 모듈 | 파일 | 담당 |
|------|------|------|
| client | client.ts | Axios 인스턴스 + JWT 인터셉터 (자동 토큰 갱신) |
| auth | auth.api.ts | 로그인, 회원가입, 토큰 갱신, 비밀번호 변경 |
| team | team.api.ts | 팀 목록, 파트, 팀원, 가입 신청, 정렬 |
| project | project.api.ts | 전체 프로젝트, 팀 프로젝트 관리 |
| weekly-report | weekly-report.api.ts | 주간업무 CRUD, 전주 불러오기 |
| part | part.api.ts | 파트 현황, 취합보고 CRUD |
| export | export.api.ts | Excel 다운로드 |
| admin | admin.api.ts | Admin 계정/팀/프로젝트 관리 |
