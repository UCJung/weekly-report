import apiClient from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    partId: string;
    partName: string;
    teamId: string;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ data: LoginResponse }>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: { accessToken: string; refreshToken?: string } }>('/auth/refresh', {
      refreshToken,
    }),

  getMe: () =>
    apiClient.get<{ data: LoginResponse['user'] }>('/auth/me'),
};
