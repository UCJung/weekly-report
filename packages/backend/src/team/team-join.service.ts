import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { JoinRequestStatus, MemberRole, TeamStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { ReviewJoinRequestDto } from './dto/review-join-request.dto';
import { ListTeamsQueryDto, TeamFilter } from './dto/list-teams-query.dto';

@Injectable()
export class TeamJoinService {
  private readonly logger = new Logger(TeamJoinService.name);

  constructor(private prisma: PrismaService) {}

  // ── 팀 목록 조회 (검색, 필터, 페이지네이션) ──────────────────────────────

  async listTeams(query: ListTeamsQueryDto, memberId: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter = query.filter ?? TeamFilter.ALL;

    // 현재 사용자의 소속 팀 ID 목록
    const myMemberships = await this.prisma.teamMembership.findMany({
      where: { memberId },
      select: { teamId: true },
    });
    const myTeamIds = myMemberships.map((m) => m.teamId);

    const whereConditions: Record<string, unknown> = {
      teamStatus: { in: [TeamStatus.APPROVED, TeamStatus.ACTIVE] },
    };

    if (query.search) {
      whereConditions.name = { contains: query.search, mode: 'insensitive' };
    }

    if (filter === TeamFilter.JOINED) {
      whereConditions.id = { in: myTeamIds };
    } else if (filter === TeamFilter.UNJOINED) {
      whereConditions.id = { notIn: myTeamIds };
    }

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          description: true,
          teamStatus: true,
          createdAt: true,
          _count: { select: { teamMemberships: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.team.count({ where: whereConditions }),
    ]);

    // 내 가입 여부 표시
    const result = teams.map((team) => ({
      ...team,
      memberCount: team._count.teamMemberships,
      isMember: myTeamIds.includes(team.id),
      _count: undefined,
    }));

    return {
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── 팀 생성 신청 ─────────────────────────────────────────────────────────

  async requestCreateTeam(dto: CreateTeamRequestDto, requestedById: string) {
    const existing = await this.prisma.team.findUnique({
      where: { name: dto.teamName },
    });
    if (existing) {
      throw new BusinessException(
        'TEAM_NAME_DUPLICATE',
        '이미 존재하는 팀 이름입니다.',
        HttpStatus.CONFLICT,
      );
    }

    const team = await this.prisma.team.create({
      data: {
        name: dto.teamName,
        description: dto.description,
        teamStatus: TeamStatus.PENDING,
        requestedById,
      },
    });

    this.logger.log(`팀 생성 신청: ${team.name} (요청자: ${requestedById})`);
    return team;
  }

  // ── 멤버 가입 신청 ────────────────────────────────────────────────────────

  async requestJoinTeam(teamId: string, memberId: string) {
    // 팀 존재 여부 확인
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new BusinessException(
        'TEAM_NOT_FOUND',
        '팀을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (team.teamStatus !== TeamStatus.APPROVED && team.teamStatus !== TeamStatus.ACTIVE) {
      throw new BusinessException(
        'TEAM_NOT_AVAILABLE',
        '가입 신청이 불가능한 팀입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 이미 가입된 멤버인지 확인
    const existingMembership = await this.prisma.teamMembership.findUnique({
      where: { memberId_teamId: { memberId, teamId } },
    });
    if (existingMembership) {
      throw new BusinessException(
        'ALREADY_JOINED',
        '이미 가입된 팀입니다.',
        HttpStatus.CONFLICT,
      );
    }

    // 이미 PENDING 신청이 있는지 확인
    const existingRequest = await this.prisma.teamJoinRequest.findFirst({
      where: { memberId, teamId, status: JoinRequestStatus.PENDING },
    });
    if (existingRequest) {
      throw new BusinessException(
        'JOIN_REQUEST_ALREADY_EXISTS',
        '이미 가입 신청 중입니다.',
        HttpStatus.CONFLICT,
      );
    }

    const joinRequest = await this.prisma.teamJoinRequest.create({
      data: { memberId, teamId },
      include: {
        member: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`멤버 가입 신청: 팀(${teamId}), 멤버(${memberId})`);
    return joinRequest;
  }

  // ── 멤버 신청 목록 조회 (팀장/파트장 전용) ────────────────────────────────

  async listJoinRequests(teamId: string, requestingMemberId: string) {
    // 권한 확인: 해당 팀의 팀장 또는 파트장인지
    await this.assertLeaderOrPartLeader(teamId, requestingMemberId);

    const requests = await this.prisma.teamJoinRequest.findMany({
      where: { teamId },
      include: {
        member: {
          select: { id: true, name: true, email: true, roles: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  // ── 멤버 신청 승인/거절 (팀장/파트장 전용) ────────────────────────────────

  async reviewJoinRequest(
    teamId: string,
    requestId: string,
    dto: ReviewJoinRequestDto,
    reviewingMemberId: string,
  ) {
    // 권한 확인: 해당 팀의 팀장 또는 파트장인지
    await this.assertLeaderOrPartLeader(teamId, reviewingMemberId);

    // 신청 존재 여부 확인
    const joinRequest = await this.prisma.teamJoinRequest.findFirst({
      where: { id: requestId, teamId },
    });
    if (!joinRequest) {
      throw new BusinessException(
        'JOIN_REQUEST_NOT_FOUND',
        '가입 신청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new BusinessException(
        'JOIN_REQUEST_ALREADY_PROCESSED',
        '이미 처리된 가입 신청입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.status === JoinRequestStatus.APPROVED) {
      // 승인: TeamMembership 생성
      if (dto.partId) {
        // partId가 해당 팀에 속하는지 확인
        const part = await this.prisma.part.findFirst({
          where: { id: dto.partId, teamId },
        });
        if (!part) {
          throw new BusinessException(
            'PART_NOT_FOUND',
            '해당 팀에 속하는 파트를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND,
          );
        }
      }

      const [updatedRequest] = await this.prisma.$transaction([
        this.prisma.teamJoinRequest.update({
          where: { id: requestId },
          data: { status: JoinRequestStatus.APPROVED },
        }),
        this.prisma.teamMembership.create({
          data: {
            memberId: joinRequest.memberId,
            teamId,
            partId: dto.partId ?? null,
            roles: [MemberRole.MEMBER],
          },
        }),
      ]);

      this.logger.log(
        `가입 신청 승인: 요청(${requestId}), 팀(${teamId}), 멤버(${joinRequest.memberId})`,
      );
      return updatedRequest;
    } else {
      // 거절: status만 REJECTED로 변경 (재신청 가능)
      const updated = await this.prisma.teamJoinRequest.update({
        where: { id: requestId },
        data: { status: JoinRequestStatus.REJECTED },
      });

      this.logger.log(
        `가입 신청 거절: 요청(${requestId}), 팀(${teamId}), 멤버(${joinRequest.memberId})`,
      );
      return updated;
    }
  }

  // ── 내 소속 팀 목록 ────────────────────────────────────────────────────────

  async getMyTeams(memberId: string) {
    const memberships = await this.prisma.teamMembership.findMany({
      where: { memberId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            teamStatus: true,
            _count: { select: { teamMemberships: true } },
          },
        },
        part: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      teamId: m.team.id,
      teamName: m.team.name,
      teamDescription: m.team.description,
      teamStatus: m.team.teamStatus,
      memberCount: m.team._count.teamMemberships,
      partId: m.part?.id ?? null,
      partName: m.part?.name ?? null,
      roles: m.roles,
      joinedAt: m.createdAt,
    }));
  }

  // ── 내부 헬퍼: 팀장 또는 파트장 여부 확인 ─────────────────────────────────

  private async assertLeaderOrPartLeader(teamId: string, memberId: string) {
    // TeamMembership 기반으로 역할 확인
    const membership = await this.prisma.teamMembership.findUnique({
      where: { memberId_teamId: { memberId, teamId } },
    });

    if (!membership) {
      // 소속이 없어도 전역 LEADER/ADMIN 이면 허용 (member 직접 조회)
      const member = await this.prisma.member.findUnique({
        where: { id: memberId },
        select: { roles: true },
      });
      const isGlobalLeader =
        member?.roles.includes(MemberRole.LEADER) ||
        member?.roles.includes(MemberRole.ADMIN);
      if (!isGlobalLeader) {
        throw new BusinessException(
          'FORBIDDEN',
          '팀장 또는 파트장만 접근할 수 있습니다.',
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }

    const hasPermission =
      membership.roles.includes(MemberRole.LEADER) ||
      membership.roles.includes(MemberRole.PART_LEADER) ||
      membership.roles.includes(MemberRole.ADMIN);

    if (!hasPermission) {
      // member 직접 조회로 전역 역할도 확인
      const member = await this.prisma.member.findUnique({
        where: { id: memberId },
        select: { roles: true },
      });
      const isGlobalLeader =
        member?.roles.includes(MemberRole.LEADER) ||
        member?.roles.includes(MemberRole.ADMIN);
      if (!isGlobalLeader) {
        throw new BusinessException(
          'FORBIDDEN',
          '팀장 또는 파트장만 접근할 수 있습니다.',
          HttpStatus.FORBIDDEN,
        );
      }
    }
  }
}
