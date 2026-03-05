import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsString()
  @IsOptional()
  @MaxLength(20)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color는 #RRGGBB 형식이어야 합니다.' })
  color?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
