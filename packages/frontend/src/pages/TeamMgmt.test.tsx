import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// mock axios
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn().mockResolvedValue({ data: { data: {} } }),
    patch: vi.fn().mockResolvedValue({ data: { data: {} } }),
    delete: vi.fn().mockResolvedValue({ data: { data: {} } }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// mock zustand stores
vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u1', name: '정우철', role: 'LEADER', partId: 'p1', partName: 'DX' },
    isAuthenticated: () => true,
  }),
}));

vi.mock('../stores/uiStore', () => ({
  useUiStore: () => ({ addToast: vi.fn(), toasts: [] }),
}));

import TeamMgmt from './TeamMgmt';

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
};

describe('TeamMgmt', () => {
  test('renders table headers', () => {
    render(<TeamMgmt />, { wrapper: createWrapper() });
    expect(screen.getByText('이름')).toBeDefined();
    expect(screen.getByText('이메일')).toBeDefined();
    expect(screen.getByText('파트')).toBeDefined();
    expect(screen.getByText('역할')).toBeDefined();
  });

  test('renders register button', () => {
    render(<TeamMgmt />, { wrapper: createWrapper() });
    expect(screen.getByText('+ 팀원 등록')).toBeDefined();
  });
});
