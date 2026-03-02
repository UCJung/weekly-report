import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  AccountStatus,
  TeamStatus,
  UpdateAccountStatusDto,
  UpdateTeamStatusDto,
} from '../api/admin.api';

export function useAdminAccounts(params?: { status?: AccountStatus; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'accounts', params],
    queryFn: () => adminApi.getAccounts(params).then((r) => r.data.data.data),
  });
}

export function useUpdateAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountStatusDto }) =>
      adminApi.updateAccountStatus(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminApi.resetPassword(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
    },
  });
}

export function useAdminTeams(status?: TeamStatus) {
  return useQuery({
    queryKey: ['admin', 'teams', status],
    queryFn: () => adminApi.getTeams(status).then((r) => r.data.data.data),
  });
}

export function useUpdateTeamStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamStatusDto }) =>
      adminApi.updateTeamStatus(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
    },
  });
}
