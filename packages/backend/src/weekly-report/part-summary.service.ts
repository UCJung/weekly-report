import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma, ReportStatus, SummaryScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { CreatePartSummaryDto } from './dto/create-part-summary.dto';
import { UpdatePartSummaryDto } from './dto/update-part-summary.dto';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { MergeRowsDto } from './dto/merge-rows.dto';
import { UpdateSummaryWorkItemDto } from './dto/update-summary-work-item.dto';
import { getWeekRange } from '@uc-teamspace/shared/constants/week-utils';

/** Reusable Prisma include for WorkItems with project */
const WORK_ITEMS_WITH_PROJECT = {
  include: { project: true },
  orderBy: { sortOrder: 'asc' as const },
};

/** Reusable Prisma include for SummaryWorkItems with project */
const SUMMARY_ITEMS_WITH_PROJECT = {
  orderBy: { sortOrder: 'asc' as const },
  include: { project: true },
};

@Injectable()
export class PartSummaryService {
  constructor(private prisma: PrismaService) {}

  async findByPartAndWeek(partId: string, weekLabel: string) {
    const { start } = getWeekRange(weekLabel);
    return this.prisma.partSummary.findUnique({
      where: { partId_weekStart: { partId, weekStart: start } },
      include: {
        summaryWorkItems: SUMMARY_ITEMS_WITH_PROJECT,
      },
    });
  }

  async create(dto: CreatePartSummaryDto) {
    const { start } = getWeekRange(dto.weekLabel);

    const existing = await this.prisma.partSummary.findUnique({
      where: { partId_weekStart: { partId: dto.partId, weekStart: start } },
    });

    if (existing) {
      throw new BusinessException(
        'PART_SUMMARY_ALREADY_EXISTS',
        '해당 파트·주차의 취합보고가 이미 존재합니다.',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.partSummary.create({
      data: {
        partId: dto.partId,
        weekStart: start,
        weekLabel: dto.weekLabel,
        status: ReportStatus.DRAFT,
      },
      include: { summaryWorkItems: true },
    });
  }

  async update(id: string, dto: UpdatePartSummaryDto) {
    const summary = await this.findById(id);

    return this.prisma.partSummary.update({
      where: { id: summary.id },
      data: { ...(dto.status && { status: dto.status }) },
      include: {
        summaryWorkItems: SUMMARY_ITEMS_WITH_PROJECT,
      },
    });
  }

  async autoMerge(id: string) {
    const summary = await this.findById(id);

    if (!summary.partId) {
      throw new BusinessException(
        'PART_SUMMARY_NO_PART',
        '파트가 지정되지 않은 취합보고입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 해당 파트 팀원들의 WeeklyReport 조회
    const members = await this.prisma.member.findMany({
      where: { partId: summary.partId!, isActive: true },
    });

    const memberIds = members.map((m) => m.id);

    const reports = await this.prisma.weeklyReport.findMany({
      where: {
        memberId: { in: memberIds },
        weekStart: summary.weekStart,
      },
      include: {
        member: true,
        workItems: {
          include: { project: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // 기존 SummaryWorkItem 삭제
    await this.prisma.summaryWorkItem.deleteMany({
      where: { partSummaryId: id },
    });

    // WorkItem을 Project별로 그룹화 후 병합
    const projectMap = new Map<string, {
      projectId: string;
      doneWorks: string[];
      planWorks: string[];
    }>();

    for (const report of reports) {
      for (const item of report.workItems) {
        const key = item.projectId ?? '__no_project__';
        if (!projectMap.has(key)) {
          projectMap.set(key, { projectId: key, doneWorks: [], planWorks: [] });
        }
        const entry = projectMap.get(key)!;

        if (item.doneWork.trim()) {
          entry.doneWorks.push(`[${report.member.name}] ${item.doneWork.trim()}`);
        }
        if (item.planWork.trim()) {
          entry.planWorks.push(`[${report.member.name}] ${item.planWork.trim()}`);
        }
      }
    }

    // SummaryWorkItem 생성
    const summaryItems = await this.prisma.$transaction(
      Array.from(projectMap.entries()).map(([, entry], idx) =>
        this.prisma.summaryWorkItem.create({
          data: {
            partSummaryId: id,
            projectId: entry.projectId,
            doneWork: entry.doneWorks.join('\n'),
            planWork: entry.planWorks.join('\n'),
            remarks: '',
            sortOrder: idx,
          },
          include: { project: true },
        }),
      ),
    );

    return {
      summary,
      summaryWorkItems: summaryItems,
      mergedCount: summaryItems.length,
    };
  }

  async getPartWeeklyStatus(partId: string, week: string) {
    const { start } = getWeekRange(week);

    const members = await this.prisma.member.findMany({
      where: { partId, isActive: true },
      include: {
        part: true,
        weeklyReports: {
          where: { weekStart: start },
          include: {
            workItems: WORK_ITEMS_WITH_PROJECT,
          },
        },
      },
    });

    return members.map((member) => ({
      member: {
        id: member.id,
        name: member.name,
        roles: member.roles,
        partId: member.partId,
        partName: member.part?.name ?? '',
      },
      report: member.weeklyReports[0] ?? null,
    }));
  }

  async getTeamMembersWeeklyStatus(teamId: string, week: string) {
    const { start } = getWeekRange(week);

    const parts = await this.prisma.part.findMany({
      where: { teamId },
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

    const result: Array<{
      member: { id: string; name: string; roles: string[]; partId: string; partName: string };
      report: typeof parts[0]['members'][0]['weeklyReports'][0] | null;
    }> = [];

    for (const part of parts) {
      for (const member of part.members) {
        result.push({
          member: {
            id: member.id,
            name: member.name,
            roles: member.roles,
            partId: part.id,
            partName: part.name,
          },
          report: member.weeklyReports[0] ?? null,
        });
      }
    }

    return result;
  }

  async getPartSubmissionStatus(partId: string, week: string) {
    const { start } = getWeekRange(week);

    const members = await this.prisma.member.findMany({
      where: { partId, isActive: true },
      include: {
        weeklyReports: {
          where: { weekStart: start },
          select: { id: true, status: true },
        },
      },
    });

    return members.map((member) => {
      const report = member.weeklyReports[0];
      return {
        memberId: member.id,
        memberName: member.name,
        status: report ? report.status : 'NOT_STARTED',
      };
    });
  }

  async getTeamWeeklyOverview(teamId: string, week: string) {
    const { start } = getWeekRange(week);

    const parts = await this.prisma.part.findMany({
      where: { teamId },
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
        partSummaries: {
          where: { weekStart: start },
          select: { id: true, status: true },
        },
      },
    });

    return parts.map((part) => ({
      part: { id: part.id, name: part.name },
      summaryStatus: part.partSummaries[0]?.status ?? 'NOT_STARTED',
      members: part.members.map((member) => ({
        member: {
          id: member.id,
          name: member.name,
          roles: member.roles,
          position: member.position,
          jobTitle: member.jobTitle,
          partId: part.id,
          partName: part.name,
        },
        report: member.weeklyReports[0] ?? null,
      })),
    }));
  }

  // ── 신규 취합 API 메서드 ──

  async createSummary(dto: CreateSummaryDto) {
    const { start } = getWeekRange(dto.weekLabel);

    if (dto.scope === SummaryScope.PART && dto.partId) {
      const existing = await this.prisma.partSummary.findUnique({
        where: { partId_weekStart: { partId: dto.partId, weekStart: start } },
      });
      if (existing) {
        return this.prisma.partSummary.findUnique({
          where: { id: existing.id },
          include: { summaryWorkItems: SUMMARY_ITEMS_WITH_PROJECT },
        });
      }
    }

    const title = dto.title ?? (dto.scope === SummaryScope.TEAM ? '팀 취합보고' : '파트 취합보고');

    return this.prisma.partSummary.create({
      data: {
        scope: dto.scope,
        partId: dto.scope === SummaryScope.PART ? dto.partId : null,
        teamId: dto.scope === SummaryScope.TEAM ? dto.teamId : null,
        weekStart: start,
        weekLabel: dto.weekLabel,
        title,
        status: ReportStatus.DRAFT,
      },
      include: { summaryWorkItems: SUMMARY_ITEMS_WITH_PROJECT },
    });
  }

  async findByScopeAndWeek(params: { scope: SummaryScope; partId?: string; teamId?: string; weekLabel: string }) {
    const { start } = getWeekRange(params.weekLabel);

    if (params.scope === SummaryScope.PART && params.partId) {
      return this.prisma.partSummary.findUnique({
        where: { partId_weekStart: { partId: params.partId, weekStart: start } },
        include: { summaryWorkItems: SUMMARY_ITEMS_WITH_PROJECT },
      });
    }

    // TEAM scope: teamId로 조회
    return this.prisma.partSummary.findFirst({
      where: {
        scope: SummaryScope.TEAM,
        teamId: params.teamId,
        weekStart: start,
      },
      include: { summaryWorkItems: SUMMARY_ITEMS_WITH_PROJECT },
    });
  }

  async loadMemberRows(summaryId: string) {
    const summary = await this.findById(summaryId);

    if (summary.status === ReportStatus.SUBMITTED) {
      throw new BusinessException(
        'SUMMARY_ALREADY_SUBMITTED',
        '이미 제출된 취합보고는 수정할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // scope에 따라 팀원 범위 결정
    let memberFilter: Prisma.MemberWhereInput;
    if (summary.scope === SummaryScope.PART && summary.partId) {
      memberFilter = { partId: summary.partId, isActive: true };
    } else if (summary.scope === SummaryScope.TEAM && summary.teamId) {
      memberFilter = { isActive: true, part: { teamId: summary.teamId } };
    } else {
      throw new BusinessException(
        'INVALID_SUMMARY_SCOPE',
        '취합보고의 범위 설정이 올바르지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const members = await this.prisma.member.findMany({
      where: memberFilter,
      include: {
        part: true,
        weeklyReports: {
          where: { weekStart: summary.weekStart },
          include: {
            workItems: WORK_ITEMS_WITH_PROJECT,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // 기존 summaryWorkItems 삭제
    await this.prisma.summaryWorkItem.deleteMany({
      where: { partSummaryId: summaryId },
    });

    // 각 WorkItem을 개별 SummaryWorkItem으로 생성
    const createOps: Parameters<typeof this.prisma.summaryWorkItem.create>[0][] = [];
    let sortIdx = 0;

    for (const member of members) {
      const report = member.weeklyReports[0];
      if (!report) continue;

      for (const item of report.workItems) {
        if (!item.projectId) continue;
        createOps.push({
          data: {
            partSummaryId: summaryId,
            projectId: item.projectId,
            doneWork: item.doneWork,
            planWork: item.planWork,
            remarks: item.remarks ?? '',
            memberNames: `${member.name}(${member.part?.name ?? ''})`,
            sortOrder: (item.project?.sortOrder ?? 0) * 1000 + sortIdx,
          },
          include: { project: true },
        });
        sortIdx++;
      }
    }

    await this.prisma.$transaction(
      createOps.map((op) => this.prisma.summaryWorkItem.create(op)),
    );

    return this.prisma.partSummary.findUnique({
      where: { id: summaryId },
      include: { summaryWorkItems: SUMMARY_ITEMS_WITH_PROJECT },
    });
  }

  async mergeRows(summaryId: string, dto: MergeRowsDto) {
    const summary = await this.findById(summaryId);

    if (summary.status === ReportStatus.SUBMITTED) {
      throw new BusinessException(
        'SUMMARY_ALREADY_SUBMITTED',
        '이미 제출된 취합보고는 수정할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const items = await this.prisma.summaryWorkItem.findMany({
      where: { id: { in: dto.summaryWorkItemIds }, partSummaryId: summaryId },
      include: { project: true },
    });

    if (items.length < 2) {
      throw new BusinessException(
        'MERGE_MIN_TWO',
        '병합하려면 최소 2개 항목이 필요합니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 같은 프로젝트 검증
    const projectIds = new Set(items.map((i) => i.projectId));
    if (projectIds.size > 1) {
      throw new BusinessException(
        'MERGE_DIFFERENT_PROJECTS',
        '같은 프로젝트의 항목만 병합할 수 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 텍스트 병합
    const doneWork = items.map((i) => i.doneWork).filter((t) => t.trim()).join('\n');
    const planWork = items.map((i) => i.planWork).filter((t) => t.trim()).join('\n');
    const remarks = items.map((i) => i.remarks).filter((t) => t && t.trim()).join('\n');
    const memberNames = items
      .map((i) => i.memberNames)
      .filter(Boolean)
      .join(', ');

    const [first, ...rest] = items;

    await this.prisma.$transaction([
      this.prisma.summaryWorkItem.update({
        where: { id: first.id },
        data: { doneWork, planWork, remarks, memberNames },
      }),
      this.prisma.summaryWorkItem.deleteMany({
        where: { id: { in: rest.map((r) => r.id) } },
      }),
    ]);

    return this.prisma.summaryWorkItem.findUnique({
      where: { id: first.id },
      include: { project: true },
    });
  }

  async updateSummaryWorkItem(id: string, dto: UpdateSummaryWorkItemDto) {
    const item = await this.prisma.summaryWorkItem.findUnique({
      where: { id },
      include: { partSummary: true },
    });

    if (!item) {
      throw new BusinessException(
        'SUMMARY_WORK_ITEM_NOT_FOUND',
        '취합 업무항목을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (item.partSummary.status === ReportStatus.SUBMITTED) {
      throw new BusinessException(
        'SUMMARY_ALREADY_SUBMITTED',
        '이미 제출된 취합보고는 수정할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.summaryWorkItem.update({
      where: { id },
      data: {
        ...(dto.doneWork !== undefined && { doneWork: dto.doneWork }),
        ...(dto.planWork !== undefined && { planWork: dto.planWork }),
        ...(dto.remarks !== undefined && { remarks: dto.remarks }),
      },
      include: { project: true },
    });
  }

  async deleteSummaryWorkItem(id: string) {
    const item = await this.prisma.summaryWorkItem.findUnique({
      where: { id },
      include: { partSummary: true },
    });

    if (!item) {
      throw new BusinessException(
        'SUMMARY_WORK_ITEM_NOT_FOUND',
        '취합 업무항목을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (item.partSummary.status === ReportStatus.SUBMITTED) {
      throw new BusinessException(
        'SUMMARY_ALREADY_SUBMITTED',
        '이미 제출된 취합보고는 수정할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.summaryWorkItem.delete({ where: { id } });
    return { deleted: true };
  }

  private async findById(id: string) {
    const summary = await this.prisma.partSummary.findUnique({
      where: { id },
      include: {
        summaryWorkItems: true,
      },
    });

    if (!summary) {
      throw new BusinessException(
        'PART_SUMMARY_NOT_FOUND',
        '파트 취합보고를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    return summary;
  }
}
