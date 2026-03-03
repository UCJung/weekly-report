import { IsEnum, IsArray, ValidateNested, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkLogDto {
  @IsString()
  projectId: string;

  @IsNumber()
  @Min(0)
  @Max(24)
  hours: number;

  @IsEnum(['OFFICE', 'FIELD', 'REMOTE', 'BUSINESS_TRIP'])
  workType: string;
}

export class SaveEntryDto {
  @IsEnum(['WORK', 'HOLIDAY_WORK', 'ANNUAL_LEAVE', 'HALF_DAY_LEAVE', 'HOLIDAY'])
  attendance: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkLogDto)
  @IsOptional()
  workLogs?: WorkLogDto[];
}
