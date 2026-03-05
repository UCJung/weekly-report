import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreatePersonalTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority = TaskPriority.MEDIUM;

  // statusId: TaskStatusDef FK — 미입력 시 팀의 기본 BEFORE_START 상태 자동 배정
  @IsOptional()
  @IsString()
  statusId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsObject()
  repeatConfig?: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  teamId: string;
}
