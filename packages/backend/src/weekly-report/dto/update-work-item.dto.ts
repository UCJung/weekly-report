import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkItemDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  doneWork?: string;

  @IsOptional()
  @IsString()
  planWork?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
