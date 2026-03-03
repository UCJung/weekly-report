import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetApi, SaveEntryData, BatchSaveEntry } from '../api/timesheet.api';

export function useMyTimesheet(yearMonth: string, teamId: string | null) {
  return useQuery({
    queryKey: ['timesheet', yearMonth, teamId],
    queryFn: () =>
      timesheetApi.getMyTimesheet(yearMonth, teamId!).then((r) => r.data.data),
    enabled: !!yearMonth && !!teamId,
    staleTime: 30_000,
  });
}

export function useCreateTimesheet(yearMonth: string, teamId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      timesheetApi.createTimesheet(yearMonth, teamId!).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', yearMonth, teamId] });
    },
  });
}

export function useSaveEntry(yearMonth: string, teamId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: SaveEntryData }) =>
      timesheetApi.saveEntry(entryId, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', yearMonth, teamId] });
    },
  });
}

export function useBatchSaveEntries(yearMonth: string, teamId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: BatchSaveEntry[]) =>
      timesheetApi.batchSaveEntries(entries).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', yearMonth, teamId] });
    },
  });
}

export function useSubmitTimesheet(yearMonth: string, teamId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      timesheetApi.submitTimesheet(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', yearMonth, teamId] });
    },
  });
}
