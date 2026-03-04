import { Injectable, UnauthorizedException, Logger, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly redis: Redis;
  private readonly refreshExpiresIn: number;
  private readonly refreshExpiresInStr: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL')!);
    this.refreshExpiresInStr = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')!;
    this.refreshExpiresIn = this.parseDuration(this.refreshExpiresInStr);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.member.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BusinessException(
        'EMAIL_ALREADY_EXISTS',
        '이미 사용 중인 이메일입니다.',
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const member = await this.prisma.member.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        accountStatus: 'PENDING',
        mustChangePassword: false,
      },
    });

    this.logger.log(`계정 신청 완료: ${member.email} (id=${member.id})`);

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      accountStatus: member.accountStatus,
    };
  }

  async validateMember(email: string, password: string) {
    const member = await this.prisma.member.findUnique({
      where: { email },
    });

    if (!member) return null;

    // accountStatus 기반 검증
    if (member.accountStatus === 'PENDING') {
      throw new BusinessException(
        'ACCOUNT_PENDING',
        '승인 대기중인 계정입니다. 관리자의 승인을 기다려 주세요.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (member.accountStatus === 'INACTIVE') {
      throw new BusinessException(
        'ACCOUNT_INACTIVE',
        '사용 종료된 계정입니다. 관리자에게 문의하세요.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!member.isActive) return null;

    const isValid = await bcrypt.compare(password, member.password);
    if (!isValid) return null;

    // APPROVED 상태라면 ACTIVE로 전환
    if (member.accountStatus === 'APPROVED') {
      await this.prisma.member.update({
        where: { id: member.id },
        data: { accountStatus: 'ACTIVE' },
      });
      member.accountStatus = 'ACTIVE';
    }

    return member;
  }

  async login(member: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    mustChangePassword: boolean;
  }) {
    const payload = {
      sub: member.id,
      email: member.email,
      roles: member.roles,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.refreshExpiresIn,
    });

    await this.redis.set(
      `refresh:${member.id}`,
      refreshToken,
      'EX',
      this.refreshExpiresIn,
    );

    return {
      accessToken,
      refreshToken,
      mustChangePassword: member.mustChangePassword,
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        roles: member.roles,
        teamId: null,
        teamName: null,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });
    if (!member) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, member.password);
    if (!isValid) {
      throw new BusinessException(
        'INVALID_CURRENT_PASSWORD',
        '현재 비밀번호가 올바르지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedNew = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.member.update({
      where: { id: userId },
      data: {
        password: hashedNew,
        mustChangePassword: false,
      },
    });

    this.logger.log(`비밀번호 변경 완료: memberId=${userId}`);

    return { message: '비밀번호가 변경되었습니다.' };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('유효하지 않은 Refresh Token입니다.');
    }

    const stored = await this.redis.get(`refresh:${payload.sub}`);
    if (stored !== refreshToken) {
      throw new UnauthorizedException('Refresh Token이 만료되었거나 유효하지 않습니다.');
    }

    const member = await this.prisma.member.findUnique({
      where: { id: payload.sub },
    });
    if (!member || !member.isActive) {
      throw new UnauthorizedException('비활성화된 사용자입니다.');
    }

    const newPayload = {
      sub: member.id,
      email: member.email,
      roles: member.roles,
    };

    const accessToken = this.jwtService.sign(newPayload);
    const newRefreshToken = this.jwtService.sign(newPayload, {
      expiresIn: this.refreshExpiresIn,
    });

    await this.redis.set(
      `refresh:${member.id}`,
      newRefreshToken,
      'EX',
      this.refreshExpiresIn,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async getMe(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });
    if (!member) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...result } = member;
    return result;
  }

  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`);
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 3600;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 7 * 86400;
    }
  }
}
