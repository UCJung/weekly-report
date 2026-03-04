import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Position } from '@prisma/client';

export class UpdateAccountInfoDto {
  @IsOptional()
  @IsEnum(Position)
  position?: Position;

  @IsOptional()
  @IsString()
  jobTitle?: string;
}
