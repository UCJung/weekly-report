import { Injectable, HttpStatus } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { CreateWeeklyReportDto } from './dto/create-weekly-report.dto';
import { UpdateWeeklyReportDto } from './dto/update-weekly-report.dto';
import { getWeekRange } from '@uc-teamspace/shared/constants/week-utils';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async findMyReport(memberId: string, weekLabel: string) {
    const { start } = getWeekRange(weekLabel);

    const report = await this.prisma.weeklyReport.findUnique({
      where: { memberId_weekStart: { memberId, weekStart: start } },
      include: {
        workItems: {
          orderBy: { sortOrder: 'asc' },
          include: { project: true },
        },
      },
    });

    return report;
  }

  async create(memberId: string, dto: CreateWeeklyReportDto) {
    const { start } = getWeekRange(dto.weekLabel);

    const existing = await this.prisma.weeklyReport.findUnique({
      where: { memberId_weekStart: { memberId, weekStart: start } },
    });

    if (existing) {
      throw new BusinessException(
        'WEEKLY_REPORT_ALREADY_EXISTS',
        '해당 주차의 주간업무가 이미 존재합니다.',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.weeklyReport.create({
      data: {
        memberId,
        weekStart: start,
        weekLabel: dto.weekLabel,
        status: ReportStatus.DRAFT,
      },
      include: {
        workItems: true,
      },
    });
  }

  async updateStatus(id: string, memberId: string, dto: UpdateWeeklyReportDto) {
    await this.findAndVerifyOwner(id, memberId);

    // 제출 시 빈 항목 자동 제거
    if (dto.status === ReportStatus.SUBMITTED) {
      await this.prisma.workItem.deleteMany({
        where: {
          weeklyReportId: id,
          doneWork: '',
          planWork: '',
        },
      });
    }

    return this.prisma.weeklyReport.update({
      where: { id },
      data: { status: dto.status },
      include: {
        workItems: {
          orderBy: { sortOrder: 'asc' },
          include: { project: true },
        },
      },
    });
  }

  async findById(id: string) {
    const report = await this.prisma.weeklyReport.findUnique({
      where: { id },
      include: {
        workItems: {
          orderBy: { sortOrder: 'asc' },
          include: { project: true },
        },
      },
    });

    if (!report) {
      throw new BusinessException(
        'WEEKLY_REPORT_NOT_FOUND',
        '해당 주간업무를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    return report;
  }

  async findAndVerifyOwner(id: string, memberId: string) {
    const report = await this.findById(id);

    if (report.memberId !== memberId) {
      throw new BusinessException(
        'WEEKLY_REPORT_FORBIDDEN',
        '본인의 주간업무만 접근할 수 있습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    return report;
  }
}
