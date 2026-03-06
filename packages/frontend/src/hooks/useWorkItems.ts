import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weeklyReportApi, WorkItem, ApplyTasksDto } from '../api/weekly-report.api';
import { useGridStore } from '../stores/gridStore';

export function useAddWorkItem(week: string, reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { projectId?: string; doneWork: string; planWork: string; remarks?: string }) =>
      weeklyReportApi.addWorkItem(reportId, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-report', week] });
    },
  });
}

export function useUpdateWorkItem(week: string) {
  const queryClient = useQueryClient();
  const { markClean, setIsSaving } = useGridStore.getState();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<WorkItem, 'projectId' | 'doneWork' | 'planWork' | 'remarks'>>;
    }) => {
      setIsSaving(true);
      return weeklyReportApi.updateWorkItem(id, data).then((r) => r.data.data);
    },
    onSuccess: (_, variables) => {
      markClean(variables.id);
      setIsSaving(false);
      queryClient.invalidateQueries({ queryKey: ['weekly-report', week] });
    },
    onError: () => {
      setIsSaving(false);
    },
  });
}

export function useDeleteWorkItem(week: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      weeklyReportApi.deleteWorkItem(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-report', week] });
    },
  });
}

export function useDeleteWorkItemsByProject(week: string, reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      weeklyReportApi.deleteWorkItemsByProject(reportId, projectId).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-report', week] });
    },
  });
}

export function useLinkedTasks(workItemId: string, teamId: string) {
  return useQuery({
    queryKey: ['work-item-linked-tasks', workItemId, teamId],
    queryFn: () => weeklyReportApi.getLinkedTasks(workItemId, teamId).then((r) => r.data.data),
    enabled: !!workItemId && !!teamId,
    staleTime: 30_000,
  });
}

export function useApplyTasksToWorkItem(currentWeek: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workItemId, dto }: { workItemId: string; dto: ApplyTasksDto }) =>
      weeklyReportApi.applyTasksToWorkItem(workItemId, dto).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-report', currentWeek] });
    },
  });
}
