import { IsString, Matches } from 'class-validator';

export class CreateWeeklyReportDto {
  @IsString()
  @Matches(/^\d{4}-W\d{2}$/, { message: 'weekLabel 형식이 올바르지 않습니다. 예: 2026-W09' })
  weekLabel: string;
}
