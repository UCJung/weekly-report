import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, TaskStatusCategory } from '@prisma/client';
import { BusinessException } from '../common/filters/business-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskStatusDto } from './dto/create-task-status.dto';
import { ReorderTaskStatusesDto } from './dto/reorder-task-statuses.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Injectable()
export class TaskStatusService {
  constructor(private prisma: PrismaService) {}

  // 기본 상태 정의
  private static readonly DEFAULT_STATUSES = [
    { name: '할일', category: TaskStatusCategory.BEFORE_START, color: '#6C7A89', isDefault: true },
    { name: '진행중', category: TaskStatusCategory.IN_PROGRESS, color: '#6B5CE7', isDefault: true },
    { name: '완료', category: TaskStatusCategory.COMPLETED, color: '#27AE60', isDefault: true },
  ];

  async getByTeam(teamId: string) {
    return this.prisma.taskStatusDef.findMany({
      where: { teamId, isDeleted: false },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(teamId: string, dto: CreateTaskStatusDto) {
    // 팀 존재 확인
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new BusinessException('TEAM_NOT_FOUND', '팀을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    // sortOrder 자동배정 (현재 팀의 max+1)
    const agg = await this.prisma.taskStatusDef.aggregate({
      where: { teamId, isDeleted: false },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (agg._max.sortOrder ?? -1) + 1;

    return this.prisma.$transaction(async (tx) => {
      // isDefault=true면 동일 카테고리 기존 isDefault를 false로
      if (dto.isDefault) {
        await tx.taskStatusDef.updateMany({
          where: { teamId, category: dto.category, isDefault: true, isDeleted: false },
          data: { isDefault: false },
        });
      }

      return tx.taskStatusDef.create({
        data: {
          teamId,
          name: dto.name,
          category: dto.category,
          color: dto.color ?? '#6B5CE7',
          sortOrder: nextSortOrder,
          isDefault: dto.isDefault ?? false,
        },
      });
    });
  }

  async update(teamId: string, id: string, dto: UpdateTaskStatusDto) {
    const status = await this.prisma.taskStatusDef.findFirst({
      where: { id, teamId, isDeleted: false },
    });
    if (!status) {
      throw new BusinessException(
        'TASK_STATUS_NOT_FOUND',
        '작업 상태를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // isDefault=true면 동일 카테고리 기존 isDefault false로
      if (dto.isDefault) {
        await tx.taskStatusDef.updateMany({
          where: {
            teamId,
            category: status.category,
            isDefault: true,
            isDeleted: false,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      const updateData: Prisma.TaskStatusDefUpdateInput = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.color !== undefined) updateData.color = dto.color;
      if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;

      return tx.taskStatusDef.update({ where: { id }, data: updateData });
    });
  }

  async delete(teamId: string, id: string) {
    const status = await this.prisma.taskStatusDef.findFirst({
      where: { id, teamId, isDeleted: false },
    });
    if (!status) {
      throw new BusinessException(
        'TASK_STATUS_NOT_FOUND',
        '작업 상태를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 카테고리당 최소 1개 유지
    const categoryCount = await this.prisma.taskStatusDef.count({
      where: { teamId, category: status.category, isDeleted: false },
    });
    if (categoryCount <= 1) {
      throw new BusinessException(
        'TASK_STATUS_MIN_ONE',
        '카테고리당 최소 1개의 상태가 필요합니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 이 상태를 사용하는 PersonalTask가 있으면 동일 카테고리의 다른 상태로 이전
    return this.prisma.$transaction(async (tx) => {
      const taskCount = await tx.personalTask.count({
        where: { statusId: id, isDeleted: false },
      });

      if (taskCount > 0) {
        // 동일 카테고리에서 다른 상태 중 첫 번째 선택
        const fallbackStatus = await tx.taskStatusDef.findFirst({
          where: {
            teamId,
            category: status.category,
            isDeleted: false,
            id: { not: id },
          },
          orderBy: { sortOrder: 'asc' },
        });

        if (fallbackStatus) {
          await tx.personalTask.updateMany({
            where: { statusId: id, isDeleted: false },
            data: { statusId: fallbackStatus.id },
          });
        }
      }

      await tx.taskStatusDef.update({
        where: { id },
        data: { isDeleted: true },
      });

      return { message: '작업 상태가 삭제되었습니다.' };
    });
  }

  async reorder(teamId: string, dto: ReorderTaskStatusesDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.taskStatusDef.updateMany({
          where: { id: item.id, teamId, isDeleted: false },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return { message: '정렬이 업데이트되었습니다.' };
  }

  async createDefaultStatuses(teamId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    await Promise.all(
      TaskStatusService.DEFAULT_STATUSES.map((s, index) =>
        client.taskStatusDef.create({
          data: {
            teamId,
            name: s.name,
            category: s.category,
            color: s.color,
            sortOrder: index,
            isDefault: s.isDefault,
          },
        }),
      ),
    );
  }
}
