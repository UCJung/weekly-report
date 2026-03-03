import { IsString, MinLength } from 'class-validator';

export class RejectTimesheetDto {
  @IsString()
  @MinLength(1, { message: '반려 사유를 입력해주세요.' })
  comment: string;
}
