import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, ProjectFilters } from '../api/project.api';

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectApi.getProjects(filters).then((r) => r.data.data),
  });
}

export function useTeamProjects(teamId: string) {
  return useQuery({
    queryKey: ['team-projects', teamId],
    queryFn: () => projectApi.getTeamProjects(teamId).then((r) => r.data.data),
    enabled: !!teamId,
  });
}

export function useAddTeamProjects(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectIds: string[]) =>
      projectApi.addTeamProjects(teamId, projectIds).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-projects', teamId] });
    },
  });
}

export function useRemoveTeamProject(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      projectApi.removeTeamProject(teamId, projectId).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-projects', teamId] });
    },
  });
}

export function useReorderTeamProjects(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      projectApi.reorderTeamProjects(teamId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-projects', teamId] });
    },
  });
}
