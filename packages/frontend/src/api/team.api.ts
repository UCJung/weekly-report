import apiClient from './client';

export interface Part {
  id: string;
  name: string;
  sortOrder: number;
  leaderId?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  roles: ('LEADER' | 'PART_LEADER' | 'MEMBER')[];
  partId: string;
  partName?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateMemberDto {
  name: string;
  email: string;
  password: string;
  partId: string;
  roles: ('LEADER' | 'PART_LEADER' | 'MEMBER')[];
}

export interface UpdateMemberDto {
  name?: string;
  partId?: string;
  roles?: ('LEADER' | 'PART_LEADER' | 'MEMBER')[];
  isActive?: boolean;
}

export interface TeamListItem {
  id: string;
  name: string;
  leaderName?: string;
  memberCount: number;
  isMember: boolean;
  status?: string;
}

export type TeamFilter = 'all' | 'joined' | 'unjoined';

export interface GetTeamsParams {
  search?: string;
  filter?: TeamFilter;
}

export interface TeamJoinRequestResult {
  message: string;
}

export interface TeamCreateRequestResult {
  message: string;
}

export interface JoinRequest {
  id: string;
  memberId: string;
  teamId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  member: { name: string; email: string };
  createdAt: string;
}

export interface ReviewJoinRequestDto {
  status: 'APPROVED' | 'REJECTED';
  partId?: string;
}

export const teamApi = {
  getParts: (teamId: string) =>
    apiClient.get<{ data: Part[] }>(`/teams/${teamId}/parts`),

  reorderParts: (teamId: string, orderedIds: string[]) =>
    apiClient.patch(`/teams/${teamId}/parts/reorder`, { orderedIds }),

  getMembers: (teamId: string, partId?: string) =>
    apiClient.get<{ data: Member[] }>(`/teams/${teamId}/members`, {
      params: partId ? { partId } : {},
    }),

  createMember: (data: CreateMemberDto) =>
    apiClient.post<{ data: Member }>('/members', data),

  updateMember: (id: string, data: UpdateMemberDto) =>
    apiClient.patch<{ data: Member }>(`/members/${id}`, data),

  reorderMembers: (teamId: string, orderedIds: string[]) =>
    apiClient.patch(`/teams/${teamId}/members/reorder`, { orderedIds }),

  // 팀 목록 조회 (검색 + 필터)
  getTeams: (params?: GetTeamsParams) =>
    apiClient.get<{ data: { data: TeamListItem[]; pagination?: unknown } }>('/teams', { params }),

  // 내 소속 팀 목록
  getMyTeams: () =>
    apiClient.get<{ data: TeamListItem[] }>('/my/teams'),

  // 팀 생성 신청
  requestCreateTeam: (teamName: string) =>
    apiClient.post<{ data: TeamCreateRequestResult }>('/teams/request', { teamName }),

  // 멤버 가입 신청
  requestJoinTeam: (teamId: string) =>
    apiClient.post<{ data: TeamJoinRequestResult }>(`/teams/${teamId}/join`),

  // 멤버 신청 목록 조회 (팀장/파트장 전용)
  getJoinRequests: (teamId: string) =>
    apiClient.get<{ data: JoinRequest[] }>(`/teams/${teamId}/join-requests`),

  // 멤버 신청 승인/거절
  reviewJoinRequest: (teamId: string, requestId: string, data: ReviewJoinRequestDto) =>
    apiClient.patch<{ data: JoinRequest }>(`/teams/${teamId}/join-requests/${requestId}`, data),
};
