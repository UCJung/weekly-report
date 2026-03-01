import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password?: string;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;

  @IsOptional()
  @IsString()
  partId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
