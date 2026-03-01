import apiClient from './client';

export interface Part {
  id: string;
  name: string;
  leaderId?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'LEADER' | 'PART_LEADER' | 'MEMBER';
  partId: string;
  partName?: string;
  isActive: boolean;
}

export interface CreateMemberDto {
  name: string;
  email: string;
  password: string;
  partId: string;
  role: 'LEADER' | 'PART_LEADER' | 'MEMBER';
}

export interface UpdateMemberDto {
  name?: string;
  partId?: string;
  role?: 'LEADER' | 'PART_LEADER' | 'MEMBER';
  isActive?: boolean;
}

export const teamApi = {
  getParts: (teamId: string) =>
    apiClient.get<{ data: Part[] }>(`/teams/${teamId}/parts`),

  getMembers: (teamId: string, partId?: string) =>
    apiClient.get<{ data: Member[] }>(`/teams/${teamId}/members`, {
      params: partId ? { partId } : {},
    }),

  createMember: (data: CreateMemberDto) =>
    apiClient.post<{ data: Member }>('/members', data),

  updateMember: (id: string, data: UpdateMemberDto) =>
    apiClient.patch<{ data: Member }>(`/members/${id}`, data),
};
