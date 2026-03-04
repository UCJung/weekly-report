import { Injectable } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CarryForwardDto } from './dto/carry-forward.dto';
import { getWeekRange, getPreviousWeekLabel } from '@uc-teamspace/shared/constants/week-utils';

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
        message: '전주 업무가 없습니다. 빈 주간업무가 생성되었습니다.',
      };
    }

    // 소스 항목 필터링 (진행업무 또는 예정업무가 있는 항목)
    let sourceItems = prevReport.workItems.filter(
      (item) => item.doneWork.trim() !== '' || item.planWork.trim() !== '',
    );
    if (sourceWorkItemIds && sourceWorkItemIds.length > 0) {
      sourceItems = sourceItems.filter((item) => sourceWorkItemIds.includes(item.id));
    }

    // 현재 이번주 항목 수 → sortOrder 기준값
    const existingCount = await this.prisma.workItem.count({
      where: { weeklyReportId: targetReport.id },
    });

    // 전주 내용을 그대로 복사 (진행업무, 예정업무, 비고 모두)
    const createdItems = await this.prisma.$transaction(
      sourceItems.map((item, idx) =>
        this.prisma.workItem.create({
          data: {
            weeklyReportId: targetReport.id,
            projectId: item.projectId,
            doneWork: item.doneWork,
            planWork: item.planWork,
            remarks: item.remarks ?? '',
            sortOrder: existingCount + idx,
          },
          include: { project: true },
        }),
      ),
    );

    return {
      report: targetReport,
      createdItems,
      message: `${createdItems.length}건의 전주 업무를 불러왔습니다.`,
    };
  }
}
