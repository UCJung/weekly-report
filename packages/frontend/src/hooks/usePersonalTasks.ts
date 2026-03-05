import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  personalTaskApi,
  PersonalTask,
  ListPersonalTasksParams,
  CreatePersonalTaskDto,
  UpdatePersonalTaskDto,
  ReorderPersonalTasksDto,
} from '../api/personal-task.api';
import { useTeamStore } from '../stores/teamStore';

export function usePersonalTasks(params: Omit<ListPersonalTasksParams, 'teamId'> & { teamId?: string }) {
  const { currentTeamId } = useTeamStore();
  const teamId = params.teamId ?? currentTeamId ?? '';

  return useQuery({
    queryKey: ['personal-tasks', { ...params, teamId }],
    queryFn: () =>
      personalTaskApi.getPersonalTasks({ ...params, teamId }).then((r) => r.data.data),
    enabled: !!teamId,
    staleTime: 30_000,
  });
}

export function usePersonalTaskSummary(teamId?: string) {
  const { currentTeamId } = useTeamStore();
  const resolvedTeamId = teamId ?? currentTeamId ?? '';

  return useQuery({
    queryKey: ['personal-task-summary', resolvedTeamId],
    queryFn: () =>
      personalTaskApi.getPersonalTaskSummary(resolvedTeamId).then((r) => r.data.data),
    enabled: !!resolvedTeamId,
    staleTime: 60_000,
  });
}

export function useCreatePersonalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePersonalTaskDto) =>
      personalTaskApi.createPersonalTask(dto).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
    },
  });
}

export function useUpdatePersonalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePersonalTaskDto }) =>
      personalTaskApi.updatePersonalTask(id, dto).then((r) => r.data.data),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ['personal-tasks'] });
      const previousData = queryClient.getQueriesData<PersonalTask[]>({ queryKey: ['personal-tasks'] });

      queryClient.setQueriesData<PersonalTask[]>({ queryKey: ['personal-tasks'] }, (old) => {
        if (!old) return old;
        return old.map((task): PersonalTask => {
          if (task.id !== id) return task;
          const updated = { ...task, ...dto };
          // null → undefined for projectId/dueDate to match PersonalTask type
          if (updated.projectId === null) updated.projectId = undefined;
          if (updated.dueDate === null) updated.dueDate = undefined;
          // statusId change: clear taskStatus optimistically (will be refreshed on settle)
          // The server response will bring the correct taskStatus object
          return updated as PersonalTask;
        });
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
    },
  });
}

export function useDeletePersonalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      personalTaskApi.deletePersonalTask(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
    },
  });
}

export function useToggleDonePersonalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      personalTaskApi.toggleDonePersonalTask(id).then((r) => r.data.data),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['personal-tasks'] });
      const previousData = queryClient.getQueriesData<PersonalTask[]>({ queryKey: ['personal-tasks'] });

      queryClient.setQueriesData<PersonalTask[]>({ queryKey: ['personal-tasks'] }, (old) => {
        if (!old) return old;
        return old.map((task) => {
          if (task.id !== id) return task;
          // Toggle category between COMPLETED and BEFORE_START optimistically
          const isCurrentlyDone = task.taskStatus.category === 'COMPLETED';
          const newCategory = isCurrentlyDone ? 'BEFORE_START' : 'COMPLETED';
          return {
            ...task,
            taskStatus: {
              ...task.taskStatus,
              category: newCategory,
            },
            completedAt: !isCurrentlyDone ? new Date().toISOString() : undefined,
          };
        });
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
    },
  });
}

export function useReorderPersonalTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReorderPersonalTasksDto) =>
      personalTaskApi.reorderPersonalTasks(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
    },
  });
}
