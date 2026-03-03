import { IsString, Matches } from 'class-validator';

export class CreateTimesheetDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'yearMonth 형식이 올바르지 않습니다. 예: 2026-03' })
  yearMonth: string;

  @IsString()
  teamId: string;
}
