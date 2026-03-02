import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, ArrayMinSize } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  name: string;

  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  email: string;

  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @IsArray()
  @IsEnum(MemberRole, { each: true, message: '유효한 역할이 아닙니다.' })
  @ArrayMinSize(1, { message: '역할은 최소 1개 이상이어야 합니다.' })
  roles: MemberRole[];

  @IsString()
  @IsNotEmpty({ message: '파트 ID는 필수입니다.' })
  partId: string;
}
