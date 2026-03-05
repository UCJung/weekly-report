import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class UpdatePersonalTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsObject()
  repeatConfig?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  teamId?: string;

  // statusId: TaskStatusDef FK (replaces old TaskStatus enum)
  // Full migration handled in TASK-03
  @IsOptional()
  @IsString()
  statusId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  elapsedMinutes?: number;
}
