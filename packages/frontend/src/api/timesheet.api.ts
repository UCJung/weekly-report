import apiClient from './client';
import type { TimesheetWithEntries } from '@uc-teamspace/shared';

export interface SaveEntryData {
  attendance: string;
  workLogs: { projectId: string; hours: number; workType: string }[];
}

export interface BatchSaveEntry {
  entryId: string;
  attendance: string;
  workLogs: { projectId: string; hours: number; workType: string }[];
}

// ──────────── 팀장 API 타입 ────────────

export interface TeamMemberStatusRow {
  memberId: string;
  memberName: string;
  position: string | null;
  jobTitle: string | null;
  partId: string | null;
  partName: string | null;
  timesheetId: string | null;
  status: string;
  totalWorkHours: number;
  workDays: number;
  leaderApproval: {
    status: string;
    approver: { id: string; name: string } | null;
    approvedAt: string | null;
    comment: string | null;
  } | null;
  adminApproval: {
    status: string;
    approver: { id: string; name: string } | null;
    approvedAt: string | null;
  } | null;
  submittedAt: string | null;
}

export interface TeamSummaryProject {
  id: string;
  name: string;
  code: string;
}

export interface TeamSummaryMatrixRow {
  memberId: string;
  memberName: string;
  position: string | null;
  jobTitle: string | null;
  partId: string | null;
  partName: string | null;
  timesheetId: string;
  status: string;
  totalHours: number;
  projectBreakdown: { projectId: string; hours: number; ratio: number }[];
}

export interface TeamSummaryData {
  projects: TeamSummaryProject[];
  matrix: TeamSummaryMatrixRow[];
}

// ──────────── PM API 타입 ────────────

export interface ProjectAllocationMember {
  memberId: string;
  memberName: string;
  position: string | null;
  totalHours: number;
  memberTotalHours: number;
  ratio: number;
  pmApproval: {
    status: string;
    approvedAt: string | null;
    autoApproved: boolean;
  } | null;
}

export interface ProjectAllocationMonthlyData {
  project: { id: string; name: string; code: string; managerId: string | null };
  yearMonth: string;
  totalProjectHours: number;
  memberCount: number;
  members: ProjectAllocationMember[];
}

export interface ProjectAllocationYearlyMonth {
  yearMonth: string;
  totalHours: number;
  memberCount: number;
}

export interface ProjectAllocationYearlyData {
  project: { id: string; name: string; code: string; managerId: string | null };
  year: string;
  months: ProjectAllocationYearlyMonth[];
}

export interface ProjectAllocationSummaryItem {
  projectId: string;
  projectName: string;
  projectCode: string;
  memberCount: number;
  totalHours: number;
  avgHours: number;
  pmApprovalStatus: string;
}

export interface ProjectAllocationSummaryData {
  yearMonth: string;
  projects: ProjectAllocationSummaryItem[];
}

// ──────────── 관리자 API 타입 ────────────

export interface AdminTeamOverviewRow {
  teamId: string;
  teamName: string;
  totalMembers: number;
  notStarted: number;
  draft: number;
  submitted: number;
  leaderApproved: number;
  adminApproved: number;
}

export interface AdminGrandTotal {
  totalMembers: number;
  notStarted: number;
  draft: number;
  submitted: number;
  leaderApproved: number;
  adminApproved: number;
}

export interface AdminOverviewData {
  yearMonth: string;
  teams: AdminTeamOverviewRow[];
  grandTotal: AdminGrandTotal;
  totalProjects: number;
  approvedProjects: number;
}

export const timesheetApi = {
  createTimesheet: (yearMonth: string, teamId: string) =>
    apiClient.post<{ data: TimesheetWithEntries }>('/timesheets', { yearMonth, teamId }),

  getMyTimesheet: (yearMonth: string, teamId: string) =>
    apiClient.get<{ data: TimesheetWithEntries | null }>('/timesheets/me', {
      params: { yearMonth, teamId },
    }),

  getTimesheetById: (id: string) =>
    apiClient.get<{ data: TimesheetWithEntries }>(`/timesheets/${id}`),

  saveEntry: (entryId: string, data: SaveEntryData) =>
    apiClient.put<{ data: { id: string } }>(`/timesheet-entries/${entryId}`, data),

  batchSaveEntries: (entries: BatchSaveEntry[]) =>
    apiClient.post<{ data: { count: number } }>('/timesheet-entries/batch', { entries }),

  submitTimesheet: (id: string) =>
    apiClient.patch<{ data: TimesheetWithEntries }>(`/timesheets/${id}/submit`, {}),

  // ──────────── 팀장 API ────────────

  getTeamMembersStatus: (teamId: string, yearMonth: string) =>
    apiClient.get<{ data: TeamMemberStatusRow[] }>('/timesheets/team-members-status', {
      params: { teamId, yearMonth },
    }),

  getTeamSummary: (teamId: string, yearMonth: string) =>
    apiClient.get<{ data: TeamSummaryData }>('/timesheets/team-summary', {
      params: { teamId, yearMonth },
    }),

  approveTimesheet: (id: string) =>
    apiClient.post<{ data: { message: string } }>(`/timesheets/${id}/approve`, {}),

  batchApproveTimesheets: (timesheetIds: string[]) =>
    apiClient.post<{ data: { approvedCount: number; approvedIds: string[] } }>('/timesheets/batch-approve', { timesheetIds }),

  rejectTimesheet: (id: string, comment: string) =>
    apiClient.post<{ data: { message: string } }>(`/timesheets/${id}/reject`, { comment }),

  // ──────────── PM API ────────────

  getProjectAllocationSummary: (yearMonth: string) =>
    apiClient.get<{ data: ProjectAllocationSummaryData }>('/timesheets/project-allocation/summary', {
      params: { yearMonth },
    }),

  getProjectAllocationMonthly: (projectId: string, yearMonth: string) =>
    apiClient.get<{ data: ProjectAllocationMonthlyData }>('/timesheets/project-allocation/monthly', {
      params: { projectId, yearMonth },
    }),

  getProjectAllocationYearly: (projectId: string, year: string) =>
    apiClient.get<{ data: ProjectAllocationYearlyData }>('/timesheets/project-allocation/yearly', {
      params: { projectId, year },
    }),

  approveProjectTimesheet: (projectId: string, yearMonth: string) =>
    apiClient.post<{ data: { message: string } }>('/timesheets/project-approve', {}, {
      params: { projectId, yearMonth },
    }),

  getManagedProjects: () =>
    apiClient.get<{ data: { id: string; name: string; code: string; status: string }[] }>('/projects/managed'),

  // ──────────── 관리자 API ────────────

  getAdminOverview: (yearMonth: string) =>
    apiClient.get<{ data: AdminOverviewData }>('/timesheets/admin-overview', {
      params: { yearMonth },
    }),

  adminApprove: (yearMonth: string) =>
    apiClient.post<{ data: { message: string } }>('/timesheets/admin-approve', null, {
      params: { yearMonth },
    }),

  adminExport: (yearMonth: string) =>
    apiClient.get('/timesheets/admin-export', {
      params: { yearMonth },
      responseType: 'blob',
    }),
};
