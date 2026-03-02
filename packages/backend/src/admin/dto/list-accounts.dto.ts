import { IsEnum, IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '@prisma/client';

export class ListAccountsDto {
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
