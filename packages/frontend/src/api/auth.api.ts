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
    teamName: string;
    mustChangePassword?: boolean;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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

  register: (body: RegisterRequest) =>
    apiClient.post<{ data: { message: string } }>('/auth/register', body),

  changePassword: (body: ChangePasswordRequest) =>
    apiClient.post<{ data: { message: string } }>('/auth/change-password', body),
};
