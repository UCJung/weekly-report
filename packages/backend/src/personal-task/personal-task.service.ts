import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma, TaskPriority, MemberRole, ReportStatus, TaskStatusCategory } from '@prisma/client';
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
import { ImportToWeeklyReportDto } from './dto/import-to-weekly-report.dto';
import { ImportFromWeeklyReportDto } from './dto/import-from-weekly-report.dto';
import { getWeekRange } from '@uc-teamspace/shared/constants/week-utils';

@Injectable()
export class PersonalTaskService {
  private readonly logger = new Logger(PersonalTaskService.name);

  constructor(private prisma: PrismaService) {}

  /** 팀의 카테고리별 기본 상태 id 조회 헬퍼 */
  private async getDefaultStatusId(teamId: string, category: TaskStatusCategory): Promise<string | null> {
    const def = await this.prisma.taskStatusDef.findFirst({
      where: { teamId, category, isDefault: true, isDeleted: false },
      select: { id: true },
    });
    return def?.id ?? null;
  }

  /** 상태 카테고리별 TaskStatusDef id 목록 조회 헬퍼 */
  private async getStatusIdsByCategory(teamId: string, category: TaskStatusCategory): Promise<string[]> {
    const defs = await this.prisma.taskStatusDef.findMany({
      where: { teamId, category, isDeleted: false },
      select: { id: true },
    });
    return defs.map((d) => d.id);
  }

  async findAll(memberId: string, query: ListPersonalTasksQueryDto) {
    const { teamId, status, statusId, projectId, priority, period, q, sortBy } = query;

    // 반복 작업 자동 생성 (조회 전 처리)
    await this.createRecurringTasksIfNeeded(memberId, teamId);

    const where: Prisma.PersonalTaskWhereInput = {
      memberId,
      teamId,
      isDeleted: false,
    };

    // statusId 직접 필터 (TASK-03에서 프론트와 함께 완전 전환)
    if (statusId) {
      where.statusId = statusId;
    } else if (status && status !== TaskStatusFilter.ALL) {
      // 레거시 status enum 필터를 카테고리 기반으로 변환
      let categoryFilter: TaskStatusCategory | undefined;
      if (status === TaskStatusFilter.TODO) {
        categoryFilter = TaskStatusCategory.BEFORE_START;
      } else if (status === TaskStatusFilter.IN_PROGRESS) {
        categoryFilter = TaskStatusCategory.IN_PROGRESS;
      } else if (status === TaskStatusFilter.DONE) {
        categoryFilter = TaskStatusCategory.COMPLETED;
      }
      if (categoryFilter) {
        const ids = await this.getStatusIdsByCategory(teamId, categoryFilter);
        if (ids.length > 0) {
          where.statusId = { in: ids };
        }
      }
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
        // 완료(COMPLETED 카테고리) 제외
        const completedIds = await this.getStatusIdsByCategory(teamId, TaskStatusCategory.COMPLETED);
        if (completedIds.length > 0) {
          where.statusId = { notIn: completedIds };
        }
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
        taskStatus: {
          select: { id: true, name: true, category: true, color: true, sortOrder: true },
        },
      },
    });

    return tasks;
  }

  async create(memberId: string, dto: CreatePersonalTaskDto) {
    const { teamId, dueDate, repeatConfig, ...rest } = dto;

    // statusId 기본값: 팀의 BEFORE_START 기본 상태
    let resolvedStatusId = rest.statusId;
    if (!resolvedStatusId) {
      const defaultId = await this.getDefaultStatusId(teamId, TaskStatusCategory.BEFORE_START);
      if (!defaultId) {
        throw new BusinessException(
          'TASK_STATUS_NOT_FOUND',
          '팀의 기본 작업 상태를 찾을 수 없습니다. 팀 관리자에게 문의하세요.',
          HttpStatus.BAD_REQUEST,
        );
      }
      resolvedStatusId = defaultId;
    }

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
        statusId: resolvedStatusId,
        sortOrder: nextSortOrder,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        repeatConfig: repeatConfig as Prisma.InputJsonValue | undefined,
      },
      include: {
        project: {
          select: { id: true, name: true, code: true, category: true },
        },
        taskStatus: {
          select: { id: true, name: true, category: true, color: true, sortOrder: true },
        },
      },
    });

    this.logger.log(`PersonalTask created: ${task.id} by member ${memberId}`);
    return task;
  }

  async update(id: string, memberId: string, dto: UpdatePersonalTaskDto) {
    const currentTask = await this.findAndVerifyOwner(id, memberId);

    const { dueDate, repeatConfig, elapsedMinutes, statusId, ...rest } = dto;

    const updateData: Prisma.PersonalTaskUncheckedUpdateInput = { ...rest };

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (repeatConfig !== undefined) {
      updateData.repeatConfig = repeatConfig === null
        ? Prisma.JsonNull
        : (repeatConfig as Prisma.InputJsonValue);
    }

    // 소요시간 수동 입력 처리
    if (elapsedMinutes !== undefined) {
      updateData.elapsedMinutes = elapsedMinutes;
    }

    // statusId 변경 시 카테고리 기반 자동 시간 처리
    if (statusId && statusId !== currentTask.statusId) {
      const newStatusDef = await this.prisma.taskStatusDef.findUnique({
        where: { id: statusId },
        select: { category: true },
      });

      if (newStatusDef) {
        updateData.statusId = statusId;

        if (newStatusDef.category === TaskStatusCategory.IN_PROGRESS) {
          // IN_PROGRESS 전환 시 startedAt이 없으면 현재 시각 설정
          if (!currentTask.startedAt) {
            updateData.startedAt = new Date();
          }
        } else if (newStatusDef.category === TaskStatusCategory.COMPLETED) {
          // COMPLETED 전환 시
          updateData.completedAt = new Date();
          // 수동 elapsedMinutes 없고 startedAt이 있으면 자동 계산
          if (elapsedMinutes === undefined && currentTask.startedAt) {
            const diffMs = Date.now() - currentTask.startedAt.getTime();
            updateData.elapsedMinutes = Math.max(0, Math.round(diffMs / 60000));
          }
        }
      }
    } else if (statusId) {
      updateData.statusId = statusId;
    }

    const task = await this.prisma.personalTask.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, code: true, category: true },
        },
        taskStatus: {
          select: { id: true, name: true, category: true, color: true, sortOrder: true },
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

    // 현재 상태의 카테고리 조회
    const currentStatusDef = await this.prisma.taskStatusDef.findUnique({
      where: { id: task.statusId },
      select: { category: true, teamId: true },
    });

    const isDone = currentStatusDef?.category === TaskStatusCategory.COMPLETED;

    let newStatusId: string;
    if (isDone) {
      // COMPLETED → BEFORE_START 기본 상태로 되돌림
      const defaultBeforeStart = await this.getDefaultStatusId(task.teamId, TaskStatusCategory.BEFORE_START);
      newStatusId = defaultBeforeStart ?? task.statusId;
    } else {
      // 현재 상태 → COMPLETED 기본 상태로
      const defaultCompleted = await this.getDefaultStatusId(task.teamId, TaskStatusCategory.COMPLETED);
      newStatusId = defaultCompleted ?? task.statusId;
    }

    const updateData: Prisma.PersonalTaskUncheckedUpdateInput = {
      statusId: newStatusId,
      completedAt: isDone ? null : new Date(),
    };

    // TODO/IN_PROGRESS → DONE: startedAt이 있으면 elapsedMinutes 자동 계산
    if (!isDone && task.startedAt) {
      const diffMs = Date.now() - task.startedAt.getTime();
      updateData.elapsedMinutes = Math.max(0, Math.round(diffMs / 60000));
    }

    const updated = await this.prisma.personalTask.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, code: true, category: true },
        },
        taskStatus: {
          select: { id: true, name: true, category: true, color: true, sortOrder: true },
        },
      },
    });

    this.logger.log(`PersonalTask toggle-done: ${id} → statusId ${updated.statusId}`);
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

      // 기본 BEFORE_START 상태 조회
      const defaultStatusId = await this.getDefaultStatusId(teamId, TaskStatusCategory.BEFORE_START);

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

          if (!existing && defaultStatusId) {
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
                statusId: defaultStatusId,
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

          if (!existing && defaultStatusId) {
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
                statusId: defaultStatusId,
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

  // ─────────────────────────────────────────────────────────────────────
  // 주간업무 연동 (import-to-weekly / import-from-weekly)
  // ─────────────────────────────────────────────────────────────────────

  async importToWeekly(memberId: string, dto: ImportToWeeklyReportDto) {
    const { taskIds, weekLabel, teamId } = dto;
    const { start: weekStart } = getWeekRange(weekLabel);

    // 대상 PersonalTask 조회 (본인 소유 + isDeleted: false)
    const tasks = await this.prisma.personalTask.findMany({
      where: { id: { in: taskIds }, memberId, teamId, isDeleted: false },
      include: {
        taskStatus: { select: { category: true } },
      },
    });

    if (tasks.length === 0) {
      throw new BusinessException(
        'PERSONAL_TASK_NOT_FOUND',
        '가져올 개인 작업을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // WeeklyReport 조회 또는 생성
      let report = await tx.weeklyReport.findUnique({
        where: { memberId_weekStart: { memberId, weekStart } },
      });

      if (!report) {
        report = await tx.weeklyReport.create({
          data: {
            memberId,
            weekStart,
            weekLabel,
            status: ReportStatus.DRAFT,
          },
        });
        this.logger.log(`WeeklyReport created for import: ${report.id}`);
      }

      // 기존 WorkItem sortOrder 최댓값 조회
      const lastItem = await tx.workItem.findFirst({
        where: { weeklyReportId: report.id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      let nextSortOrder = (lastItem?.sortOrder ?? -1) + 1;

      // WorkItem 생성 및 linkedWeekLabel 업데이트
      const createdItems = [];
      for (const task of tasks) {
        const isDone = task.taskStatus?.category === TaskStatusCategory.COMPLETED;
        const textContent = task.memo
          ? `${task.title}\n${task.memo}`
          : task.title;

        const data: Record<string, unknown> = {
          weeklyReportId: report.id,
          doneWork: isDone ? textContent : '',
          planWork: isDone ? '' : textContent,
          remarks: '',
          sortOrder: nextSortOrder,
        };
        if (task.projectId) {
          data.projectId = task.projectId;
        }

        const workItem = await tx.workItem.create({
          data: data as Parameters<typeof tx.workItem.create>[0]['data'],
          include: { project: true },
        });
        createdItems.push(workItem);
        nextSortOrder++;

        // linkedWeekLabel 업데이트
        await tx.personalTask.update({
          where: { id: task.id },
          data: { linkedWeekLabel: weekLabel },
        });
      }

      return { createdCount: createdItems.length, workItems: createdItems };
    });

    this.logger.log(`importToWeekly: ${result.createdCount} WorkItems created for member ${memberId}`);
    return result;
  }

  async importFromWeekly(memberId: string, dto: ImportFromWeeklyReportDto) {
    const { weekLabel, teamId, workItemIds } = dto;
    const { start: weekStart } = getWeekRange(weekLabel);

    // WeeklyReport 조회 (없으면 404)
    const report = await this.prisma.weeklyReport.findUnique({
      where: { memberId_weekStart: { memberId, weekStart } },
      include: {
        workItems: {
          where: { id: { in: workItemIds } },
          include: { project: true },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('해당 주차의 주간업무를 찾을 수 없습니다.');
    }

    if (report.workItems.length === 0) {
      throw new BusinessException(
        'WORK_ITEM_NOT_FOUND',
        '가져올 업무항목을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 기본 BEFORE_START 상태 조회
    const defaultStatusId = await this.getDefaultStatusId(teamId, TaskStatusCategory.BEFORE_START);
    if (!defaultStatusId) {
      throw new BusinessException(
        'TASK_STATUS_NOT_FOUND',
        '팀의 기본 작업 상태를 찾을 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const maxSortOrder = await tx.personalTask.aggregate({
        where: { memberId, teamId, isDeleted: false },
        _max: { sortOrder: true },
      });
      let nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

      const createdTasks = [];
      for (const workItem of report.workItems) {
        // planWork 또는 doneWork에서 title 추출 (planWork 우선)
        const rawTitle = workItem.planWork?.trim() || workItem.doneWork?.trim() || '';
        if (!rawTitle) continue;

        // 중복 가져오기 방지: 동일 linkedWeekLabel + title 조합 확인
        const existing = await tx.personalTask.findFirst({
          where: {
            memberId,
            teamId,
            isDeleted: false,
            linkedWeekLabel: weekLabel,
            title: rawTitle,
          },
        });
        if (existing) continue;

        const data: Record<string, unknown> = {
          memberId,
          teamId,
          title: rawTitle,
          statusId: defaultStatusId,
          sortOrder: nextSortOrder,
          linkedWeekLabel: weekLabel,
        };
        if (workItem.projectId) {
          data.projectId = workItem.projectId;
        }

        const task = await tx.personalTask.create({
          data: data as Parameters<typeof tx.personalTask.create>[0]['data'],
          include: {
            project: {
              select: { id: true, name: true, code: true, category: true },
            },
            taskStatus: {
              select: { id: true, name: true, category: true, color: true, sortOrder: true },
            },
          },
        });
        createdTasks.push(task);
        nextSortOrder++;
      }

      return { createdCount: createdTasks.length, tasks: createdTasks };
    });

    this.logger.log(`importFromWeekly: ${result.createdCount} PersonalTasks created for member ${memberId}`);
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────
  // 대시보드 요약 (summary)
  // ─────────────────────────────────────────────────────────────────────

  async getSummary(memberId: string, teamId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysLater = new Date(todayStart.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 이번 주 월~일
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(todayStart.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const baseWhere: Prisma.PersonalTaskWhereInput = {
      memberId,
      teamId,
      isDeleted: false,
    };

    // 완료 상태 ids
    const completedIds = await this.getStatusIdsByCategory(teamId, TaskStatusCategory.COMPLETED);
    const notCompletedFilter: Prisma.PersonalTaskWhereInput =
      completedIds.length > 0 ? { statusId: { notIn: completedIds } } : {};
    const completedFilter: Prisma.PersonalTaskWhereInput =
      completedIds.length > 0 ? { statusId: { in: completedIds } } : {};

    const [todayCount, dueSoonCount, thisWeekDoneCount, overdueCount] =
      await Promise.all([
        // 오늘 마감 (완료 제외)
        this.prisma.personalTask.count({
          where: {
            ...baseWhere,
            dueDate: { gte: todayStart, lt: tomorrowStart },
            ...notCompletedFilter,
          },
        }),
        // 3일 이내 마감 (오늘 포함, 완료 제외)
        this.prisma.personalTask.count({
          where: {
            ...baseWhere,
            dueDate: { gte: todayStart, lt: threeDaysLater },
            ...notCompletedFilter,
          },
        }),
        // 이번 주 완료
        this.prisma.personalTask.count({
          where: {
            ...baseWhere,
            completedAt: { gte: weekStart, lt: weekEnd },
            ...completedFilter,
          },
        }),
        // 기한 초과 (완료 제외)
        this.prisma.personalTask.count({
          where: {
            ...baseWhere,
            dueDate: { lt: todayStart },
            ...notCompletedFilter,
          },
        }),
      ]);

    return { todayCount, dueSoonCount, thisWeekDoneCount, overdueCount };
  }

  // ─────────────────────────────────────────────────────────────────────
  // 파트/팀 overview (part-overview / team-overview)
  // ─────────────────────────────────────────────────────────────────────

  async getPartOverview(requesterId: string, teamId: string, partId?: string) {
    // 요청자의 팀 멤버십 조회
    const membership = await this.prisma.teamMembership.findUnique({
      where: { memberId_teamId: { memberId: requesterId, teamId } },
    });

    if (!membership) {
      throw new ForbiddenException('해당 팀에 소속되어 있지 않습니다.');
    }

    const isLeader = membership.roles.includes(MemberRole.LEADER) ||
      membership.roles.includes(MemberRole.ADMIN);
    const isPartLeader = membership.roles.includes(MemberRole.PART_LEADER);

    if (!isLeader && !isPartLeader) {
      throw new ForbiddenException('파트 개요는 파트장 이상만 조회할 수 있습니다.');
    }

    // 대상 파트 결정
    let targetPartId: string | null | undefined;
    if (isLeader) {
      targetPartId = partId;
    } else {
      targetPartId = membership.partId;
    }

    const membershipWhere: Prisma.TeamMembershipWhereInput = { teamId };
    if (targetPartId) {
      membershipWhere.partId = targetPartId;
    }

    const memberships = await this.prisma.teamMembership.findMany({
      where: membershipWhere,
      include: {
        member: { select: { id: true, name: true } },
      },
    });

    // 카테고리별 status id 목록
    const [beforeStartIds, inProgressIds, completedIds] = await Promise.all([
      this.getStatusIdsByCategory(teamId, TaskStatusCategory.BEFORE_START),
      this.getStatusIdsByCategory(teamId, TaskStatusCategory.IN_PROGRESS),
      this.getStatusIdsByCategory(teamId, TaskStatusCategory.COMPLETED),
    ]);

    const overview = await Promise.all(
      memberships.map(async (ms) => {
        const [todoCount, inProgressCount, doneCount] = await Promise.all([
          this.prisma.personalTask.count({
            where: {
              memberId: ms.memberId, teamId, isDeleted: false,
              statusId: beforeStartIds.length > 0 ? { in: beforeStartIds } : undefined,
            },
          }),
          this.prisma.personalTask.count({
            where: {
              memberId: ms.memberId, teamId, isDeleted: false,
              statusId: inProgressIds.length > 0 ? { in: inProgressIds } : undefined,
            },
          }),
          this.prisma.personalTask.count({
            where: {
              memberId: ms.memberId, teamId, isDeleted: false,
              statusId: completedIds.length > 0 ? { in: completedIds } : undefined,
            },
          }),
        ]);

        return {
          memberId: ms.memberId,
          memberName: ms.member.name,
          todoCount,
          inProgressCount,
          doneCount,
        };
      }),
    );

    return overview;
  }

  async getTeamOverview(requesterId: string, teamId: string) {
    const membership = await this.prisma.teamMembership.findUnique({
      where: { memberId_teamId: { memberId: requesterId, teamId } },
    });

    if (!membership) {
      throw new ForbiddenException('해당 팀에 소속되어 있지 않습니다.');
    }

    const isLeader = membership.roles.includes(MemberRole.LEADER) ||
      membership.roles.includes(MemberRole.ADMIN);

    if (!isLeader) {
      throw new ForbiddenException('팀 전체 개요는 팀장/관리자만 조회할 수 있습니다.');
    }

    const memberships = await this.prisma.teamMembership.findMany({
      where: { teamId },
      include: {
        member: { select: { id: true, name: true } },
        part: { select: { id: true, name: true } },
      },
    });

    // 카테고리별 status id 목록
    const [beforeStartIds, inProgressIds, completedIds] = await Promise.all([
      this.getStatusIdsByCategory(teamId, TaskStatusCategory.BEFORE_START),
      this.getStatusIdsByCategory(teamId, TaskStatusCategory.IN_PROGRESS),
      this.getStatusIdsByCategory(teamId, TaskStatusCategory.COMPLETED),
    ]);

    const overview = await Promise.all(
      memberships.map(async (ms) => {
        const [todoCount, inProgressCount, doneCount] = await Promise.all([
          this.prisma.personalTask.count({
            where: {
              memberId: ms.memberId, teamId, isDeleted: false,
              statusId: beforeStartIds.length > 0 ? { in: beforeStartIds } : undefined,
            },
          }),
          this.prisma.personalTask.count({
            where: {
              memberId: ms.memberId, teamId, isDeleted: false,
              statusId: inProgressIds.length > 0 ? { in: inProgressIds } : undefined,
            },
          }),
          this.prisma.personalTask.count({
            where: {
              memberId: ms.memberId, teamId, isDeleted: false,
              statusId: completedIds.length > 0 ? { in: completedIds } : undefined,
            },
          }),
        ]);

        return {
          memberId: ms.memberId,
          memberName: ms.member.name,
          partId: ms.partId,
          partName: ms.part?.name ?? null,
          todoCount,
          inProgressCount,
          doneCount,
        };
      }),
    );

    return overview;
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
