import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProjectCategory } from '@prisma/client';

export class CreateGlobalProjectDto {
  @IsString()
  @IsNotEmpty({ message: '프로젝트명은 필수입니다.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '프로젝트코드는 필수입니다.' })
  code: string;

  @IsEnum(ProjectCategory, { message: '유효한 프로젝트 분류가 아닙니다.' })
  category: ProjectCategory;

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
