import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, CreateMemberDto, UpdateMemberDto } from '../api/team.api';

export function useParts(teamId: string) {
  return useQuery({
    queryKey: ['parts', teamId],
    queryFn: () => teamApi.getParts(teamId).then((r) => r.data.data),
    enabled: !!teamId,
  });
}

export function useTeamMembers(teamId: string, partId?: string) {
  return useQuery({
    queryKey: ['members', teamId, partId],
    queryFn: () => teamApi.getMembers(teamId, partId).then((r) => r.data.data),
    enabled: !!teamId,
  });
}

export function useCreateMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberDto) => teamApi.createMember(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', teamId] });
    },
  });
}

export function useUpdateMember(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberDto }) =>
      teamApi.updateMember(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', teamId] });
    },
  });
}
