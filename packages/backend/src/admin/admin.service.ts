import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, TeamStatus, MemberRole, ProjectStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { ListAccountsDto } from './dto/list-accounts.dto';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { ListTeamsDto } from './dto/list-teams.dto';
import { UpdateTeamStatusDto } from './dto/update-team-status.dto';
import { CreateGlobalProjectDto } from './dto/create-global-project.dto';
import { UpdateGlobalProjectDto } from './dto/update-global-project.dto';
import { ListGlobalProjectsDto } from './dto/list-global-projects.dto';
import { ApproveProjectDto } from './dto/approve-project.dto';
import { UpdateAccountInfoDto } from './dto/update-account-info.dto';
import { parsePagination, buildPaginationResponse } from '../common/utils/pagination.util';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // ──────────────────────────────────────
  // 계정 관리
  // ──────────────────────────────────────

  async listAccounts(dto: ListAccountsDto) {
    const { skip, take, page, limit } = parsePagination(dto.page, dto.limit);

    const where: Prisma.MemberWhereInput = {};
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
          position: true,
          jobTitle: true,
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
        take,
      }),
    ]);

    return buildPaginationResponse(
      accounts.map((a) => ({
        ...a,
        teams: a.teamMemberships.map((tm) => tm.team),
        teamMemberships: undefined,
      })),
      total,
      page,
      limit,
    );
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

  async updateAccountInfo(id: string, dto: UpdateAccountInfoDto) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new BusinessException(
        'MEMBER_NOT_FOUND',
        '계정을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.member.update({
      where: { id },
      data: {
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        accountStatus: true,
        mustChangePassword: true,
        isActive: true,
        position: true,
        jobTitle: true,
        createdAt: true,
        updatedAt: true,
      },
    });
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

    const defaultPassword = this.configService.get<string>('DEFAULT_PASSWORD', 'changeme!2026');
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
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
    const { skip, take, page, limit } = parsePagination(dto.page, dto.limit);

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
        take,
      }),
    ]);

    return buildPaginationResponse(
      teams.map((t) => ({
        ...t,
        memberCount: t._count.teamMemberships,
        _count: undefined,
      })),
      total,
      page,
      limit,
    );
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

  // ──────────────────────────────────────
  // 전역 프로젝트 관리
  // ──────────────────────────────────────

  async listProjects(dto: ListGlobalProjectsDto) {
    const { skip, take, page, limit } = parsePagination(dto.page, dto.limit);

    const where: Prisma.ProjectWhereInput = {};
    if (dto.category) {
      where.category = dto.category;
    }
    if (dto.status) {
      where.status = dto.status;
    }

    const [total, projects] = await this.prisma.$transaction([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          status: true,
          sortOrder: true,
          managerId: true,
          department: true,
          description: true,
          manager: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              teamProjects: true,
              workItems: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { category: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
    ]);

    return buildPaginationResponse(
      projects.map((p) => ({
        ...p,
        managerName: p.manager?.name ?? null,
        teamCount: p._count.teamProjects,
        workItemCount: p._count.workItems,
        _count: undefined,
      })),
      total,
      page,
      limit,
    );
  }

  async createProject(dto: CreateGlobalProjectDto) {
    // 전역 코드 중복 체크
    const existing = await this.prisma.project.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BusinessException(
        'PROJECT_CODE_DUPLICATE',
        '프로젝트코드가 이미 존재합니다.',
        HttpStatus.CONFLICT,
      );
    }

    const maxSortOrder = await this.prisma.project.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.project.create({
      data: {
        name: dto.name,
        code: dto.code,
        category: dto.category,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
        ...(dto.managerId && { managerId: dto.managerId }),
        ...(dto.department && { department: dto.department }),
        ...(dto.description && { description: dto.description }),
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateProject(id: string, dto: UpdateGlobalProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new BusinessException(
        'PROJECT_NOT_FOUND',
        '프로젝트를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 코드 변경 시 중복 체크
    if (dto.code && dto.code !== project.code) {
      const existing = await this.prisma.project.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BusinessException(
          'PROJECT_CODE_DUPLICATE',
          '프로젝트코드가 이미 존재합니다.',
          HttpStatus.CONFLICT,
        );
      }
    }

    const { managerId, department, description, ...rest } = dto;
    return this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(managerId !== undefined && { managerId }),
        ...(department !== undefined && { department }),
        ...(description !== undefined && { description }),
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ──────────────────────────────────────
  // 프로젝트 승인 (PENDING → ACTIVE + code 부여)
  // ──────────────────────────────────────

  async approveProject(id: string, dto: ApproveProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new BusinessException(
        'PROJECT_NOT_FOUND',
        '프로젝트를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (project.status !== ProjectStatus.PENDING) {
      throw new BusinessException(
        'PROJECT_NOT_PENDING',
        'PENDING 상태인 프로젝트만 승인할 수 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // code 중복 체크 (ACTIVE 프로젝트와 중복 불허)
    const existingCode = await this.prisma.project.findFirst({
      where: {
        code: dto.code,
        id: { not: id },
        status: { not: ProjectStatus.INACTIVE },
      },
    });
    if (existingCode) {
      throw new BusinessException(
        'PROJECT_CODE_DUPLICATE',
        '프로젝트코드가 이미 사용 중입니다.',
        HttpStatus.CONFLICT,
      );
    }

    const approved = await this.prisma.project.update({
      where: { id },
      data: {
        code: dto.code,
        status: ProjectStatus.ACTIVE,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    this.logger.log(
      `[PROJECT_APPROVED] 프로젝트 승인: "${approved.name}" (code: ${approved.code})`,
    );

    return approved;
  }
}
