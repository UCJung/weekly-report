import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { HttpStatus } from '@nestjs/common';
import { JoinRequestStatus, MemberRole, TeamStatus } from '@prisma/client';
import { TeamJoinService } from './team-join.service';
import { BusinessException } from '../common/filters/business-exception';
import { TeamFilter } from './dto/list-teams-query.dto';

// ── Prisma mock ────────────────────────────────────────────────────────────

const mockPrisma = {
  team: {
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    count: mock(() => Promise.resolve(0)),
    create: mock(() => Promise.resolve({})),
  },
  part: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  teamMembership: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
  },
  teamJoinRequest: {
    findFirst: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
  },
  member: {
    findUnique: mock(() => Promise.resolve(null)),
  },
  $transaction: mock((ops: unknown[]) =>
    Promise.all(Array.isArray(ops) ? ops : []),
  ),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('TeamJoinService', () => {
  let service: TeamJoinService;

  beforeEach(() => {
    service = new TeamJoinService(mockPrisma as never);
    // 각 테스트 전 mock 초기화
    mockPrisma.team.findUnique.mockReset();
    mockPrisma.team.findMany.mockReset();
    mockPrisma.team.count.mockReset();
    mockPrisma.team.create.mockReset();
    mockPrisma.part.findFirst.mockReset();
    mockPrisma.teamMembership.findMany.mockReset();
    mockPrisma.teamMembership.findUnique.mockReset();
    mockPrisma.teamJoinRequest.findFirst.mockReset();
    mockPrisma.teamJoinRequest.findMany.mockReset();
    mockPrisma.teamJoinRequest.create.mockReset();
    mockPrisma.teamJoinRequest.update.mockReset();
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.$transaction.mockReset();
  });

  // ── listTeams ────────────────────────────────────────────────────────────

  describe('listTeams', () => {
    it('should return paginated team list for ALL filter', async () => {
      mockPrisma.teamMembership.findMany.mockResolvedValueOnce([]);
      const teams = [
        { id: 't1', name: '팀A', description: null, teamStatus: TeamStatus.ACTIVE, createdAt: new Date(), _count: { teamMemberships: 3 } },
      ];
      mockPrisma.team.findMany.mockResolvedValueOnce(teams as never);
      mockPrisma.team.count.mockResolvedValueOnce(1);

      const result = await service.listTeams({ filter: TeamFilter.ALL, page: 1, limit: 20 }, 'member-1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].memberCount).toBe(3);
      expect(result.data[0].isMember).toBe(false);
      expect(result.pagination.total).toBe(1);
    });

    it('should mark team as joined when member has membership', async () => {
      mockPrisma.teamMembership.findMany.mockResolvedValueOnce([{ teamId: 't1' }]);
      const teams = [
        { id: 't1', name: '팀A', description: null, teamStatus: TeamStatus.ACTIVE, createdAt: new Date(), _count: { teamMemberships: 5 } },
      ];
      mockPrisma.team.findMany.mockResolvedValueOnce(teams as never);
      mockPrisma.team.count.mockResolvedValueOnce(1);

      const result = await service.listTeams({ filter: TeamFilter.JOINED }, 'member-1');
      expect(result.data[0].isMember).toBe(true);
    });
  });

  // ── requestCreateTeam ────────────────────────────────────────────────────

  describe('requestCreateTeam', () => {
    it('should throw CONFLICT on duplicate team name', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({ id: 'existing' } as never);

      try {
        await service.requestCreateTeam({ teamName: '중복팀' }, 'member-1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('TEAM_NAME_DUPLICATE');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.CONFLICT);
      }
    });

    it('should create a team with PENDING status', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce(null);
      const newTeam = { id: 'new-team', name: '신규팀', teamStatus: TeamStatus.PENDING };
      mockPrisma.team.create.mockResolvedValueOnce(newTeam as never);

      const result = await service.requestCreateTeam({ teamName: '신규팀' }, 'member-1');
      expect(result.teamStatus).toBe(TeamStatus.PENDING);
    });
  });

  // ── requestJoinTeam ──────────────────────────────────────────────────────

  describe('requestJoinTeam', () => {
    it('should throw NOT_FOUND when team does not exist', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce(null);

      try {
        await service.requestJoinTeam('nonexistent-team', 'member-1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('TEAM_NOT_FOUND');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should throw BAD_REQUEST for PENDING team', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({ id: 't1', teamStatus: TeamStatus.PENDING } as never);

      try {
        await service.requestJoinTeam('t1', 'member-1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('TEAM_NOT_AVAILABLE');
      }
    });

    it('should throw CONFLICT when already joined', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({ id: 't1', teamStatus: TeamStatus.ACTIVE } as never);
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce({ id: 'ms-1' } as never);

      try {
        await service.requestJoinTeam('t1', 'member-1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('ALREADY_JOINED');
      }
    });

    it('should throw CONFLICT when pending join request exists', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({ id: 't1', teamStatus: TeamStatus.ACTIVE } as never);
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce(null);
      mockPrisma.teamJoinRequest.findFirst.mockResolvedValueOnce({ id: 'req-1', status: JoinRequestStatus.PENDING } as never);

      try {
        await service.requestJoinTeam('t1', 'member-1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('JOIN_REQUEST_ALREADY_EXISTS');
      }
    });

    it('should create join request successfully', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({ id: 't1', teamStatus: TeamStatus.ACTIVE } as never);
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce(null);
      mockPrisma.teamJoinRequest.findFirst.mockResolvedValueOnce(null);
      const joinRequest = {
        id: 'req-new',
        memberId: 'member-1',
        teamId: 't1',
        status: JoinRequestStatus.PENDING,
        member: { id: 'member-1', name: '홍길동', email: 'hong@test.com' },
        team: { id: 't1', name: '팀A' },
      };
      mockPrisma.teamJoinRequest.create.mockResolvedValueOnce(joinRequest as never);

      const result = await service.requestJoinTeam('t1', 'member-1');
      expect(result.status).toBe(JoinRequestStatus.PENDING);
    });
  });

  // ── listJoinRequests ─────────────────────────────────────────────────────

  describe('listJoinRequests', () => {
    it('should throw FORBIDDEN when requester has no permission', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce(null);
      mockPrisma.member.findUnique.mockResolvedValueOnce({ roles: [MemberRole.MEMBER] } as never);

      try {
        await service.listJoinRequests('t1', 'regular-member');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('FORBIDDEN');
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.FORBIDDEN);
      }
    });

    it('should return join requests for team leader', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce({
        id: 'ms-1', roles: [MemberRole.LEADER],
      } as never);
      const requests = [
        { id: 'req-1', memberId: 'm1', teamId: 't1', status: JoinRequestStatus.PENDING, member: { id: 'm1', name: '신청자', email: 'a@b.com', roles: [MemberRole.MEMBER] } },
      ];
      mockPrisma.teamJoinRequest.findMany.mockResolvedValueOnce(requests as never);

      const result = await service.listJoinRequests('t1', 'leader-member');
      expect(result).toHaveLength(1);
    });

    it('should return join requests for global leader (no membership)', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce(null);
      mockPrisma.member.findUnique.mockResolvedValueOnce({ roles: [MemberRole.LEADER] } as never);
      mockPrisma.teamJoinRequest.findMany.mockResolvedValueOnce([] as never);

      const result = await service.listJoinRequests('t1', 'global-leader');
      expect(result).toHaveLength(0);
    });
  });

  // ── reviewJoinRequest ────────────────────────────────────────────────────

  describe('reviewJoinRequest', () => {
    it('should throw NOT_FOUND when join request does not exist', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce({ id: 'ms-1', roles: [MemberRole.LEADER] } as never);
      mockPrisma.teamJoinRequest.findFirst.mockResolvedValueOnce(null);

      try {
        await service.reviewJoinRequest('t1', 'req-nonexistent', { status: JoinRequestStatus.APPROVED }, 'leader-1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('JOIN_REQUEST_NOT_FOUND');
      }
    });

    it('should throw BAD_REQUEST when request is already processed', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce({ id: 'ms-1', roles: [MemberRole.LEADER] } as never);
      mockPrisma.teamJoinRequest.findFirst.mockResolvedValueOnce({
        id: 'req-1', memberId: 'm1', teamId: 't1', status: JoinRequestStatus.APPROVED,
      } as never);

      try {
        await service.reviewJoinRequest('t1', 'req-1', { status: JoinRequestStatus.APPROVED }, 'leader-1');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('JOIN_REQUEST_ALREADY_PROCESSED');
      }
    });

    it('should approve request and create membership via transaction', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce({ id: 'ms-1', roles: [MemberRole.LEADER] } as never);
      mockPrisma.teamJoinRequest.findFirst.mockResolvedValueOnce({
        id: 'req-1', memberId: 'm1', teamId: 't1', status: JoinRequestStatus.PENDING,
      } as never);
      const updatedRequest = { id: 'req-1', status: JoinRequestStatus.APPROVED };
      mockPrisma.$transaction.mockResolvedValueOnce([updatedRequest, {}] as never);

      const result = await service.reviewJoinRequest(
        't1', 'req-1', { status: JoinRequestStatus.APPROVED }, 'leader-1',
      );
      expect(result.status).toBe(JoinRequestStatus.APPROVED);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should reject request and update status to REJECTED', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce({ id: 'ms-1', roles: [MemberRole.LEADER] } as never);
      mockPrisma.teamJoinRequest.findFirst.mockResolvedValueOnce({
        id: 'req-1', memberId: 'm1', teamId: 't1', status: JoinRequestStatus.PENDING,
      } as never);
      mockPrisma.teamJoinRequest.update.mockResolvedValueOnce({
        id: 'req-1', status: JoinRequestStatus.REJECTED,
      } as never);

      const result = await service.reviewJoinRequest(
        't1', 'req-1', { status: JoinRequestStatus.REJECTED }, 'leader-1',
      );
      expect(result.status).toBe(JoinRequestStatus.REJECTED);
    });
  });

  // ── getMyTeams ───────────────────────────────────────────────────────────

  describe('getMyTeams', () => {
    it('should return my team list based on memberships', async () => {
      const memberships = [
        {
          id: 'ms-1',
          roles: [MemberRole.MEMBER],
          createdAt: new Date(),
          team: { id: 't1', name: '팀A', description: null, teamStatus: TeamStatus.ACTIVE, _count: { teamMemberships: 5 } },
          part: { id: 'p1', name: 'DX' },
        },
      ];
      mockPrisma.teamMembership.findMany.mockResolvedValueOnce(memberships as never);

      const result = await service.getMyTeams('member-1');
      expect(result).toHaveLength(1);
      expect(result[0].teamName).toBe('팀A');
      expect(result[0].partName).toBe('DX');
      expect(result[0].memberCount).toBe(5);
    });

    it('should return empty array when member has no team', async () => {
      mockPrisma.teamMembership.findMany.mockResolvedValueOnce([]);
      const result = await service.getMyTeams('member-no-team');
      expect(result).toHaveLength(0);
    });
  });
});
