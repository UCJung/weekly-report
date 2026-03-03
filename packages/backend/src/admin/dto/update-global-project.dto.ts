import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectCategory, ProjectStatus } from '@prisma/client';

export class UpdateGlobalProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(ProjectCategory, { message: '유효한 프로젝트 분류가 아닙니다.' })
  category?: ProjectCategory;

  @IsOptional()
  @IsEnum(ProjectStatus, { message: '유효한 프로젝트 상태가 아닙니다.' })
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
