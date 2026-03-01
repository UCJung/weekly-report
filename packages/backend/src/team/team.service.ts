import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async findById(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { parts: true },
    });
    if (!team) {
      throw new BusinessException(
        'TEAM_NOT_FOUND',
        '팀을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }
    return team;
  }

  async findParts(teamId: string) {
    await this.findById(teamId);
    return this.prisma.part.findMany({
      where: { teamId },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
