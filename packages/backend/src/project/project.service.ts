import { Injectable, HttpStatus } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProjectQueryDto) {
    const { category, status, teamId, page = 1, limit = 20 } = query;
    const where = {
      ...(category && { category }),
      ...(status && { status }),
      ...(teamId && { teamId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
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

  async create(dto: CreateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { teamId_code: { teamId: dto.teamId, code: dto.code } },
    });
    if (existing) {
      throw new BusinessException(
        'PROJECT_CODE_DUPLICATE',
        '동일 팀 내 프로젝트코드가 중복됩니다.',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        code: dto.code,
        category: dto.category,
        teamId: dto.teamId,
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findById(id);

    if (dto.code && dto.code !== project.code) {
      const existing = await this.prisma.project.findUnique({
        where: { teamId_code: { teamId: project.teamId, code: dto.code } },
      });
      if (existing) {
        throw new BusinessException(
          'PROJECT_CODE_DUPLICATE',
          '동일 팀 내 프로젝트코드가 중복됩니다.',
          HttpStatus.CONFLICT,
        );
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: dto,
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
      data: { status: ProjectStatus.COMPLETED },
    });

    return {
      ...project,
      _warning: workItemCount > 0
        ? `이 프로젝트에 ${workItemCount}건의 업무항목이 연결되어 있습니다.`
        : undefined,
    };
  }
}
