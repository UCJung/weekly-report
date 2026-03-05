import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { TaskPriority } from '@prisma/client';

export enum TaskStatusFilter {
  ALL = 'ALL',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskPeriodFilter {
  TODAY = 'today',
  THIS_WEEK = 'this-week',
  THIS_MONTH = 'this-month',
  OVERDUE = 'overdue',
}

export enum TaskSortBy {
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  CREATED_AT = 'createdAt',
  PROJECT = 'project',
  SORT_ORDER = 'sortOrder',
}

export class ListPersonalTasksQueryDto {
  @IsString()
  @IsNotEmpty()
  teamId: string;

  // statusId filter: filters by specific TaskStatusDef id
  // Legacy status filter (TaskStatusFilter) kept for backward compat — TASK-03 will migrate fully
  @IsOptional()
  @IsString()
  statusId?: string;

  @IsOptional()
  @IsEnum(TaskStatusFilter)
  status?: TaskStatusFilter;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskPeriodFilter)
  period?: TaskPeriodFilter;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(TaskSortBy)
  sortBy?: TaskSortBy = TaskSortBy.SORT_ORDER;
}
