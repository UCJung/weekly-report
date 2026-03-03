import { IsEnum, IsOptional } from 'class-validator';
import { TeamStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListTeamsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TeamStatus)
  status?: TeamStatus;
}
