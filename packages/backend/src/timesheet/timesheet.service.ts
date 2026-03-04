import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { HttpStatus } from '@nestjs/common';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { getMonthDays, isWeekend, getRequiredHours } from '@uc-teamspace/shared';
import { AttendanceType, TimesheetStatus } from '@prisma/client';

const TIMESHEET_INCLUDE = {
  entries: {
    include: { workLogs: { include: { project: { select: { id: true, name: true, code: true } } } } },
    orderBy: { date: 'asc' as const },
  },
  approvals: {
    include: { approver: { select: { id: true, name: true } } },
  },
  member: { select: { id: true, name: true, position: true } },
};

@Injectable()
export class TimesheetService {
  private readonly logger = new Logger(TimesheetService.name);

  constructor(private prisma: PrismaService) {}

  /** 월별 근무시간표 생성 (이미 존재하면 기존 반환) */
  async create(memberId: string, dto: CreateTimesheetDto) {
    const existing = await this.prisma.monthlyTimesheet.findUnique({
      where: { memberId_teamId_yearMonth: { memberId, teamId: dto.teamId, yearMonth: dto.yearMonth } },
      include: TIMESHEET_INCLUDE,
    });

    if (existing) return existing;

    const days = getMonthDays(dto.yearMonth);

    const timesheet = await this.prisma.monthlyTimesheet.create({
      data: {
        memberId,
        teamId: dto.teamId,
        yearMonth: dto.yearMonth,
        entries: {
          create: days.map((d) => ({
            date: d,
            attendance: isWeekend(d) ? ('HOLIDAY' as AttendanceType) : ('WORK' as AttendanceType),
          })),
        },
      },
      include: TIMESHEET_INCLUDE,
    });

    this.logger.log(`시간표 생성: memberId=${memberId}, yearMonth=${dto.yearMonth}`);
    return timesheet;
  }

  /** 내 시간표 조회 */
  async getMyTimesheet(memberId: string, yearMonth: string, teamId: string) {
    const timesheet = await this.prisma.monthlyTimesheet.findUnique({
      where: { memberId_teamId_yearMonth: { memberId, teamId, yearMonth } },
      include: TIMESHEET_INCLUDE,
    });
    return timesheet;
  }

  /** 시간표 상세 조회 (ID) */
  async getById(id: string) {
    const timesheet = await this.prisma.monthlyTimesheet.findUnique({
      where: { id },
      include: TIMESHEET_INCLUDE,
    });
    if (!timesheet) {
      throw new BusinessException('TIMESHEET_NOT_FOUND', '시간표를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
    return timesheet;
  }

  /** 제출 (검증 포함) */
  async submit(id: string, memberId: string) {
    const timesheet = await this.prisma.monthlyTimesheet.findUnique({
      where: { id },
      include: { entries: { include: { workLogs: true }, orderBy: { date: 'asc' as const } } },
    });

    if (!timesheet) {
      throw new BusinessException('TIMESHEET_NOT_FOUND', '시간표를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
    if (timesheet.memberId !== memberId) {
      throw new BusinessException('TIMESHEET_FORBIDDEN', '본인의 시간표만 제출할 수 있습니다.', HttpStatus.FORBIDDEN);
    }
    if (timesheet.status !== TimesheetStatus.DRAFT) {
      throw new BusinessException('TIMESHEET_ALREADY_SUBMITTED', '이미 제출된 시간표입니다.');
    }

    // 검증
    const errors: string[] = [];

    for (const entry of timesheet.entries) {
      const dateStr = entry.date.toISOString().split('T')[0];
      const attendance = entry.attendance as AttendanceType;
      const required = getRequiredHours(attendance);
      const totalHours = entry.workLogs.reduce((sum, wl) => sum + wl.hours, 0);

      if (attendance === 'ANNUAL_LEAVE' || attendance === 'HOLIDAY') {
        // 공휴일/연차에 잔존 workLogs가 있으면 자동 삭제 (프론트 미처리 방어)
        if (entry.workLogs.length > 0) {
          await this.prisma.timesheetWorkLog.deleteMany({
            where: { entryId: entry.id },
          });
        }
        continue;
      }

      if (required > 0 && totalHours !== required) {
        errors.push(`${dateStr}: 투입시간 합계 ${totalHours}h ≠ 필요시간 ${required}h`);
      }
    }

    if (errors.length > 0) {
      throw new BusinessException(
        'TIMESHEET_VALIDATION_FAILED',
        `시간표 검증 실패:\n${errors.join('\n')}`,
      );
    }

    const updated = await this.prisma.monthlyTimesheet.update({
      where: { id },
      data: { status: TimesheetStatus.SUBMITTED, submittedAt: new Date() },
      include: TIMESHEET_INCLUDE,
    });

    this.logger.log(`시간표 제출: id=${id}`);
    return updated;
  }
}
