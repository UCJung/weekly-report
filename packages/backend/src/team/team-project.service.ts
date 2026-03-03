import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { AddTeamProjectsDto } from './dto/add-team-projects.dto';
import { ReorderTeamProjectsDto } from './dto/reorder-team-projects.dto';

@Injectable()
export class TeamProjectService {
  constructor(private prisma: PrismaService) {}

  async findTeamProjects(teamId: string) {
    const teamProjects = await this.prisma.teamProject.findMany({
      where: { teamId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            status: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }],
    });

    return teamProjects.map((tp) => ({
      teamProjectId: tp.id,
      sortOrder: tp.sortOrder,
      ...tp.project,
    }));
  }

  async addTeamProjects(teamId: string, dto: AddTeamProjectsDto) {
    // 팀 존재 확인
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new BusinessException(
        'TEAM_NOT_FOUND',
        '팀을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 프로젝트들 존재 확인
    const projects = await this.prisma.project.findMany({
      where: { id: { in: dto.projectIds } },
    });
    if (projects.length !== dto.projectIds.length) {
      throw new BusinessException(
        'PROJECT_NOT_FOUND',
        '존재하지 않는 프로젝트가 포함되어 있습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // ACTIVE 상태 프로젝트만 팀에 추가 가능
    const inactiveProjects = projects.filter((p) => p.status !== 'ACTIVE');
    if (inactiveProjects.length > 0) {
      throw new BusinessException(
        'PROJECT_NOT_ACTIVE',
        `ACTIVE 상태인 프로젝트만 팀에 추가할 수 있습니다. (비활성: ${inactiveProjects.map((p) => p.name).join(', ')})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 이미 등록된 프로젝트 필터링
    const existing = await this.prisma.teamProject.findMany({
      where: { teamId, projectId: { in: dto.projectIds } },
      select: { projectId: true },
    });
    const existingProjectIds = new Set(existing.map((e) => e.projectId));
    const newProjectIds = dto.projectIds.filter((id) => !existingProjectIds.has(id));

    if (newProjectIds.length === 0) {
      return { added: 0, message: '이미 모두 등록된 프로젝트입니다.' };
    }

    // 현재 최대 sortOrder 조회
    const maxSortOrder = await this.prisma.teamProject.aggregate({
      where: { teamId },
      _max: { sortOrder: true },
    });
    let nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    // 새 TeamProject 생성
    await this.prisma.$transaction(
      newProjectIds.map((projectId) =>
        this.prisma.teamProject.create({
          data: { teamId, projectId, sortOrder: nextSortOrder++ },
        })
      )
    );

    return { added: newProjectIds.length, message: `${newProjectIds.length}개 프로젝트가 팀에 등록되었습니다.` };
  }

  async removeTeamProject(teamId: string, projectId: string) {
    const teamProject = await this.prisma.teamProject.findUnique({
      where: { teamId_projectId: { teamId, projectId } },
    });
    if (!teamProject) {
      throw new BusinessException(
        'TEAM_PROJECT_NOT_FOUND',
        '해당 팀에 등록된 프로젝트를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 이 프로젝트를 사용 중인 주간업무 항목 수 확인
    const workItemCount = await this.prisma.workItem.count({
      where: {
        projectId,
        weeklyReport: {
          member: {
            teamMemberships: {
              some: { teamId },
            },
          },
        },
      },
    });

    await this.prisma.teamProject.delete({
      where: { teamId_projectId: { teamId, projectId } },
    });

    return {
      message: '팀에서 프로젝트가 해제되었습니다.',
      _warning: workItemCount > 0
        ? `이 프로젝트에 ${workItemCount}건의 기존 업무항목이 있습니다. 조회는 가능하나 신규 작성은 불가합니다.`
        : undefined,
    };
  }

  async reorderTeamProjects(teamId: string, dto: ReorderTeamProjectsDto) {
    return this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.teamProject.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
