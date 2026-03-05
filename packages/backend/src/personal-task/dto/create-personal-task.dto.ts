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
