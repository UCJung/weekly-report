import apiClient from './client';

export interface Project {
  id: string;
  name: string;
  code: string;
  category: 'COMMON' | 'EXECUTION';
  status: 'ACTIVE' | 'HOLD' | 'COMPLETED';
  teamId: string;
}

export interface ProjectFilters {
  category?: 'COMMON' | 'EXECUTION';
  status?: 'ACTIVE' | 'HOLD' | 'COMPLETED';
  teamId?: string;
  page?: number;
  limit?: number;
}

export interface CreateProjectDto {
  name: string;
  code: string;
  category: 'COMMON' | 'EXECUTION';
  teamId: string;
}

export interface UpdateProjectDto {
  name?: string;
  code?: string;
  category?: 'COMMON' | 'EXECUTION';
  status?: 'ACTIVE' | 'HOLD' | 'COMPLETED';
}

export const projectApi = {
  getProjects: (filters: ProjectFilters = {}) =>
    apiClient.get<{ data: Project[]; pagination: { total: number } }>('/projects', {
      params: filters,
    }),

  getProject: (id: string) =>
    apiClient.get<{ data: Project }>(`/projects/${id}`),

  createProject: (data: CreateProjectDto) =>
    apiClient.post<{ data: Project }>('/projects', data),

  updateProject: (id: string, data: UpdateProjectDto) =>
    apiClient.patch<{ data: Project }>(`/projects/${id}`, data),

  deleteProject: (id: string) =>
    apiClient.delete<{ data: Project & { _warning?: string } }>(`/projects/${id}`),
};
