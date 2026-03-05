import apiClient from './client';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskSortBy = 'dueDate' | 'priority' | 'createdAt' | 'project';
export type TaskPeriod = 'today' | 'this-week' | 'this-month' | 'overdue';

export interface PersonalTask {
  id: string;
  memberId: string;
  teamId: string;
  title: string;
  memo?: string;
  projectId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  sortOrder: number;
  linkedWeekLabel?: string;
  repeatConfig?: { type: string; dayOfWeek?: number; startDate?: string };
  completedAt?: string;
  startedAt?: string;
  elapsedMinutes?: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; code: string };
}

export interface PersonalTaskSummary {
  todayCount: number;
  dueSoonCount: number;
  thisWeekDoneCount: number;
  overdueCount: number;
}

export interface ListPersonalTasksParams {
  teamId: string;
  status?: TaskStatus | 'ALL';
  projectId?: string;
  priority?: TaskPriority;
  period?: TaskPeriod;
  q?: string;
  sortBy?: TaskSortBy;
}

export interface CreatePersonalTaskDto {
  teamId: string;
  title: string;
  memo?: string;
  projectId?: string;
  priority?: TaskPriority;
  dueDate?: string;
  repeatConfig?: { type: string; dayOfWeek?: number; startDate?: string };
}

export interface UpdatePersonalTaskDto {
  title?: string;
  memo?: string;
  projectId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  repeatConfig?: { type: string; dayOfWeek?: number; startDate?: string } | null;
  elapsedMinutes?: number;
}

export interface ReorderPersonalTasksDto {
  items: { id: string; sortOrder: number }[];
}

export interface ImportToWeeklyReportDto {
  taskIds: string[];
  weekLabel: string;
  teamId: string;
}

export interface ImportToWeeklyReportResult {
  imported: number;
  message: string;
}

export const personalTaskApi = {
  getPersonalTasks: (params: ListPersonalTasksParams) =>
    apiClient.get<{ data: PersonalTask[] }>('/personal-tasks', { params }),

  createPersonalTask: (dto: CreatePersonalTaskDto) =>
    apiClient.post<{ data: PersonalTask }>('/personal-tasks', dto),

  updatePersonalTask: (id: string, dto: UpdatePersonalTaskDto) =>
    apiClient.patch<{ data: PersonalTask }>(`/personal-tasks/${id}`, dto),

  deletePersonalTask: (id: string) =>
    apiClient.delete<{ data: { deleted: boolean } }>(`/personal-tasks/${id}`),

  toggleDonePersonalTask: (id: string) =>
    apiClient.patch<{ data: PersonalTask }>(`/personal-tasks/${id}/toggle-done`),

  reorderPersonalTasks: (dto: ReorderPersonalTasksDto) =>
    apiClient.patch('/personal-tasks/reorder', dto),

  getPersonalTaskSummary: (teamId: string) =>
    apiClient.get<{ data: PersonalTaskSummary }>('/personal-tasks/summary', { params: { teamId } }),

  importToWeeklyReport: (dto: ImportToWeeklyReportDto) =>
    apiClient.post<{ data: ImportToWeeklyReportResult }>('/personal-tasks/import-to-weekly', dto),
};
