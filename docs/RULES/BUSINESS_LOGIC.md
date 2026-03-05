# 핵심 비즈니스 로직

> 이 파일은 비즈니스 로직 관련 작업 시 참조한다.

---

## 1. 전주 할일 → 이번주 한일 불러오기 (carry-forward)
```
POST /api/v1/weekly-reports/carry-forward
Body: { "targetWeek": "2026-W09", "sourceWorkItemIds": ["id1", "id2"] }

1. 전주(W08) WeeklyReport에서 선택된 WorkItem 조회
2. 이번주(W09) WeeklyReport 생성 (없으면 새로 생성)
3. 각 WorkItem의 planWork → 새 WorkItem의 doneWork로 복사
   - projectId 유지, planWork·remarks는 빈 값
4. 생성된 WorkItem 목록 반환
```

---

## 2. 자동저장 (Autosave) 흐름
```
셀 편집 완료 (onBlur)
  → Zustand gridStore 즉시 업데이트 (UI 반영)
  → Debounce 500ms
  → TanStack Query mutation: PATCH /api/v1/work-items/:id
  → 성공: 캐시 무효화 + 저장 표시 | 실패: 롤백 + 토스트 알림
```

---

## 3. 취합보고 행 병합 (merge-rows)
```
POST /api/v1/summaries/:id/merge-rows

1. 해당 파트/팀 멤버들의 WeeklyReport(해당 주차) 전체 조회
2. WorkItem을 Project별로 그룹화
3. 동일 프로젝트의 doneWork, planWork를 줄바꿈으로 병합
4. SummaryWorkItem으로 생성 → 파트장/팀장이 편집 가능
```

---

## 4. 역할별 접근 권한 (RBAC)

| API 그룹 | ADMIN | LEADER (팀장) | PART_LEADER (파트장) | MEMBER (팀원) |
|----------|:---:|:---:|:---:|:---:|
| 계정 관리 (승인/초기화) | ✅ | ❌ | ❌ | ❌ |
| 팀 상태 관리 (승인) | ✅ | ❌ | ❌ | ❌ |
| 전역 프로젝트 관리 | ✅ | ❌ | ❌ | ❌ |
| 본인 주간업무 CRUD | ✅ | ✅ | ✅ | ✅ |
| 소속 파트원 업무 조회 | ✅ 전체 | ✅ 전체 | ✅ 소속 파트만 | ❌ |
| 파트 취합보고 작성 | ❌ | ❌ | ✅ 소속 파트만 | ❌ |
| 팀 전체 조회 | ✅ | ✅ | ❌ | ❌ |
| 팀·파트·프로젝트 관리 | ✅ | ✅ | ❌ | ❌ |
| Excel 내보내기 | ✅ | ✅ | ✅ 소속 파트 | ❌ |

---

## 5. 업무 작성 서식 규칙
진행업무, 예정업무 셀의 텍스트는 아래 패턴으로 구조화 렌더링한다.

| 입력 패턴 | 의미 | 렌더링 |
|----------|------|--------|
| `[텍스트]` | 업무항목 (1단계) | 볼드, Primary 색상 |
| `*텍스트` | 세부업무 (2단계) | 불릿(•) 변환, 1단 들여쓰기 |
| `ㄴ텍스트` | 상세작업 (3단계) | 2단 들여쓰기, 보조 텍스트 색상 |

---

## 6. 회원가입 및 계정 승인 프로세스
```
1. POST /api/v1/auth/register
   → Member 생성 (accountStatus: PENDING, mustChangePassword: true)

2. Admin이 PATCH /api/v1/admin/accounts/:id/status
   → PENDING → APPROVED → ACTIVE 단계 전환

3. 로그인 시 mustChangePassword: true이면 비밀번호 변경 강제
   → POST /api/v1/auth/change-password 호출 필수

4. 비밀번호 변경 완료 후 정상 로그인 (mustChangePassword: false)
```

---

## 7. 팀 생성 신청 및 승인 프로세스
```
1. POST /api/v1/teams/request
   → Team 생성 (teamStatus: PENDING, requestedById: memberId)

2. Admin이 PATCH /api/v1/admin/teams/:id/status
   → PENDING → APPROVED 전환

3. 승인 시 신청자를 LEADER로 설정 + TeamMembership 생성

4. APPROVED → ACTIVE 전환 후 정상 사용
```

---

## 8. 팀 가입 신청 프로세스
```
1. POST /api/v1/teams/:teamId/join
   → TeamJoinRequest 생성 (status: PENDING)

2. 팀장/파트장이 PATCH /api/v1/teams/:teamId/join-requests/:id 처리

3. 승인(APPROVED) 시
   → TeamMembership 생성 (roles: [MEMBER])

4. 거절(REJECTED) 시
   → 상태만 변경 (재신청 가능)
```

---

## 9. 다중 팀 소속 구조
```
Member (1)
  ├─ accountStatus — 전역 계정 상태
  └─ teamMemberships (M) — 팀별 멤버십
     ├─ teamId (FK) — 소속 팀
     ├─ partId (FK) — 팀 내 파트
     └─ roles[] — 팀별 역할 (LEADER/PART_LEADER/MEMBER)

- currentTeamId: teamStore에서 관리, 팀 전환 시 변경
- API 호출 시 currentTeamId를 파라미터로 전달
- 팀 범위 API는 반드시 teamStore.currentTeamId 사용 (authStore 사용 금지)
```
