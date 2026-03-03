// ──────────── Enums (Prisma 스키마와 동기화) ────────────

export type Position =
  | 'DIRECTOR'
  | 'GENERAL_MANAGER'
  | 'DEPUTY_MANAGER'
  | 'ASSISTANT_MANAGER'
  | 'STAFF'
  | 'PRINCIPAL_RESEARCHER'
  | 'SENIOR_RESEARCHER'
  | 'RESEARCHER'
  | 'ASSOCIATE_RESEARCHER';

export type AttendanceType =
  | 'WORK'
  | 'HOLIDAY_WORK'
  | 'ANNUAL_LEAVE'
  | 'HALF_DAY_LEAVE'
  | 'HOLIDAY';

export type WorkType =
  | 'OFFICE'
  | 'FIELD'
  | 'REMOTE'
  | 'BUSINESS_TRIP';

export type TimesheetStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export type ApprovalType =
  | 'LEADER'
  | 'PROJECT_MANAGER'
  | 'ADMIN';

// ──────────── 엔티티 인터페이스 ────────────

export interface TimesheetWorkLog {
  id: string;
  entryId: string;
  projectId: string;
  hours: number;
  workType: WorkType;
  project?: { id: string; name: string; code: string };
}

export interface TimesheetEntry {
  id: string;
  timesheetId: string;
  date: string; // ISO date string "2026-03-01"
  attendance: AttendanceType;
  workLogs: TimesheetWorkLog[];
}

export interface TimesheetApproval {
  id: string;
  timesheetId: string;
  approverId: string;
  approvalType: ApprovalType;
  status: TimesheetStatus;
  comment?: string | null;
  approvedAt?: string | null;
  autoApproved: boolean;
  approver?: { id: string; name: string };
}

export interface MonthlyTimesheet {
  id: string;
  memberId: string;
  teamId: string;
  yearMonth: string; // "2026-03"
  status: TimesheetStatus;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ──────────── 조인 응답 타입 ────────────

export interface TimesheetWithEntries extends MonthlyTimesheet {
  entries: TimesheetEntry[];
  approvals: TimesheetApproval[];
  member?: { id: string; name: string; position?: string | null };
}

// ──────────── 팀장 취합 요약 행 ────────────

export interface TeamTimesheetSummaryRow {
  memberId: string;
  memberName: string;
  position?: string | null;
  status: TimesheetStatus;
  totalHours: number;
  submittedAt?: string | null;
  projectHours: Record<string, number>; // projectId → hours
}

// ──────────── PM 프로젝트 투입 행 ────────────

export interface ProjectAllocationRow {
  memberId: string;
  memberName: string;
  position?: string | null;
  totalHours: number;
  ratio: number; // 0~100 (%)
  monthlyHours?: Record<string, number>; // "2026-01" → hours (연간 뷰)
}

// ──────────── 관리자 현황 행 ────────────

export interface AdminTimesheetOverviewRow {
  teamId: string;
  teamName: string;
  totalMembers: number;
  submittedCount: number;
  approvedCount: number;
  leaderApproved: boolean;
  adminApproved: boolean;
}
