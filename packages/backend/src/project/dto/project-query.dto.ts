import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectCategory, ProjectStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ProjectQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  teamId?: string;
}
