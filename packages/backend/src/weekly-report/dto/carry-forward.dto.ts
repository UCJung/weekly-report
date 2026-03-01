import { IsArray, IsOptional, IsString, Matches } from 'class-validator';

export class CarryForwardDto {
  @IsString()
  @Matches(/^\d{4}-W\d{2}$/, { message: 'targetWeek 형식이 올바르지 않습니다. 예: 2026-W09' })
  targetWeek: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceWorkItemIds?: string[];
}
