import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

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

  async validateMember(email: string, password: string) {
    const member = await this.prisma.member.findUnique({
      where: { email },
      include: { part: { include: { team: true } } },
    });
    if (!member || !member.isActive) return null;

    const isValid = await bcrypt.compare(password, member.password);
    if (!isValid) return null;

    return member;
  }

  async login(member: {
    id: string;
    name: string;
    email: string;
    role: string;
    partId: string;
    part: { name: string; teamId: string };
  }) {
    const payload = {
      sub: member.id,
      email: member.email,
      role: member.role,
      partId: member.partId,
      teamId: member.part.teamId,
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
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        partId: member.partId,
        partName: member.part.name,
      },
    };
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
      include: { part: true },
    });
    if (!member || !member.isActive) {
      throw new UnauthorizedException('비활성화된 사용자입니다.');
    }

    const newPayload = {
      sub: member.id,
      email: member.email,
      role: member.role,
      partId: member.partId,
      teamId: member.part.teamId,
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
      include: { part: { include: { team: true } } },
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
