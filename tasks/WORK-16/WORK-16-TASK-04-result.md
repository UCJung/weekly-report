# WORK-16-TASK-04 수행 결과 보고서

> 작업일: 2026-03-03
> 작업자: Claude Code
> 상태: **완료**

---

## 1. 작업 개요

WorkItemService에 INACTIVE 프로젝트 제약을 적용하였다.
WorkItem 생성/수정 시 대상 프로젝트가 INACTIVE이면 422 오류를 반환한다.

---

## 2. 완료 기준 달성 현황

| 항목 | 상태 |
|------|------|
| create() INACTIVE 프로젝트 체크 | ✅ |
| update() 프로젝트 변경 시 INACTIVE 체크 | ✅ |
| verifyProjectActive() private 메서드 | ✅ |
| PROJECT_INACTIVE 에러코드 422 응답 | ✅ |
| 단위 테스트 추가 및 통과 | ✅ |
| 빌드 성공 | ✅ |

---

## 3. 체크리스트 완료 현황

| 항목 | 완료 |
|------|------|
| WorkItemService.create()에 INACTIVE 체크 추가 | ✅ |
| WorkItemService.update()에 프로젝트 변경 시 INACTIVE 체크 추가 | ✅ |
| verifyProjectActive() private 메서드 구현 | ✅ |
| work-item.service.spec.ts PROJECT_INACTIVE 테스트 추가 | ✅ |

---

## 4. 발견 이슈 및 수정 내역

### 이슈 #1 — work-item.service.spec.ts project mock 누락

**증상**: `create()` 테스트에서 `verifyProjectActive()` 호출 시 `mockPrisma.project` 가 undefined

**원인**: 기존 spec 파일에 `project.findUnique` mock이 없었음

**수정**: mockPrisma에 `project.findUnique` mock 추가, beforeEach에서 ACTIVE 상태 기본값 설정

---

## 5. 최종 검증 결과

```
# 빌드 성공
$ nest build (오류 없음)

# 테스트 결과
 90 pass
 0 fail
 162 expect() calls
Ran 90 tests across 10 files.
```

---

## 7. 산출물 목록

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `packages/backend/src/weekly-report/work-item.service.ts` | INACTIVE 프로젝트 제약 추가, verifyProjectActive() 메서드 |
| `packages/backend/src/weekly-report/work-item.service.spec.ts` | project mock 추가, PROJECT_INACTIVE 테스트 케이스 추가 |
