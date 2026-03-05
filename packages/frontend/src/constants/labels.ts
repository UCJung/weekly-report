/**
 * 공통 라벨/배리언트 상수
 * 여러 페이지에서 공유하는 역할명, 상태명, 배지 배리언트를 한 곳에서 관리한다.
 */

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: '관리자',
  LEADER: '팀장',
  PART_LEADER: '파트장',
  MEMBER: '팀원',
};

export const REPORT_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: '제출완료',
  DRAFT: '임시저장',
  NOT_STARTED: '미작성',
};

export const REPORT_STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'danger' | 'gray'> = {
  SUBMITTED: 'ok',
  DRAFT: 'warn',
  NOT_STARTED: 'gray',
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  PENDING: '승인대기',
  ACTIVE: '활성',
  INACTIVE: '비활성',
};

export const POSITION_LABEL: Record<string, string> = {
  DIRECTOR: '이사',
  GENERAL_MANAGER: '부장',
  DEPUTY_MANAGER: '차장',
  ASSISTANT_MANAGER: '대리',
  STAFF: '사원',
  PRINCIPAL_RESEARCHER: '책임연구원',
  SENIOR_RESEARCHER: '선임연구원',
  RESEARCHER: '연구원',
  ASSOCIATE_RESEARCHER: '전임연구원',
};

export const ATTENDANCE_LABEL: Record<string, string> = {
  WORK: '근무',
  HOLIDAY_WORK: '휴일근무',
  ANNUAL_LEAVE: '연차',
  HALF_DAY_LEAVE: '반차',
  HOLIDAY: '공휴일',
};

export const WORK_TYPE_LABEL: Record<string, string> = {
  OFFICE: '내근',
  FIELD: '외근',
  REMOTE: '재택',
  BUSINESS_TRIP: '출장',
};

export const TIMESHEET_STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성중',
  SUBMITTED: '제출완료',
  APPROVED: '승인완료',
  REJECTED: '반려',
};

export const TIMESHEET_STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'danger' | 'gray'> = {
  DRAFT: 'gray',
  SUBMITTED: 'warn',
  APPROVED: 'ok',
  REJECTED: 'danger',
};

/**
 * @deprecated PersonalTask.status 는 statusId + taskStatus 로 대체되었습니다.
 * TaskStatusDef.name 을 직접 사용하세요.
 */
export const TASK_STATUS_LABEL: Record<string, string> = {
  TODO: '할일',
  IN_PROGRESS: '진행중',
  DONE: '완료',
};

/**
 * @deprecated PersonalTask.status 는 statusId + taskStatus 로 대체되었습니다.
 * TaskStatusDef.color 를 직접 사용하세요.
 */
export const TASK_STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'danger' | 'gray'> = {
  TODO: 'gray',
  IN_PROGRESS: 'warn',
  DONE: 'ok',
};

export const TASK_PRIORITY_LABEL: Record<string, string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

export const TASK_PRIORITY_VARIANT: Record<string, 'ok' | 'warn' | 'danger' | 'gray'> = {
  HIGH: 'danger',
  MEDIUM: 'warn',
  LOW: 'gray',
};
