import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// DnD 테이블을 단순 테이블로 대체하여 DnD Worker 크래시 방지
vi.mock('./ProjectDndTable', () => ({
  default: ({ isLoading }: { isLoading: boolean }) => (
    <table>
      <thead>
        <tr>
          <th>순서</th>
          <th>프로젝트명</th>
          <th>코드</th>
          <th>분류</th>
          <th>상태</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
        {isLoading && <tr><td colSpan={6}>불러오는 중...</td></tr>}
      </tbody>
    </table>
  ),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u1', name: '홍길동', roles: ['LEADER'], teamId: 'team-1' },
    isAuthenticated: () => true,
  }),
}));

// IMPORTANT: stable array reference to prevent infinite useEffect re-render loop
vi.mock('../hooks/useProjects', () => {
  const STABLE_DATA: never[] = [];
  return {
    useTeamProjects: vi.fn(() => ({ data: STABLE_DATA, isLoading: false })),
    useAddTeamProjects: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useRemoveTeamProject: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useReorderTeamProjects: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  };
});

vi.mock('../hooks/useAdmin', () => ({
  useAdminProjects: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

vi.mock('../components/ui/Modal', () => ({
  default: () => null,
  ConfirmModal: () => null,
}));

import ProjectMgmt from './ProjectMgmt';

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

describe('ProjectMgmt', () => {
  test('renders table headers', () => {
    render(<ProjectMgmt />, { wrapper: createWrapper() });
    expect(screen.getByText('프로젝트명')).toBeDefined();
    expect(screen.getByText('코드')).toBeDefined();
    expect(screen.getByText('분류')).toBeDefined();
    expect(screen.getByText('상태')).toBeDefined();
  });

  test('renders summary cards', () => {
    render(<ProjectMgmt />, { wrapper: createWrapper() });
    expect(screen.getByText('등록된 프로젝트')).toBeDefined();
    // 공통업무 / 수행과제 는 요약카드와 필터 드롭다운에 각각 존재
    expect(screen.getAllByText('공통업무').length).toBeGreaterThan(0);
    expect(screen.getAllByText('수행과제').length).toBeGreaterThan(0);
  });

  test('renders add project button', () => {
    render(<ProjectMgmt />, { wrapper: createWrapper() });
    expect(screen.getByText('프로젝트 추가')).toBeDefined();
  });
});
