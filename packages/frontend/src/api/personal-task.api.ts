import apiClient from './client';
import { TaskStatusCategory } from './team.api';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskSortBy = 'dueDate' | 'priority' | 'createdAt' | 'project';
export type TaskPeriod = 'today' | 'this-week' | 'this-month' | 'overdue';

/** @deprecated status 필드는 taskStatus.category 로 대체되었습니다. */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskStatusSnapshot {
  id: string;
  name: string;
  category: TaskStatusCategory;
  color: string;
  sortOrder: number;
}

export interface PersonalTask {
  id: string;
  memberId: string;
  teamId: string;
  title: string;
  memo?: string;
  projectId?: string;
  priority: TaskPriority;
  /** @deprecated status 필드는 statusId + taskStatus 로 대체되었습니다. */
  status?: TaskStatus;
  statusId: string;
  taskStatus: TaskStatusSnapshot;
  dueDate?: string;
  scheduledDate?: string;
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
  /** @deprecated status 필드는 statusId/category 로 대체되었습니다. */
  status?: TaskStatus | 'ALL';
  statusId?: string;
  category?: TaskStatusCategory;
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
  statusId?: string;
  dueDate?: string;
  scheduledDate?: string;
  repeatConfig?: { type: string; dayOfWeek?: number; startDate?: string };
}

export interface UpdatePersonalTaskDto {
  title?: string;
  memo?: string;
  projectId?: string | null;
  priority?: TaskPriority;
  /** @deprecated status 필드는 statusId 로 대체되었습니다. */
  status?: TaskStatus;
  statusId?: string;
  dueDate?: string | null;
  scheduledDate?: string | null;
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
