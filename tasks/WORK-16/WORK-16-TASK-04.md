# WORK-16-TASK-04: 주간업무 프로젝트 상태 제약 적용

> WORK: WORK-16 프로젝트 관리 프로세스 구조 변경
> 의존: WORK-16-TASK-02, WORK-16-TASK-03

---

## 목표

WorkItem 생성/수정 시 INACTIVE 프로젝트 제약을 적용한다.

---

## 체크리스트

- [ ] `WorkItemService.create()`: projectId가 있으면 INACTIVE 체크
- [ ] `WorkItemService.update()`: projectId 변경 시 새 프로젝트가 INACTIVE이면 거부
- [ ] `verifyProjectActive()` private 메서드 추가
- [ ] `PROJECT_INACTIVE` 에러코드로 422 응답
- [ ] `work-item.service.spec.ts` INACTIVE 제약 테스트 추가
