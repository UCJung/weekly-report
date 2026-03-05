import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// api/client, stores/uiStore mock은 setup.ts에서 공통 처리

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u1', name: '최수진', roles: ['PART_LEADER'], teamId: 't1' },
    isAuthenticated: () => true,
  }),
}));

vi.mock('../stores/teamStore', () => ({
  useTeamStore: () => ({
    currentTeamId: 't1',
  }),
}));

// PART_LEADER 사용자의 파트 정보는 teamApi.getMembers에서 조회됨
vi.mock('../api/team.api', () => ({
  teamApi: {
    getMembers: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 'u1',
            name: '최수진',
            roles: ['PART_LEADER'],
            partId: 'p1',
            partName: 'DX',
          },
        ],
      },
    }),
    getParts: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

import PartStatus from './PartStatus';

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

describe('PartStatus', () => {
  test('renders week navigator', () => {
    render(<PartStatus />, { wrapper: createWrapper() });
    expect(screen.getByText('◀')).toBeDefined();
    expect(screen.getByText('▶')).toBeDefined();
  });

  test('renders table headers', () => {
    render(<PartStatus />, { wrapper: createWrapper() });
    const projectElements = screen.getAllByText('프로젝트');
    expect(projectElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('팀원')).toBeDefined();
    expect(screen.getByText(/진행업무/)).toBeDefined();
    expect(screen.getByText(/예정업무/)).toBeDefined();
  });

  test('renders filter section', () => {
    render(<PartStatus />, { wrapper: createWrapper() });
    expect(screen.getByText('인원')).toBeDefined();
  });

  test('renders view mode toggle', () => {
    render(<PartStatus />, { wrapper: createWrapper() });
    expect(screen.getByText('프로젝트별')).toBeDefined();
    expect(screen.getByText('팀원별')).toBeDefined();
  });

  test('shows part name for non-leader user', async () => {
    render(<PartStatus />, { wrapper: createWrapper() });
    // PART_LEADER는 파트 선택 드롭다운 대신 파트명 스팬을 렌더링함.
    // teamApi.getMembers가 resolve되면 userPartName = 'DX'가 스팬에 표시됨.
    await waitFor(() => {
      expect(screen.getByText('DX')).toBeDefined();
    });
  });

  test('renders task status section title', () => {
    render(<PartStatus />, { wrapper: createWrapper() });
    expect(screen.getByText('업무현황')).toBeDefined();
  });
});
