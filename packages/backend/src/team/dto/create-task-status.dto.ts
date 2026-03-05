import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { TaskStatusCategory } from '@prisma/client';

export class CreateTaskStatusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  name: string;

  @IsEnum(TaskStatusCategory)
  category: TaskStatusCategory;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color는 #RRGGBB 형식이어야 합니다.' })
  color?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
