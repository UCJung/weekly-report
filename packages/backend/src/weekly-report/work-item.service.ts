import { Injectable, HttpStatus } from '@nestjs/common';
import { ProjectStatus, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { ReorderWorkItemsDto } from './dto/reorder-work-items.dto';

@Injectable()
export class WorkItemService {
  constructor(private prisma: PrismaService) {}

  async findByReportId(weeklyReportId: string) {
    return this.prisma.workItem.findMany({
      where: { weeklyReportId },
      orderBy: { sortOrder: 'asc' },
      include: { project: true },
    });
  }

  async create(weeklyReportId: string, memberId: string, dto: CreateWorkItemDto) {
    await this.findReportAndVerify(weeklyReportId, memberId);

    // INACTIVE 프로젝트 제약: 사용안함 프로젝트에는 신규 업무항목 작성 불가
    if (dto.projectId) {
      await this.verifyProjectActive(dto.projectId);
    }

    const maxOrder = await this.prisma.workItem.aggregate({
      where: { weeklyReportId },
      _max: { sortOrder: true },
    });

    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const data: Record<string, unknown> = {
      weeklyReportId,
      doneWork: dto.doneWork ?? '',
      planWork: dto.planWork ?? '',
      remarks: dto.remarks ?? '',
      sortOrder,
    };
    if (dto.projectId) {
      data.projectId = dto.projectId;
    }

    return this.prisma.workItem.create({
      data: data as Parameters<typeof this.prisma.workItem.create>[0]['data'],
      include: { project: true },
    });
  }

  async update(id: string, memberId: string, dto: UpdateWorkItemDto) {
    const workItem = await this.findWorkItemAndVerify(id, memberId);

    const report = await this.prisma.weeklyReport.findUnique({
      where: { id: workItem.weeklyReportId },
    });

    if (report?.status === ReportStatus.SUBMITTED) {
      throw new BusinessException(
        'WEEKLY_REPORT_SUBMITTED',
        '제출된 주간업무의 항목은 수정할 수 없습니다.',
        HttpStatus.CONFLICT,
      );
    }

    // INACTIVE 프로젝트 제약: 프로젝트를 변경하는 경우 INACTIVE 프로젝트로 변경 불가
    if (dto.projectId && dto.projectId !== workItem.projectId) {
      await this.verifyProjectActive(dto.projectId);
    }

    return this.prisma.workItem.update({
      where: { id },
      data: dto,
      include: { project: true },
    });
  }

  async delete(id: string, memberId: string) {
    await this.findWorkItemAndVerify(id, memberId);

    await this.prisma.workItem.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteByProject(reportId: string, projectId: string, memberId: string) {
    await this.findReportAndVerify(reportId, memberId);

    const result = await this.prisma.workItem.deleteMany({
      where: { weeklyReportId: reportId, projectId },
    });

    return { deleted: result.count };
  }

  async reorder(memberId: string, dto: ReorderWorkItemsDto) {
    // 모든 항목이 본인 소유인지 검증
    const ids = dto.items.map((i) => i.id);
    const workItems = await this.prisma.workItem.findMany({
      where: { id: { in: ids } },
      include: { weeklyReport: true },
    });

    for (const item of workItems) {
      if (item.weeklyReport.memberId !== memberId) {
        throw new BusinessException(
          'WORK_ITEM_FORBIDDEN',
          '본인의 업무항목만 수정할 수 있습니다.',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.workItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return { reordered: dto.items.length };
  }

  private async findReportAndVerify(weeklyReportId: string, memberId: string) {
    const report = await this.prisma.weeklyReport.findUnique({
      where: { id: weeklyReportId },
    });

    if (!report) {
      throw new BusinessException(
        'WEEKLY_REPORT_NOT_FOUND',
        '해당 주간업무를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (report.memberId !== memberId) {
      throw new BusinessException(
        'WEEKLY_REPORT_FORBIDDEN',
        '본인의 주간업무만 접근할 수 있습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (report.status === ReportStatus.SUBMITTED) {
      throw new BusinessException(
        'WEEKLY_REPORT_SUBMITTED',
        '제출된 주간업무에는 항목을 추가할 수 없습니다.',
        HttpStatus.CONFLICT,
      );
    }

    return report;
  }

  private async verifyProjectActive(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true, name: true },
    });
    if (!project) {
      throw new BusinessException(
        'PROJECT_NOT_FOUND',
        '프로젝트를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }
    if (project.status === ProjectStatus.INACTIVE) {
      throw new BusinessException(
        'PROJECT_INACTIVE',
        `"${project.name}" 프로젝트는 사용안함 상태입니다. 신규 업무항목을 작성할 수 없습니다.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  private async findWorkItemAndVerify(id: string, memberId: string) {
    const workItem = await this.prisma.workItem.findUnique({
      where: { id },
      include: { weeklyReport: true },
    });

    if (!workItem) {
      throw new BusinessException(
        'WORK_ITEM_NOT_FOUND',
        '업무항목을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (workItem.weeklyReport.memberId !== memberId) {
      throw new BusinessException(
        'WORK_ITEM_FORBIDDEN',
        '본인의 업무항목만 접근할 수 있습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    return workItem;
  }
}
