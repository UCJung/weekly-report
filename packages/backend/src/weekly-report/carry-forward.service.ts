import { Injectable } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CarryForwardDto } from './dto/carry-forward.dto';
import { getWeekRange, getPreviousWeekLabel } from './week-utils';

@Injectable()
export class CarryForwardService {
  constructor(private prisma: PrismaService) {}

  async carryForward(memberId: string, dto: CarryForwardDto) {
    const { targetWeek, sourceWorkItemIds } = dto;
    const { start: targetStart } = getWeekRange(targetWeek);
    const prevWeekLabel = getPreviousWeekLabel(targetWeek);
    const { start: prevStart } = getWeekRange(prevWeekLabel);

    // 전주 주간업무 조회
    const prevReport = await this.prisma.weeklyReport.findUnique({
      where: { memberId_weekStart: { memberId, weekStart: prevStart } },
      include: {
        workItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // 이번주 주간업무 생성 또는 조회
    let targetReport = await this.prisma.weeklyReport.findUnique({
      where: { memberId_weekStart: { memberId, weekStart: targetStart } },
    });

    if (!targetReport) {
      targetReport = await this.prisma.weeklyReport.create({
        data: {
          memberId,
          weekStart: targetStart,
          weekLabel: targetWeek,
          status: ReportStatus.DRAFT,
        },
      });
    }

    // 전주 업무가 없으면 빈 보고서 반환
    if (!prevReport || prevReport.workItems.length === 0) {
      return {
        report: targetReport,
        createdItems: [],
        message: '전주 예정업무가 없습니다. 빈 주간업무가 생성되었습니다.',
      };
    }

    // 소스 항목 필터링
    let sourceItems = prevReport.workItems.filter((item) => item.planWork.trim() !== '');
    if (sourceWorkItemIds && sourceWorkItemIds.length > 0) {
      sourceItems = sourceItems.filter((item) => sourceWorkItemIds.includes(item.id));
    }

    // 현재 이번주 항목 수 → sortOrder 기준값
    const existingCount = await this.prisma.workItem.count({
      where: { weeklyReportId: targetReport.id },
    });

    // 전주 planWork → 이번주 doneWork 복사
    const createdItems = await this.prisma.$transaction(
      sourceItems.map((item, idx) =>
        this.prisma.workItem.create({
          data: {
            weeklyReportId: targetReport.id,
            projectId: item.projectId,
            doneWork: item.planWork,
            planWork: '',
            remarks: '',
            sortOrder: existingCount + idx,
          },
          include: { project: true },
        }),
      ),
    );

    return {
      report: targetReport,
      createdItems,
      message: `${createdItems.length}건의 전주 예정업무를 이번주 진행업무로 불러왔습니다.`,
    };
  }
}
