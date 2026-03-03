import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveProjectDto {
  @IsString()
  @IsNotEmpty({ message: '프로젝트코드는 필수입니다.' })
  code: string;
}
