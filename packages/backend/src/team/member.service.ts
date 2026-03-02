import { Injectable, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async findByTeam(teamId: string, partId?: string) {
    const members = await this.prisma.member.findMany({
      where: {
        part: { teamId },
        ...(partId && { partId }),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        partId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        part: { select: { name: true } },
      },
      orderBy: [{ part: { name: 'asc' } }, { name: 'asc' }],
    });
    return members.map(({ part, ...rest }) => ({
      ...rest,
      partName: part?.name ?? '',
    }));
  }

  async create(dto: CreateMemberDto) {
    const existing = await this.prisma.member.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BusinessException(
        'MEMBER_EMAIL_DUPLICATE',
        '이미 등록된 이메일입니다.',
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const member = await this.prisma.member.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        roles: dto.roles,
        partId: dto.partId,
      },
      include: { part: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...result } = member;
    return result;
  }

  async update(id: string, dto: UpdateMemberDto) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new BusinessException(
        'MEMBER_NOT_FOUND',
        '팀원을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.roles !== undefined) data.roles = { set: dto.roles };
    if (dto.partId !== undefined) data.partId = dto.partId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.member.update({
      where: { id },
      data,
      include: { part: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw2, ...result } = updated;
    return result;
  }
}
