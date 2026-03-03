import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, GetTeamsParams, TeamListItem } from '../api/team.api';

export function useTeams(params?: GetTeamsParams) {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: () => teamApi.getTeams(params).then((r) => r.data.data.data),
  });
}

export function useMyTeams() {
  return useQuery({
    queryKey: ['my-teams'],
    queryFn: () =>
      teamApi.getMyTeams().then((r) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r.data.data as any[]).map((t): TeamListItem => ({
          id: t.teamId ?? t.id,
          name: t.teamName ?? t.name,
          memberCount: t.memberCount ?? 0,
          isMember: true,
          leaderName: t.leaderName,
          status: t.teamStatus ?? t.status,
        })),
      ),
  });
}

export function useRequestCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamName: string) =>
      teamApi.requestCreateTeam(teamName).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
    },
  });
}

export function useRequestJoinTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) =>
      teamApi.requestJoinTeam(teamId).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
    },
  });
}
