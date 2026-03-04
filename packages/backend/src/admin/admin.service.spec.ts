import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { HttpStatus } from '@nestjs/common';
import { AccountStatus, TeamStatus, MemberRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { BusinessException } from '../common/filters/business-exception';

const mockConfigService = {
  get: mock((key: string, defaultValue?: string) => {
    const config: Record<string, string> = {
      DEFAULT_PASSWORD: 'changeme!2026',
    };
    return config[key] ?? defaultValue ?? null;
  }),
};

const mockPrisma = {
  member: {
    count: mock(() => Promise.resolve(0)),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(null)),
  },
  team: {
    count: mock(() => Promise.resolve(0)),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(null)),
  },
  teamMembership: {
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve(null)),
  },
  project: {
    count: mock(() => Promise.resolve(0)),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    aggregate: mock(() => Promise.resolve({ _max: { sortOrder: null } })),
  },
  $transaction: mock(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (typeof arg === 'function') return arg(mockPrisma);
    return null;
  }),
};

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(() => {
    service = new AdminService(mockPrisma as never, mockConfigService as never);
    // Reset mocks
    mockPrisma.member.count.mockResolvedValue(0);
    mockPrisma.member.findUnique.mockResolvedValue(null);
    mockPrisma.member.findMany.mockResolvedValue([]);
    mockPrisma.member.update.mockResolvedValue(null);
    mockPrisma.team.count.mockResolvedValue(0);
    mockPrisma.team.findUnique.mockResolvedValue(null);
    mockPrisma.team.findMany.mockResolvedValue([]);
    mockPrisma.team.update.mockResolvedValue(null);
    mockPrisma.teamMembership.findUnique.mockResolvedValue(null);
    mockPrisma.teamMembership.create.mockResolvedValue(null);
    mockPrisma.teamMembership.update.mockResolvedValue(null);
    mockPrisma.project.count.mockResolvedValue(0);
    mockPrisma.project.findUnique.mockResolvedValue(null);
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.project.create.mockResolvedValue({});
    mockPrisma.project.update.mockResolvedValue({});
    mockPrisma.project.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
  });

  // ──────────────────────────────────────
  // 계정 관리 테스트
  // ──────────────────────────────────────

  describe('listAccounts', () => {
    it('should return paginated accounts with no filter', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([3, [
        { id: '1', name: '홍길동', email: 'hong@test.com', accountStatus: AccountStatus.ACTIVE, teamMemberships: [] },
        { id: '2', name: '김철수', email: 'kim@test.com', accountStatus: AccountStatus.PENDING, teamMemberships: [] },
        { id: '3', name: '이영희', email: 'lee@test.com', accountStatus: AccountStatus.APPROVED, teamMemberships: [] },
      ]]);

      const result = await service.listAccounts({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter accounts by status', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([1, [
        { id: '2', name: '김철수', email: 'kim@test.com', accountStatus: AccountStatus.PENDING, teamMemberships: [] },
      ]]);

      const result = await service.listAccounts({ status: AccountStatus.PENDING, page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].accountStatus).toBe(AccountStatus.PENDING);
    });

    it('should compute correct totalPages', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([25, Array(10).fill({ teamMemberships: [] })]);
      const result = await service.listAccounts({ page: 1, limit: 10 });
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('updateAccountStatus', () => {
    it('should throw NOT_FOUND if member does not exist', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateAccountStatus('nonexistent', { status: AccountStatus.APPROVED }),
      ).rejects.toThrow(BusinessException);

      try {
        await service.updateAccountStatus('nonexistent', { status: AccountStatus.APPROVED });
      } catch (e) {
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect((e as BusinessException).errorCode).toBe('MEMBER_NOT_FOUND');
      }
    });

    it('should throw FORBIDDEN if trying to change ADMIN account status', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@system.local',
        roles: [MemberRole.ADMIN],
        accountStatus: AccountStatus.ACTIVE,
      });

      try {
        await service.updateAccountStatus('admin-1', { status: AccountStatus.INACTIVE });
        expect(true).toBe(false); // should not reach here
      } catch (e) {
        expect((e as BusinessException).errorCode).toBe('ADMIN_STATUS_CHANGE_FORBIDDEN');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.FORBIDDEN);
      }
    });

    it('should update account status to APPROVED and set isActive', async () => {
      const mockMember = {
        id: 'member-1',
        name: '홍길동',
        email: 'hong@test.com',
        roles: [MemberRole.MEMBER],
        accountStatus: AccountStatus.PENDING,
        isActive: false,
      };
      const updatedMember = {
        ...mockMember,
        accountStatus: AccountStatus.APPROVED,
        isActive: false,
      };

      mockPrisma.member.findUnique.mockResolvedValueOnce(mockMember);
      mockPrisma.member.update.mockResolvedValueOnce(updatedMember);

      const result = await service.updateAccountStatus('member-1', { status: AccountStatus.APPROVED });
      expect(result.accountStatus).toBe(AccountStatus.APPROVED);
    });

    it('should set isActive=false when INACTIVE', async () => {
      const mockMember = {
        id: 'member-1',
        name: '홍길동',
        email: 'hong@test.com',
        roles: [MemberRole.MEMBER],
        accountStatus: AccountStatus.ACTIVE,
        isActive: true,
      };
      const updatedMember = {
        ...mockMember,
        accountStatus: AccountStatus.INACTIVE,
        isActive: false,
      };

      mockPrisma.member.findUnique.mockResolvedValueOnce(mockMember);
      mockPrisma.member.update.mockResolvedValueOnce(updatedMember);

      const result = await service.updateAccountStatus('member-1', { status: AccountStatus.INACTIVE });
      expect(result.accountStatus).toBe(AccountStatus.INACTIVE);
      expect(result.isActive).toBe(false);
    });
  });

  // ──────────────────────────────────────
  // 팀 관리 테스트
  // ──────────────────────────────────────

  describe('listTeams', () => {
    it('should return paginated teams with no filter', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          name: '선행연구개발팀',
          teamStatus: TeamStatus.ACTIVE,
          requestedById: null,
          requestedBy: null,
          _count: { teamMemberships: 9 },
        },
      ];
      mockPrisma.$transaction.mockResolvedValueOnce([1, mockTeams]);

      const result = await service.listTeams({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].memberCount).toBe(9);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter teams by status', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce([0, []]);

      const result = await service.listTeams({ status: TeamStatus.PENDING, page: 1, limit: 20 });
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('updateTeamStatus', () => {
    it('should throw NOT_FOUND if team does not exist', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce(null);

      try {
        await service.updateTeamStatus('nonexistent', { status: TeamStatus.APPROVED });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as BusinessException).errorCode).toBe('TEAM_NOT_FOUND');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should update team status without creating membership if no requestedBy', async () => {
      const mockTeam = {
        id: 'team-1',
        name: '테스트팀',
        teamStatus: TeamStatus.PENDING,
        requestedById: null,
        requestedBy: null,
      };
      const updatedTeam = {
        id: 'team-1',
        name: '테스트팀',
        teamStatus: TeamStatus.APPROVED,
        requestedById: null,
        requestedBy: null,
      };

      mockPrisma.team.findUnique.mockResolvedValueOnce(mockTeam);
      mockPrisma.$transaction.mockImplementationOnce(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn({
          ...mockPrisma,
          team: { ...mockPrisma.team, update: mock(() => Promise.resolve(updatedTeam)) },
        });
      });

      const result = await service.updateTeamStatus('team-1', { status: TeamStatus.APPROVED });
      expect(result.teamStatus).toBe(TeamStatus.APPROVED);
    });

    it('should create TeamMembership and set LEADER role when approving team with requestedBy', async () => {
      const mockTeam = {
        id: 'team-1',
        name: '신규팀',
        teamStatus: TeamStatus.PENDING,
        requestedById: 'requester-1',
        requestedBy: { id: 'requester-1', name: '김신청', email: 'request@test.com' },
      };
      const updatedTeam = {
        id: 'team-1',
        name: '신규팀',
        teamStatus: TeamStatus.APPROVED,
        requestedById: 'requester-1',
        requestedBy: { id: 'requester-1', name: '김신청', email: 'request@test.com' },
      };
      const requesterMember = {
        id: 'requester-1',
        name: '김신청',
        email: 'request@test.com',
        roles: [MemberRole.MEMBER],
      };

      mockPrisma.team.findUnique.mockResolvedValueOnce(mockTeam);

      const membershipCreateMock = mock(() => Promise.resolve({ id: 'ms-1' }));
      const memberUpdateMock = mock(() => Promise.resolve({ ...requesterMember, roles: [MemberRole.MEMBER, MemberRole.LEADER] }));
      const teamUpdateMock = mock(() => Promise.resolve(updatedTeam));
      const membershipFindUniqueMock = mock(() => Promise.resolve(null));
      const memberFindUniqueMock = mock(() => Promise.resolve(requesterMember));

      mockPrisma.$transaction.mockImplementationOnce(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn({
          ...mockPrisma,
          team: { ...mockPrisma.team, update: teamUpdateMock },
          teamMembership: {
            findUnique: membershipFindUniqueMock,
            create: membershipCreateMock,
            update: mockPrisma.teamMembership.update,
          },
          member: {
            ...mockPrisma.member,
            findUnique: memberFindUniqueMock,
            update: memberUpdateMock,
          },
        });
      });

      const result = await service.updateTeamStatus('team-1', { status: TeamStatus.APPROVED });
      expect(result.teamStatus).toBe(TeamStatus.APPROVED);
      expect(membershipCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            memberId: 'requester-1',
            teamId: 'team-1',
            roles: [MemberRole.LEADER],
          }),
        }),
      );
    });
  });

  // ──────────────────────────────────────
  // 전역 프로젝트 관리 테스트
  // ──────────────────────────────────────

  describe('listProjects', () => {
    it('should return paginated projects', async () => {
      const mockProjects = [
        {
          id: '1',
          name: '팀공통',
          code: '공통2500-팀',
          category: 'COMMON',
          status: 'ACTIVE',
          sortOrder: 0,
          _count: { teamProjects: 1, workItems: 5 },
        },
      ];
      mockPrisma.$transaction.mockResolvedValueOnce([1, mockProjects]);

      const result = await service.listProjects({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].teamCount).toBe(1);
      expect(result.data[0].workItemCount).toBe(5);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('createProject', () => {
    it('should throw on duplicate code', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({ id: '1' } as never);

      try {
        await service.createProject({ name: '중복', code: 'DUP', category: 'COMMON' as never });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as BusinessException).errorCode).toBe('PROJECT_CODE_DUPLICATE');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.CONFLICT);
      }
    });

    it('should create project with sortOrder 0 when no existing projects', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce(null);
      mockPrisma.project.aggregate.mockResolvedValueOnce({ _max: { sortOrder: null } } as never);
      mockPrisma.project.create.mockResolvedValueOnce({
        id: '1',
        name: '신규프로젝트',
        code: 'NEW01',
        category: 'COMMON',
        status: 'ACTIVE',
        sortOrder: 0,
      } as never);

      const result = await service.createProject({ name: '신규프로젝트', code: 'NEW01', category: 'COMMON' as never });
      expect(result).toBeDefined();
    });
  });

  describe('updateProject', () => {
    it('should throw NOT_FOUND if project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce(null);

      try {
        await service.updateProject('nonexistent', { name: '변경' });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as BusinessException).errorCode).toBe('PROJECT_NOT_FOUND');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should update project status to INACTIVE', async () => {
      const existingProject = { id: '1', name: '테스트', code: 'TEST', status: 'ACTIVE' };
      mockPrisma.project.findUnique.mockResolvedValueOnce(existingProject as never);
      mockPrisma.project.update.mockResolvedValueOnce({
        ...existingProject,
        status: 'INACTIVE',
      } as never);

      const result = await service.updateProject('1', { status: 'INACTIVE' as never });
      expect(result.status).toBe('INACTIVE');
    });
  });
});
