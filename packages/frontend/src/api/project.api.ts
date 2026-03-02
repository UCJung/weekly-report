import apiClient from './client';

// 전역 프로젝트 타입 (Admin API 및 조회용)
export interface Project {
  id: string;
  name: string;
  code: string;
  category: 'COMMON' | 'EXECUTION';
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
}

// 팀에 등록된 프로젝트 (TeamProject 포함)
export interface TeamProject extends Project {
  teamProjectId: string;
}

export interface ProjectFilters {
  category?: 'COMMON' | 'EXECUTION';
  status?: 'ACTIVE' | 'INACTIVE';
  page?: number;
  limit?: number;
}

export const projectApi = {
  // 전역 프로젝트 목록 (Admin 전역 조회용)
  getProjects: (filters: ProjectFilters = {}) =>
    apiClient.get<{ data: { data: Project[]; pagination: { total: number; page: number; limit: number; totalPages: number } } }>('/projects', {
      params: filters,
    }),

  getProject: (id: string) =>
    apiClient.get<{ data: Project }>(`/projects/${id}`),

  // 팀 프로젝트 API
  getTeamProjects: (teamId: string) =>
    apiClient.get<{ data: TeamProject[] }>(`/teams/${teamId}/projects`),

  addTeamProjects: (teamId: string, projectIds: string[]) =>
    apiClient.post<{ data: { added: number; message: string } }>(`/teams/${teamId}/projects`, { projectIds }),

  removeTeamProject: (teamId: string, projectId: string) =>
    apiClient.delete<{ data: { message: string; _warning?: string } }>(`/teams/${teamId}/projects/${projectId}`),

  reorderTeamProjects: (teamId: string, orderedIds: string[]) =>
    apiClient.patch(`/teams/${teamId}/projects/reorder`, { orderedIds }),
};
