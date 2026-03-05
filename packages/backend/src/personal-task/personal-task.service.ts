import {
  Injectable,
  Logger,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma, TaskStatus, TaskPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { CreatePersonalTaskDto } from './dto/create-personal-task.dto';
import { UpdatePersonalTaskDto } from './dto/update-personal-task.dto';
import {
  ListPersonalTasksQueryDto,
  TaskStatusFilter,
  TaskPeriodFilter,
  TaskSortBy,
} from './dto/list-personal-tasks-query.dto';
import { ReorderPersonalTasksDto } from './dto/reorder-personal-tasks.dto';

@Injectable()
export class PersonalTaskService {
  private readonly logger = new Logger(PersonalTaskService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(memberId: string, query: ListPersonalTasksQueryDto) {
    const { teamId, status, projectId, priority, period, q, sortBy } = query;

    // 반복 작업 자동 생성 (조회 전 처리)
    await this.createRecurringTasksIfNeeded(memberId, teamId);

    const where: Prisma.PersonalTaskWhereInput = {
      memberId,
      teamId,
      isDeleted: false,
    };

    // status 필터
    if (status && status !== TaskStatusFilter.ALL) {
      where.status = status as unknown as TaskStatus;
    }

    // projectId 필터
    if (projectId) {
      where.projectId = projectId;
    }

    // priority 필터
    if (priority) {
      where.priority = priority as TaskPriority;
    }

    // period 필터
    if (period) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      if (period === TaskPeriodFilter.TODAY) {
        where.dueDate = { gte: todayStart, lt: tomorrowStart };
      } else if (period === TaskPeriodFilter.THIS_WEEK) {
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(todayStart.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        where.dueDate = { gte: weekStart, lt: weekEnd };
      } else if (period === TaskPeriodFilter.THIS_MONTH) {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        where.dueDate = { gte: monthStart, lt: monthEnd };
      } else if (period === TaskPeriodFilter.OVERDUE) {
        where.dueDate = { lt: todayStart };
        where.status = { not: TaskStatus.DONE };
      }
    }

    // 검색어 필터
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { memo: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 정렬
    let orderBy: Prisma.PersonalTaskOrderByWithRelationInput | Prisma.PersonalTaskOrderByWithRelationInput[];

    switch (sortBy) {
      case TaskSortBy.DUE_DATE:
        orderBy = [{ dueDate: 'asc' }, { sortOrder: 'asc' }];
        break;
      case TaskSortBy.PRIORITY:
        orderBy = [{ priority: 'asc' }, { sortOrder: 'asc' }];
        break;
      case TaskSortBy.CREATED_AT:
        orderBy = { createdAt: 'desc' };
        break;
      case TaskSortBy.PROJECT:
        orderBy = [{ project: { name: 'asc' } }, { sortOrder: 'asc' }];
        break;
      default:
        orderBy = { sortOrder: 'asc' };
        break;
    }

    const tasks = await this.prisma.personalTask.findMany({
      where,
      orderBy,
      include: {
        project: {
          select: { id: true, name: true, code: true, category: true },
        },
      },
    });

    return tasks;
  }

  async create(memberId: string, dto: CreatePersonalTaskDto) {
    const { teamId, dueDate, repeatConfig, ...rest } = dto;

    // sortOrder 최댓값 + 1
    const maxSortOrder = await this.prisma.personalTask.aggregate({
      where: { memberId, teamId, isDeleted: false },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const task = await this.prisma.personalTask.create({
      data: {
        ...rest,
        memberId,
        teamId,
        sortOrder: nextSortOrder,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        repeatConfig: repeatConfig as Prisma.InputJsonValue | undefined,
      },
      include: {
        project: {
          select: { id: true, name: true, code: true, category: true },
        },
      },
    });

    this.logger.log(`PersonalTask created: ${task.id} by member ${memberId}`);
    return task;
  }

  async update(id: string, memberId: string, dto: UpdatePersonalTaskDto) {
    await this.findAndVerifyOwner(id, memberId);

    const { dueDate, repeatConfig, ...rest } = dto;

    const updateData: Prisma.PersonalTaskUpdateInput = { ...rest };

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (repeatConfig !== undefined) {
      updateData.repeatConfig = repeatConfig === null
        ? Prisma.JsonNull
        : (repeatConfig as Prisma.InputJsonValue);
    }

    const task = await this.prisma.personalTask.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, code: true, category: true },
        },
      },
    });

    this.logger.log(`PersonalTask updated: ${id} by member ${memberId}`);
    return task;
  }

  async softDelete(id: string, memberId: string) {
    await this.findAndVerifyOwner(id, memberId);

    await this.prisma.personalTask.update({
      where: { id },
      data: { isDeleted: true },
    });

    this.logger.log(`PersonalTask soft-deleted: ${id} by member ${memberId}`);
    return { id };
  }

  async toggleDone(id: string, memberId: string) {
    const task = await this.findAndVerifyOwner(id, memberId);

    const isDone = task.status === TaskStatus.DONE;
    const updated = await this.prisma.personalTask.update({
      where: { id },
      data: {
        status: isDone ? TaskStatus.TODO : TaskStatus.DONE,
        completedAt: isDone ? null : new Date(),
      },
      include: {
        project: {
          select: { id: true, name: true, code: true, category: true },
        },
      },
    });

    this.logger.log(`PersonalTask toggle-done: ${id} → ${updated.status}`);
    return updated;
  }

  async reorder(memberId: string, dto: ReorderPersonalTasksDto) {
    const { teamId, orderedIds } = dto;

    await this.prisma.$transaction(
      orderedIds.map((taskId, index) =>
        this.prisma.personalTask.updateMany({
          where: { id: taskId, memberId, teamId, isDeleted: false },
          data: { sortOrder: index },
        }),
      ),
    );

    this.logger.log(`PersonalTask reordered: ${orderedIds.length} tasks by member ${memberId}`);
    return { reordered: orderedIds.length };
  }

  /**
   * 반복 작업 자동 생성 — repeatConfig가 있는 작업 중
   * 해당 주/일에 인스턴스가 없으면 생성
   */
  async createRecurringTasksIfNeeded(memberId: string, teamId: string) {
    try {
      // repeatConfig가 있는 원본(비삭제) 작업 조회
      const recurringTasks = await this.prisma.personalTask.findMany({
        where: {
          memberId,
          teamId,
          isDeleted: false,
          repeatConfig: { not: Prisma.JsonNull },
        },
      });

      if (recurringTasks.length === 0) return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // 이번 주 월~일 계산
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekLabel = this.getWeekLabel(weekStart);

      for (const task of recurringTasks) {
        const config = task.repeatConfig as Record<string, unknown>;
        if (!config) continue;

        const frequency = config['frequency'] as string | undefined;

        if (frequency === 'daily') {
          // 오늘 날짜로 인스턴스가 이미 있는지 확인
          const existing = await this.prisma.personalTask.findFirst({
            where: {
              memberId,
              teamId,
              isDeleted: false,
              linkedWeekLabel: todayStr,
              title: task.title,
            },
          });

          if (!existing) {
            const maxSortOrder = await this.prisma.personalTask.aggregate({
              where: { memberId, teamId, isDeleted: false },
              _max: { sortOrder: true },
            });
            await this.prisma.personalTask.create({
              data: {
                memberId,
                teamId,
                title: task.title,
                memo: task.memo,
                projectId: task.projectId,
                priority: task.priority,
                dueDate: new Date(todayStr),
                linkedWeekLabel: todayStr,
                sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
              },
            });
            this.logger.log(`Recurring daily task created for ${todayStr}: ${task.title}`);
          }
        } else if (frequency === 'weekly') {
          // 이번 주에 인스턴스가 이미 있는지 확인
          const existing = await this.prisma.personalTask.findFirst({
            where: {
              memberId,
              teamId,
              isDeleted: false,
              linkedWeekLabel: weekLabel,
              title: task.title,
            },
          });

          if (!existing) {
            const maxSortOrder = await this.prisma.personalTask.aggregate({
              where: { memberId, teamId, isDeleted: false },
              _max: { sortOrder: true },
            });
            await this.prisma.personalTask.create({
              data: {
                memberId,
                teamId,
                title: task.title,
                memo: task.memo,
                projectId: task.projectId,
                priority: task.priority,
                linkedWeekLabel: weekLabel,
                sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
              },
            });
            this.logger.log(`Recurring weekly task created for ${weekLabel}: ${task.title}`);
          }
        }
      }
    } catch (error) {
      // 반복 작업 생성 실패는 조회 자체를 실패시키지 않음
      this.logger.warn(`createRecurringTasksIfNeeded failed: ${(error as Error).message}`);
    }
  }

  private async findAndVerifyOwner(id: string, memberId: string) {
    const task = await this.prisma.personalTask.findFirst({
      where: { id, isDeleted: false },
    });

    if (!task) {
      throw new BusinessException(
        'PERSONAL_TASK_NOT_FOUND',
        '개인 작업을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (task.memberId !== memberId) {
      throw new ForbiddenException('본인의 작업만 수정할 수 있습니다.');
    }

    return task;
  }

  private getWeekLabel(weekStart: Date): string {
    const year = weekStart.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor(
      (weekStart.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }
}
