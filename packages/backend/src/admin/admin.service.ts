import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { AccountStatus, TeamStatus, MemberRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { ListAccountsDto } from './dto/list-accounts.dto';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { ListTeamsDto } from './dto/list-teams.dto';
import { UpdateTeamStatusDto } from './dto/update-team-status.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────
  // 계정 관리
  // ──────────────────────────────────────

  async listAccounts(dto: ListAccountsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dto.status) {
      where.accountStatus = dto.status;
    }
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [total, accounts] = await this.prisma.$transaction([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
          accountStatus: true,
          mustChangePassword: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          teamMemberships: {
            select: {
              team: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: accounts.map((a) => ({
        ...a,
        teams: a.teamMemberships.map((tm) => tm.team),
        teamMemberships: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateAccountStatus(id: string, dto: UpdateAccountStatusDto) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new BusinessException(
        'MEMBER_NOT_FOUND',
        '계정을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // ADMIN 계정은 상태 변경 불가
    if (member.roles.includes(MemberRole.ADMIN)) {
      throw new BusinessException(
        'ADMIN_STATUS_CHANGE_FORBIDDEN',
        'ADMIN 계정의 상태는 변경할 수 없습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.prisma.member.update({
      where: { id },
      data: {
        accountStatus: dto.status,
        // APPROVED → ACTIVE 전환 시 isActive 활성화
        ...(dto.status === AccountStatus.ACTIVE && { isActive: true }),
        // INACTIVE → isActive 비활성화
        ...(dto.status === AccountStatus.INACTIVE && { isActive: false }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        accountStatus: true,
        mustChangePassword: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // 승인(APPROVED) 시 이메일 알림 (Logger 기반)
    if (dto.status === AccountStatus.APPROVED) {
      this.logger.log(
        `[EMAIL] 계정 승인 알림 → ${member.email} (${member.name})\n` +
        `  제목: 계정 가입이 승인되었습니다.\n` +
        `  내용: 안녕하세요, ${member.name}님. 귀하의 계정이 관리자에 의해 승인되었습니다. 이제 로그인하실 수 있습니다.`,
      );
    }

    // INACTIVE 시 알림
    if (dto.status === AccountStatus.INACTIVE) {
      this.logger.log(
        `[EMAIL] 계정 종료 알림 → ${member.email} (${member.name})\n` +
        `  제목: 계정이 비활성화되었습니다.\n` +
        `  내용: 안녕하세요, ${member.name}님. 귀하의 계정이 비활성화되었습니다. 문의사항은 관리자에게 연락하세요.`,
      );
    }

    return updated;
  }

  async resetPassword(id: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new BusinessException(
        'MEMBER_NOT_FOUND',
        '계정을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (member.roles.includes(MemberRole.ADMIN)) {
      throw new BusinessException(
        'ADMIN_PASSWORD_RESET_FORBIDDEN',
        'ADMIN 계정의 비밀번호는 초기화할 수 없습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const updated = await this.prisma.member.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mustChangePassword: true,
      },
    });

    this.logger.log(
      `[PASSWORD_RESET] 비밀번호 초기화 → ${member.email} (${member.name})`,
    );

    return updated;
  }

  // ──────────────────────────────────────
  // 팀 관리
  // ──────────────────────────────────────

  async listTeams(dto: ListTeamsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = dto.status ? { teamStatus: dto.status } : {};

    const [total, teams] = await this.prisma.$transaction([
      this.prisma.team.count({ where }),
      this.prisma.team.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          teamStatus: true,
          requestedById: true,
          createdAt: true,
          updatedAt: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              teamMemberships: {
                where: {
                  member: { accountStatus: 'ACTIVE' },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: teams.map((t) => ({
        ...t,
        memberCount: t._count.teamMemberships,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTeamStatus(id: string, dto: UpdateTeamStatusDto) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { requestedBy: true },
    });
    if (!team) {
      throw new BusinessException(
        'TEAM_NOT_FOUND',
        '팀을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedTeam = await tx.team.update({
        where: { id },
        data: { teamStatus: dto.status },
        select: {
          id: true,
          name: true,
          description: true,
          teamStatus: true,
          requestedById: true,
          updatedAt: true,
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 팀 승인(APPROVED) 시 신청자를 LEADER로 설정 및 TeamMembership 생성
      if (dto.status === TeamStatus.APPROVED && team.requestedById) {
        const requesterId = team.requestedById;

        // 기존 멤버십 확인
        const existingMembership = await tx.teamMembership.findUnique({
          where: { memberId_teamId: { memberId: requesterId, teamId: id } },
        });

        if (!existingMembership) {
          await tx.teamMembership.create({
            data: {
              memberId: requesterId,
              teamId: id,
              roles: [MemberRole.LEADER],
              sortOrder: 0,
            },
          });
        } else {
          // 이미 멤버십이 있으면 LEADER 역할 추가
          const roles = new Set(existingMembership.roles);
          roles.add(MemberRole.LEADER);
          await tx.teamMembership.update({
            where: { memberId_teamId: { memberId: requesterId, teamId: id } },
            data: { roles: { set: Array.from(roles) } },
          });
        }

        // Member.roles에도 LEADER 추가 (하위 호환)
        const requester = await tx.member.findUnique({ where: { id: requesterId } });
        if (requester && !requester.roles.includes(MemberRole.LEADER)) {
          const newRoles = new Set(requester.roles);
          newRoles.add(MemberRole.LEADER);
          await tx.member.update({
            where: { id: requesterId },
            data: { roles: { set: Array.from(newRoles) } },
          });
        }

        this.logger.log(
          `[EMAIL] 팀 승인 알림 → 신청자(${team.requestedBy?.email})\n` +
          `  제목: 팀 생성이 승인되었습니다.\n` +
          `  내용: "${team.name}" 팀 생성이 승인되었습니다. 귀하는 팀장으로 설정되었습니다.`,
        );
      }

      return updatedTeam;
    });

    return updated;
  }
}
