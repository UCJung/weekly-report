import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { getWeekRange } from '../weekly-report/week-utils';
import { ExportQueryDto, ExportType } from './dto/export-query.dto';

@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService) {}

  async generateExcel(query: ExportQueryDto): Promise<{ buffer: Buffer; filename: string }> {
    if (query.type === ExportType.SUMMARY) {
      return this.generateSummaryExcel(query.summaryId!, query.week);
    }
    if (query.type === ExportType.PART) {
      return this.generatePartExcel(query.partId!, query.week);
    }
    return this.generateTeamExcel(query.teamId!, query.week);
  }

  private async generatePartExcel(partId: string, week: string): Promise<{ buffer: Buffer; filename: string }> {
    const { start } = getWeekRange(week);

    const part = await this.prisma.part.findUnique({
      where: { id: partId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            weeklyReports: {
              where: { weekStart: start },
              include: {
                workItems: {
                  include: { project: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('주간업무보고');

    this.setupHeaders(sheet);

    let rowIdx = 2;
    for (const member of part?.members ?? []) {
      const report = member.weeklyReports[0];
      const items = report?.workItems ?? [];

      if (items.length === 0) {
        const row = sheet.getRow(rowIdx);
        row.getCell(1).value = part?.name ?? '';
        row.getCell(2).value = member.name;
        row.getCell(3).value = '';
        row.getCell(4).value = '';
        row.getCell(5).value = '';
        row.getCell(6).value = '';
        row.getCell(7).value = '';
        row.commit();
        rowIdx++;
      } else {
        const startRow = rowIdx;
        for (const item of items) {
          const row = sheet.getRow(rowIdx);
          row.getCell(1).value = part?.name ?? '';
          row.getCell(2).value = member.name;
          row.getCell(3).value = item.project?.name ?? '';
          row.getCell(4).value = item.project?.code ?? '';
          row.getCell(5).value = item.doneWork;
          row.getCell(6).value = item.planWork;
          row.getCell(7).value = item.remarks ?? '';
          this.applyRowStyle(row);
          row.commit();
          rowIdx++;
        }
        // 파트·성명 셀 병합
        if (rowIdx - startRow > 1) {
          sheet.mergeCells(startRow, 1, rowIdx - 1, 1);
          sheet.mergeCells(startRow, 2, rowIdx - 1, 2);
        }
      }
    }

    this.applyBorderAll(sheet, rowIdx - 1);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { buffer, filename: `${part?.name ?? 'part'}_${week}.xlsx` };
  }

  private async generateTeamExcel(teamId: string, week: string): Promise<{ buffer: Buffer; filename: string }> {
    const { start } = getWeekRange(week);

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        parts: {
          include: {
            members: {
              where: { isActive: true },
              include: {
                weeklyReports: {
                  where: { weekStart: start },
                  include: {
                    workItems: {
                      include: { project: true },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('팀 주간업무보고');

    this.setupHeaders(sheet);

    let rowIdx = 2;
    for (const part of team?.parts ?? []) {
      for (const member of part.members) {
        const report = member.weeklyReports[0];
        const items = report?.workItems ?? [];

        if (items.length === 0) {
          const row = sheet.getRow(rowIdx);
          row.getCell(1).value = part.name;
          row.getCell(2).value = member.name;
          this.applyRowStyle(row);
          row.commit();
          rowIdx++;
        } else {
          const startRow = rowIdx;
          for (const item of items) {
            const row = sheet.getRow(rowIdx);
            row.getCell(1).value = part.name;
            row.getCell(2).value = member.name;
            row.getCell(3).value = item.project?.name ?? '';
            row.getCell(4).value = item.project?.code ?? '';
            row.getCell(5).value = item.doneWork;
            row.getCell(6).value = item.planWork;
            row.getCell(7).value = item.remarks ?? '';
            this.applyRowStyle(row);
            row.commit();
            rowIdx++;
          }
          if (rowIdx - startRow > 1) {
            sheet.mergeCells(startRow, 1, rowIdx - 1, 1);
            sheet.mergeCells(startRow, 2, rowIdx - 1, 2);
          }
        }
      }
    }

    this.applyBorderAll(sheet, rowIdx - 1);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { buffer, filename: `팀_주간업무보고_${week}.xlsx` };
  }

  private async generateSummaryExcel(summaryId: string, week: string): Promise<{ buffer: Buffer; filename: string }> {
    const summary = await this.prisma.partSummary.findUnique({
      where: { id: summaryId },
      include: {
        summaryWorkItems: {
          include: { project: true },
          orderBy: { id: 'asc' },
        },
        part: true,
        team: true,
      },
    });

    const workbook = new ExcelJS.Workbook();
    const scopeLabel = summary?.scope === 'TEAM' ? '팀' : (summary?.part?.name ?? '파트');
    const sheet = workbook.addWorksheet('보고서 취합');

    // 헤더 설정 (취합보고서 형식: 프로젝트 | 팀원(파트) | 진행업무 | 예정업무 | 비고)
    sheet.columns = [
      { header: '프로젝트', key: 'project', width: 18 },
      { header: '팀원(파트)', key: 'member', width: 15 },
      { header: '진행업무', key: 'doneWork', width: 40 },
      { header: '예정업무', key: 'planWork', width: 40 },
      { header: '비고', key: 'remarks', width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E0FF' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    headerRow.height = 20;

    const items = summary?.summaryWorkItems ?? [];
    let rowIdx = 2;

    // 프로젝트별 그룹핑 (연속 동일 프로젝트 병합)
    let groupStart = rowIdx;
    let prevProjectId: string | null = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = sheet.getRow(rowIdx);
      row.getCell(1).value = item.project?.name ?? '';
      row.getCell(2).value = item.memberNames ?? '';
      row.getCell(3).value = item.doneWork;
      row.getCell(4).value = item.planWork;
      row.getCell(5).value = item.remarks ?? '';
      this.applyRowStyle(row);
      row.commit();

      const currentProjectId = item.projectId;
      const nextProjectId = i + 1 < items.length ? items[i + 1].projectId : null;

      if (prevProjectId === null) {
        groupStart = rowIdx;
        prevProjectId = currentProjectId;
      }

      // 그룹 끝: 다음 행이 다른 프로젝트이거나 마지막 행
      if (currentProjectId !== nextProjectId) {
        if (rowIdx > groupStart) {
          sheet.mergeCells(groupStart, 1, rowIdx, 1);
          const mergedCell = sheet.getRow(groupStart).getCell(1);
          mergedCell.alignment = { vertical: 'middle', wrapText: true };
        }
        prevProjectId = null;
      }

      rowIdx++;
    }

    this.applyBorderAll(sheet, rowIdx - 1);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { buffer, filename: `보고서취합_${scopeLabel}_${week}.xlsx` };
  }

  private setupHeaders(sheet: ExcelJS.Worksheet): void {
    sheet.columns = [
      { header: '파트', key: 'part', width: 12 },
      { header: '성명', key: 'name', width: 10 },
      { header: '프로젝트명', key: 'projectName', width: 20 },
      { header: '코드', key: 'code', width: 15 },
      { header: '진행업무', key: 'doneWork', width: 40 },
      { header: '예정업무', key: 'planWork', width: 40 },
      { header: '비고', key: 'remarks', width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8E0FF' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    headerRow.height = 20;
  }

  private applyRowStyle(row: ExcelJS.Row): void {
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
    });
    row.height = 60;
  }

  private applyBorderAll(sheet: ExcelJS.Worksheet, lastRow: number): void {
    for (let r = 2; r <= lastRow; r++) {
      sheet.getRow(r).eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  }
}
