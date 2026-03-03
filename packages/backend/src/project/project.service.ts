import { Injectable, HttpStatus } from '@nestjs/common';
import { ProjectStatus, MemberRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';
import { RequestProjectDto } from './dto/request-project.dto';

const PROJECT_INCLUDE = {
  manager: {
    select: { id: true, name: true, email: true },
  },
} as const;

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProjectQueryDto) {
    const { category, status, page = 1, limit = 20 } = query;
    const where: Prisma.ProjectWhereInput = {
      ...(category && { category }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: PROJECT_INCLUDE,
        orderBy: [{ sortOrder: 'asc' }, { category: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: PROJECT_INCLUDE,
    });
    if (!project) {
      throw new BusinessException(
        'PROJECT_NOT_FOUND',
        '프로젝트를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findById(id);
    const { managerId, department, description, ...rest } = dto;
    return this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(managerId !== undefined && { managerId }),
        ...(department !== undefined && { department }),
        ...(description !== undefined && { description }),
      },
      include: PROJECT_INCLUDE,
    });
  }

  async reorder(dto: ReorderProjectsDto) {
    return this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.project.update({ where: { id }, data: { sortOrder: index } })
      )
    );
  }

  async softDelete(id: string) {
    await this.findById(id);

    const workItemCount = await this.prisma.workItem.count({
      where: { projectId: id },
    });

    const project = await this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.INACTIVE },
      include: PROJECT_INCLUDE,
    });

    return {
      ...project,
      _warning: workItemCount > 0
        ? `이 프로젝트에 ${workItemCount}건의 업무항목이 연결되어 있습니다.`
        : undefined,
    };
  }

  // ──────────────────────────────────────
  // 프로젝트 생성 요청 (LEADER/PART_LEADER)
  // ──────────────────────────────────────

  async requestProject(dto: RequestProjectDto, requesterId: string) {
    // managerId 미지정 시 요청자 본인으로 설정
    const managerId = dto.managerId ?? requesterId;

    // managerId가 지정된 경우 존재 여부 확인
    const manager = await this.prisma.member.findUnique({ where: { id: managerId } });
    if (!manager) {
      throw new BusinessException(
        'MEMBER_NOT_FOUND',
        '지정한 책임자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 이름 중복 체크 (PENDING/ACTIVE 기준)
    const existingByName = await this.prisma.project.findFirst({
      where: {
        name: dto.name,
        status: { not: ProjectStatus.INACTIVE },
      },
    });
    if (existingByName) {
      throw new BusinessException(
        'PROJECT_NAME_DUPLICATE',
        '동일한 이름의 프로젝트가 이미 존재합니다.',
        HttpStatus.CONFLICT,
      );
    }

    const maxSortOrder = await this.prisma.project.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.project.create({
      data: {
        name: dto.name,
        code: `PENDING-${Date.now()}`, // 임시 코드: 승인 시 실제 코드로 교체
        category: dto.category,
        status: ProjectStatus.PENDING,
        managerId,
        department: dto.department,
        description: dto.description,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      },
      include: PROJECT_INCLUDE,
    });
  }

  // ──────────────────────────────────────
  // 내 책임 프로젝트 목록
  // ──────────────────────────────────────

  async findManagedProjects(memberId: string, status?: ProjectStatus) {
    const where: Prisma.ProjectWhereInput = {
      managerId: memberId,
      ...(status && { status }),
    };

    const projects = await this.prisma.project.findMany({
      where,
      include: PROJECT_INCLUDE,
      orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return projects;
  }

  // ──────────────────────────────────────
  // 역할 검증 헬퍼
  // ──────────────────────────────────────

  async validateLeaderOrPartLeader(memberId: string): Promise<void> {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new BusinessException(
        'MEMBER_NOT_FOUND',
        '계정을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }
    const allowedRoles: MemberRole[] = [MemberRole.ADMIN, MemberRole.LEADER, MemberRole.PART_LEADER];
    const hasRole = member.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      throw new BusinessException(
        'FORBIDDEN',
        '프로젝트 생성 요청은 팀장 또는 파트장만 가능합니다.',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
