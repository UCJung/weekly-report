import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { ApprovalType, Prisma, TimesheetStatus } from '@prisma/client';

// 엑셀 생성에 필요한 시간표 + include 타입
type TimesheetWithDetail = Prisma.MonthlyTimesheetGetPayload<{
  include: {
    member: { select: { id: true; name: true; position: true } };
    team: { select: { id: true; name: true } };
    entries: {
      include: {
        workLogs: {
          include: { project: { select: { id: true; name: true; code: true } } };
        };
      };
    };
    approvals: {
      include: { approver: { select: { id: true; name: true } } };
    };
  };
}>;

@Injectable()
export class TimesheetExportService {
  private readonly logger = new Logger(TimesheetExportService.name);

  constructor(private prisma: PrismaService) {}

  /** 월간 투입 현황 엑셀 다운로드 */
  async generateMonthlyExcel(yearMonth: string): Promise<{ buffer: Buffer; filename: string }> {
    const timesheets = await this.prisma.monthlyTimesheet.findMany({
      where: { yearMonth },
      include: {
        member: { select: { id: true, name: true, position: true } },
        team: { select: { id: true, name: true } },
        entries: {
          include: {
            workLogs: {
              include: { project: { select: { id: true, name: true, code: true } } },
            },
          },
          orderBy: { date: 'asc' },
        },
        approvals: {
          include: { approver: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ team: { name: 'asc' } }, { member: { name: 'asc' } }],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UC TeamSpace';
    workbook.created = new Date();

    // 시트1: 투입 현황 요약
    this.buildSummarySheet(workbook, timesheets, yearMonth);

    // 시트2: 프로젝트별 투입 매트릭스
    this.buildProjectMatrixSheet(workbook, timesheets, yearMonth);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const filename = `투입현황_${yearMonth}.xlsx`;

    this.logger.log(`엑셀 다운로드: yearMonth=${yearMonth}, timesheets=${timesheets.length}`);
    return { buffer, filename };
  }

  private buildSummarySheet(
    workbook: ExcelJS.Workbook,
    timesheets: TimesheetWithDetail[],
    yearMonth: string,
  ) {
    const sheet = workbook.addWorksheet('투입현황 요약');

    sheet.columns = [
      { header: '팀', key: 'team', width: 20 },
      { header: '성명', key: 'name', width: 12 },
      { header: '직급', key: 'position', width: 14 },
      { header: '총 투입시간', key: 'totalHours', width: 14 },
      { header: '근무일수', key: 'workDays', width: 12 },
      { header: '상태', key: 'status', width: 12 },
      { header: '제출일', key: 'submittedAt', width: 18 },
      { header: '팀장 승인', key: 'leaderApproval', width: 14 },
      { header: '관리자 승인', key: 'adminApproval', width: 14 },
    ];

    this.applyHeaderStyle(sheet.getRow(1));

    let rowIdx = 2;
    for (const ts of timesheets) {
      let totalHours = 0;
      let workDays = 0;

      for (const entry of ts.entries) {
        const entryHours = entry.workLogs.reduce((sum: number, wl: { hours: number }) => sum + wl.hours, 0);
        if (entryHours > 0) {
          workDays++;
          totalHours += entryHours;
        }
      }

      const leaderApproval = ts.approvals.find((a) => a.approvalType === ApprovalType.LEADER);
      const adminApproval = ts.approvals.find((a) => a.approvalType === ApprovalType.ADMIN);

      const row = sheet.getRow(rowIdx);
      row.getCell(1).value = ts.team.name;
      row.getCell(2).value = ts.member.name;
      row.getCell(3).value = this.positionLabel(ts.member.position as string | null);
      row.getCell(4).value = Math.round(totalHours * 10) / 10;
      row.getCell(5).value = workDays;
      row.getCell(6).value = this.statusLabel(ts.status);
      row.getCell(7).value = ts.submittedAt ? ts.submittedAt.toISOString().split('T')[0] : '';
      row.getCell(8).value = leaderApproval
        ? leaderApproval.status === TimesheetStatus.APPROVED ? '승인' : '반려'
        : '-';
      row.getCell(9).value = adminApproval
        ? adminApproval.status === TimesheetStatus.APPROVED ? '승인' : '-'
        : '-';

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: false };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      row.commit();
      rowIdx++;
    }

    // 제목 행 삽입
    sheet.insertRow(1, [`${yearMonth} 월간 투입현황 요약`]);
    sheet.mergeCells(1, 1, 1, 9);
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).font = { bold: true, size: 14 };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 28;
  }

  private buildProjectMatrixSheet(
    workbook: ExcelJS.Workbook,
    timesheets: TimesheetWithDetail[],
    yearMonth: string,
  ) {
    const sheet = workbook.addWorksheet('프로젝트별 투입');

    // 프로젝트 목록 수집
    const projectMap = new Map<string, { id: string; name: string; code: string }>();
    for (const ts of timesheets) {
      for (const entry of ts.entries) {
        for (const wl of entry.workLogs) {
          if (wl.project) {
            projectMap.set(wl.project.id, wl.project);
          }
        }
      }
    }
    const projects = Array.from(projectMap.values());

    const fixedCols = [
      { header: '팀', key: 'team', width: 20 },
      { header: '성명', key: 'name', width: 12 },
      { header: '총 투입시간', key: 'totalHours', width: 14 },
    ];
    const projectCols = projects.flatMap((p) => [
      { header: `${p.code}\n시간(h)`, key: `${p.id}_h`, width: 12 },
      { header: `${p.code}\n비율(%)`, key: `${p.id}_r`, width: 12 },
    ]);
    sheet.columns = [...fixedCols, ...projectCols];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E0FF' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    headerRow.height = 36;

    let rowIdx = 2;
    for (const ts of timesheets) {
      const projectHours = new Map<string, number>();
      let totalHours = 0;

      for (const entry of ts.entries) {
        for (const wl of entry.workLogs) {
          const current = projectHours.get(wl.projectId) ?? 0;
          projectHours.set(wl.projectId, current + wl.hours);
          totalHours += wl.hours;
        }
      }

      const row = sheet.getRow(rowIdx);
      row.getCell(1).value = ts.team.name;
      row.getCell(2).value = ts.member.name;
      row.getCell(3).value = Math.round(totalHours * 10) / 10;

      projects.forEach((p, i) => {
        const hours = Math.round((projectHours.get(p.id) ?? 0) * 10) / 10;
        const ratio = totalHours > 0 ? Math.round((hours / totalHours) * 1000) / 10 : 0;
        row.getCell(4 + i * 2).value = hours;
        row.getCell(5 + i * 2).value = ratio;
      });

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      row.commit();
      rowIdx++;
    }

    // 제목 행 삽입
    const totalCols = 3 + projects.length * 2;
    sheet.insertRow(1, [`${yearMonth} 프로젝트별 투입현황`]);
    sheet.mergeCells(1, 1, 1, Math.max(totalCols, 1));
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).font = { bold: true, size: 14 };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 28;
  }

  private applyHeaderStyle(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E0FF' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    row.height = 20;
  }

  private positionLabel(position: string | null): string {
    const map: Record<string, string> = {
      DIRECTOR: '이사',
      GENERAL_MANAGER: '부장',
      DEPUTY_MANAGER: '차장',
      ASSISTANT_MANAGER: '과장',
      STAFF: '사원',
      PRINCIPAL_RESEARCHER: '수석연구원',
      SENIOR_RESEARCHER: '선임연구원',
      RESEARCHER: '연구원',
      ASSOCIATE_RESEARCHER: '연구보조원',
    };
    return position ? (map[position] ?? position) : '-';
  }

  private statusLabel(status: TimesheetStatus): string {
    const map: Record<TimesheetStatus, string> = {
      DRAFT: '작성중',
      SUBMITTED: '제출됨',
      APPROVED: '승인됨',
      REJECTED: '반려됨',
    };
    return map[status] ?? status;
  }
}
