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
};
