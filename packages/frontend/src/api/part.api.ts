import apiClient from './client';
import { WorkItem } from './weekly-report.api';

export interface MemberWeeklyStatus {
  member: { id: string; name: string; roles: string[]; partId: string; partName: string };
  report: {
    id: string;
    weekLabel: string;
    status: 'DRAFT' | 'SUBMITTED';
    workItems: WorkItem[];
  } | null;
}

export interface SubmissionStatus {
  memberId: string;
  memberName: string;
  status: 'SUBMITTED' | 'DRAFT' | 'NOT_STARTED';
}

export interface SummaryWorkItem {
  id: string;
  partSummaryId: string;
  projectId: string;
  project?: { id: string; name: string; code: string };
  doneWork: string;
  planWork: string;
  remarks?: string;
  sortOrder: number;
}

export interface PartSummary {
  id: string;
  partId: string;
  weekLabel: string;
  status: 'DRAFT' | 'SUBMITTED';
  summaryWorkItems: SummaryWorkItem[];
}

export interface TeamWeeklyOverview {
  part: { id: string; name: string };
  summaryStatus: 'DRAFT' | 'SUBMITTED' | 'NOT_STARTED';
  members: MemberWeeklyStatus[];
}

export const partApi = {
  getPartWeeklyStatus: (partId: string, week: string) =>
    apiClient.get<{ data: MemberWeeklyStatus[] }>(`/parts/${partId}/weekly-status`, {
      params: { week },
    }),

  getSubmissionStatus: (partId: string, week: string) =>
    apiClient.get<{ data: SubmissionStatus[] }>(`/parts/${partId}/submission-status`, {
      params: { week },
    }),

  getPartSummary: (partId: string, week: string) =>
    apiClient.get<{ data: PartSummary | null }>('/part-summaries', {
      params: { partId, week },
    }),

  createPartSummary: (data: { partId: string; weekLabel: string }) =>
    apiClient.post<{ data: PartSummary }>('/part-summaries', data),

  autoMerge: (summaryId: string) =>
    apiClient.post<{ data: { summary: PartSummary; summaryWorkItems: SummaryWorkItem[]; mergedCount: number } }>(
      `/part-summaries/${summaryId}/auto-merge`,
    ),

  updatePartSummary: (id: string, data: { status?: 'DRAFT' | 'SUBMITTED' }) =>
    apiClient.patch<{ data: PartSummary }>(`/part-summaries/${id}`, data),

  getTeamWeeklyOverview: (teamId: string, week: string) =>
    apiClient.get<{ data: TeamWeeklyOverview[] }>(`/teams/${teamId}/weekly-overview`, {
      params: { week },
    }),

  getTeamMembersWeeklyStatus: (teamId: string, week: string) =>
    apiClient.get<{ data: MemberWeeklyStatus[] }>(`/teams/${teamId}/members-weekly-status`, {
      params: { week },
    }),
};
