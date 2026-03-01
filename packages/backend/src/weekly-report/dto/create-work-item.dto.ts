import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkItemDto {
  @IsString()
  @IsNotEmpty({ message: '프로젝트 ID는 필수입니다.' })
  projectId: string;

  @IsString()
  doneWork: string;

  @IsString()
  planWork: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
