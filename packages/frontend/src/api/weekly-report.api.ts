import apiClient from './client';

export interface WorkItem {
  id: string;
  weeklyReportId: string;
  projectId: string;
  project?: { id: string; name: string; code: string; sortOrder?: number };
  doneWork: string;
  planWork: string;
  remarks?: string;
  sortOrder: number;
}

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface LinkedTask {
  id: string;
  title: string;
  memo?: string;
  priority: TaskPriority;
  statusId: string;
  taskStatus: { id: string; name: string; category: string; color: string };
  dueDate?: string;
  scheduledDate?: string;
  linkedWeekLabel?: string;
  completedAt?: string;
}

export interface LinkedTasksResult {
  workItemId: string;
  projectId?: string;
  weekLabel: string;
  tasks: LinkedTask[];
}

export interface ApplyTasksDto {
  taskIds: string[];
  appendMode: 'replace' | 'append';
  teamId: string;
}

export interface WeeklyReport {
  id: string;
  memberId: string;
  weekStart: string;
  weekLabel: string;
  status: 'DRAFT' | 'SUBMITTED';
  workItems: WorkItem[];
}

export interface CarryForwardResult {
  report: WeeklyReport;
  createdItems: WorkItem[];
  message: string;
}

export const weeklyReportApi = {
  getMyWeeklyReport: (week: string) =>
    apiClient.get<{ data: WeeklyReport | null }>('/weekly-reports/me', { params: { week } }),

  createWeeklyReport: (weekLabel: string) =>
    apiClient.post<{ data: WeeklyReport }>('/weekly-reports', { weekLabel }),

  updateWeeklyReport: (id: string, status: 'DRAFT' | 'SUBMITTED') =>
    apiClient.patch<{ data: WeeklyReport }>(`/weekly-reports/${id}`, { status }),

  addWorkItem: (
    reportId: string,
    data: { projectId?: string; doneWork: string; planWork: string; remarks?: string },
  ) => apiClient.post<{ data: WorkItem }>(`/weekly-reports/${reportId}/work-items`, data),

  updateWorkItem: (
    id: string,
    data: Partial<Pick<WorkItem, 'projectId' | 'doneWork' | 'planWork' | 'remarks'>>,
  ) => apiClient.patch<{ data: WorkItem }>(`/work-items/${id}`, data),

  deleteWorkItem: (id: string) =>
    apiClient.delete<{ data: { deleted: boolean } }>(`/work-items/${id}`),

  deleteWorkItemsByProject: (reportId: string, projectId: string) =>
    apiClient.delete<{ data: { deleted: number } }>(
      `/weekly-reports/${reportId}/work-items`,
      { params: { projectId } },
    ),

  reorderWorkItems: (items: { id: string; sortOrder: number }[]) =>
    apiClient.patch('/work-items/reorder', { items }),

  carryForward: (targetWeek: string, sourceWorkItemIds?: string[]) =>
    apiClient.post<{ data: CarryForwardResult }>('/weekly-reports/carry-forward', {
      targetWeek,
      sourceWorkItemIds,
    }),

  getLinkedTasks: (workItemId: string, teamId: string) =>
    apiClient.get<{ data: LinkedTasksResult }>(`/work-items/${workItemId}/linked-tasks`, {
      params: { teamId },
    }),

  applyTasksToWorkItem: (workItemId: string, dto: ApplyTasksDto) =>
    apiClient.post<{ data: WorkItem }>(`/work-items/${workItemId}/apply-tasks`, dto),
};
