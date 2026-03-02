import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MinLength, ArrayMinSize } from 'class-validator';
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
  @IsArray()
  @IsEnum(MemberRole, { each: true })
  @ArrayMinSize(1, { message: '역할은 최소 1개 이상이어야 합니다.' })
  roles?: MemberRole[];

  @IsOptional()
  @IsString()
  partId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
