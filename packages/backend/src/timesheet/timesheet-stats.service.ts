import { Injectable, Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { ApprovalType, AttendanceType, TimesheetStatus } from '@prisma/client';
import { getRequiredHours } from '@uc-teamspace/shared';

@Injectable()
export class TimesheetStatsService {
  private readonly logger = new Logger(TimesheetStatsService.name);

  constructor(private prisma: PrismaService) {}

  /** 팀원 제출현황: 팀원별 제출상태, 총근무시간, 근무일수 */
  async getTeamMembersStatus(teamId: string, yearMonth: string) {
    const memberships = await this.prisma.teamMembership.findMany({
      where: { teamId },
      include: {
        member: {
          select: { id: true, name: true, position: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const results = await Promise.all(
      memberships.map(async (membership) => {
        const member = membership.member;
        const timesheet = await this.prisma.monthlyTimesheet.findUnique({
          where: {
            memberId_teamId_yearMonth: {
              memberId: member.id,
              teamId,
              yearMonth,
            },
          },
          include: {
            entries: {
              include: { workLogs: true },
            },
            approvals: {
              include: { approver: { select: { id: true, name: true } } },
            },
          },
        });

        if (!timesheet) {
          return {
            memberId: member.id,
            memberName: member.name,
            position: member.position,
            timesheetId: null,
            status: 'NOT_STARTED' as string,
            totalWorkHours: 0,
            workDays: 0,
            leaderApproval: null,
            adminApproval: null,
            submittedAt: null,
          };
        }

        let totalWorkHours = 0;
        let workDays = 0;

        for (const entry of timesheet.entries) {
          const attendance = entry.attendance as AttendanceType;
          const required = getRequiredHours(attendance);
          if (required > 0) {
            workDays++;
            totalWorkHours += entry.workLogs.reduce((sum, wl) => sum + wl.hours, 0);
          }
        }

        const leaderApproval = timesheet.approvals.find((a) => a.approvalType === ApprovalType.LEADER) ?? null;
        const adminApproval = timesheet.approvals.find((a) => a.approvalType === ApprovalType.ADMIN) ?? null;

        return {
          memberId: member.id,
          memberName: member.name,
          position: member.position,
          timesheetId: timesheet.id,
          status: timesheet.status,
          totalWorkHours: Math.round(totalWorkHours * 10) / 10,
          workDays,
          leaderApproval: leaderApproval
            ? {
                status: leaderApproval.status,
                approver: leaderApproval.approver,
                approvedAt: leaderApproval.approvedAt,
                comment: leaderApproval.comment,
              }
            : null,
          adminApproval: adminApproval
            ? {
                status: adminApproval.status,
                approver: adminApproval.approver,
                approvedAt: adminApproval.approvedAt,
              }
            : null,
          submittedAt: timesheet.submittedAt,
        };
      }),
    );

    return results;
  }

  /** 팀원×프로젝트 투입 매트릭스: 팀원별 프로젝트별 투입시간/비율 */
  async getTeamSummary(teamId: string, yearMonth: string) {
    // 해당 팀+월 모든 시간표 조회
    const timesheets = await this.prisma.monthlyTimesheet.findMany({
      where: { teamId, yearMonth },
      include: {
        member: { select: { id: true, name: true, position: true } },
        entries: {
          include: {
            workLogs: {
              include: { project: { select: { id: true, name: true, code: true } } },
            },
          },
        },
      },
    });

    if (timesheets.length === 0) {
      return { members: [], projects: [], matrix: [] };
    }

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

    // 팀원별 총근무시간 + 프로젝트별 투입시간 계산
    const matrix = timesheets.map((ts) => {
      let totalHours = 0;
      const projectHours = new Map<string, number>();

      for (const entry of ts.entries) {
        for (const wl of entry.workLogs) {
          totalHours += wl.hours;
          const current = projectHours.get(wl.projectId) ?? 0;
          projectHours.set(wl.projectId, current + wl.hours);
        }
      }

      const projectBreakdown = projects.map((p) => {
        const hours = Math.round((projectHours.get(p.id) ?? 0) * 10) / 10;
        const ratio = totalHours > 0 ? Math.round((hours / totalHours) * 1000) / 10 : 0;
        return {
          projectId: p.id,
          hours,
          ratio,
        };
      });

      return {
        memberId: ts.member.id,
        memberName: ts.member.name,
        position: ts.member.position,
        timesheetId: ts.id,
        status: ts.status,
        totalHours: Math.round(totalHours * 10) / 10,
        projectBreakdown,
      };
    });

    return { projects, matrix };
  }

  /** PM: 월간 투입현황 — 해당 프로젝트에 투입된 인원/시간/비율 */
  async getProjectAllocationMonthly(projectId: string, yearMonth: string, requesterId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, code: true, managerId: true },
    });

    if (!project) {
      throw new BusinessException('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    // M+5 자동승인 체크: yearMonth 종료 후 5일 경과 시 auto-approve
    await this.checkAndAutoApprove(projectId, yearMonth, requesterId);

    // 해당 프로젝트의 워크로그가 있는 모든 시간표 조회
    const entries = await this.prisma.timesheetEntry.findMany({
      where: {
        timesheet: { yearMonth },
        workLogs: { some: { projectId } },
      },
      include: {
        timesheet: {
          include: {
            member: { select: { id: true, name: true, position: true } },
            approvals: {
              where: { approvalType: ApprovalType.PROJECT_MANAGER },
            },
          },
        },
        workLogs: {
          where: { projectId },
        },
      },
    });

    // 멤버별 집계
    const memberMap = new Map<
      string,
      { memberId: string; memberName: string; position: string | null; totalHours: number; pmApproval: { status: string; approvedAt: Date | null; autoApproved: boolean } | null }
    >();

    for (const entry of entries) {
      const member = entry.timesheet.member;
      const projectHours = entry.workLogs.reduce((sum, wl) => sum + wl.hours, 0);
      const pmApproval = entry.timesheet.approvals[0] ?? null;

      const existing = memberMap.get(member.id);
      if (existing) {
        existing.totalHours += projectHours;
      } else {
        memberMap.set(member.id, {
          memberId: member.id,
          memberName: member.name,
          position: member.position as string | null,
          totalHours: projectHours,
          pmApproval: pmApproval
            ? { status: pmApproval.status, approvedAt: pmApproval.approvedAt, autoApproved: pmApproval.autoApproved }
            : null,
        });
      }
    }

    // 전체 투입시간 계산
    const members = Array.from(memberMap.values()).map((m) => ({
      ...m,
      totalHours: Math.round(m.totalHours * 10) / 10,
    }));

    const totalProjectHours = members.reduce((sum, m) => sum + m.totalHours, 0);

    // 개인별 해당 월 총근무시간 조회 후 비율 계산
    const membersWithRatio = await Promise.all(
      members.map(async (m) => {
        const ts = await this.prisma.monthlyTimesheet.findFirst({
          where: { memberId: m.memberId, yearMonth },
          include: { entries: { include: { workLogs: true } } },
        });

        const memberTotalHours = ts
          ? ts.entries.reduce((sum, e) => sum + e.workLogs.reduce((s, wl) => s + wl.hours, 0), 0)
          : 0;

        const ratio =
          memberTotalHours > 0 ? Math.round((m.totalHours / memberTotalHours) * 1000) / 10 : 0;

        return { ...m, memberTotalHours: Math.round(memberTotalHours * 10) / 10, ratio };
      }),
    );

    return {
      project,
      yearMonth,
      totalProjectHours: Math.round(totalProjectHours * 10) / 10,
      memberCount: members.length,
      members: membersWithRatio,
    };
  }

  /** PM: 연간 투입현황 — 1~12월 월별 투입 매트릭스 */
  async getProjectAllocationYearly(projectId: string, year: string, _requesterId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, code: true, managerId: true },
    });

    if (!project) {
      throw new BusinessException('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

    const monthlyData = await Promise.all(
      months.map(async (yearMonth) => {
        const entries = await this.prisma.timesheetEntry.findMany({
          where: {
            timesheet: { yearMonth },
            workLogs: { some: { projectId } },
          },
          include: {
            timesheet: { include: { member: { select: { id: true, name: true } } } },
            workLogs: { where: { projectId } },
          },
        });

        const memberSet = new Set<string>();
        let totalHours = 0;

        for (const entry of entries) {
          memberSet.add(entry.timesheet.memberId);
          totalHours += entry.workLogs.reduce((sum, wl) => sum + wl.hours, 0);
        }

        return {
          yearMonth,
          totalHours: Math.round(totalHours * 10) / 10,
          memberCount: memberSet.size,
        };
      }),
    );

    return { project, year, months: monthlyData };
  }

  /** 관리자: 전체 현황 — 팀별 제출/승인 현황 요약 */
  async getAdminOverview(yearMonth: string) {
    const teams = await this.prisma.team.findMany({
      where: { teamStatus: 'ACTIVE' },
      include: {
        teamMemberships: {
          include: {
            member: { select: { id: true, name: true } },
          },
        },
      },
    });

    const overview = await Promise.all(
      teams.map(async (team) => {
        const memberIds = team.teamMemberships.map((tm) => tm.member.id);
        const timesheets = await this.prisma.monthlyTimesheet.findMany({
          where: { teamId: team.id, yearMonth },
          include: { approvals: true },
        });

        const total = memberIds.length;
        const submitted = timesheets.filter(
          (ts) => ts.status === TimesheetStatus.SUBMITTED || ts.status === TimesheetStatus.APPROVED,
        ).length;
        const leaderApproved = timesheets.filter((ts) => {
          const la = ts.approvals.find((a) => a.approvalType === ApprovalType.LEADER);
          return la?.status === TimesheetStatus.APPROVED;
        }).length;
        const adminApproved = timesheets.filter((ts) => {
          const aa = ts.approvals.find((a) => a.approvalType === ApprovalType.ADMIN);
          return aa?.status === TimesheetStatus.APPROVED;
        }).length;

        return {
          teamId: team.id,
          teamName: team.name,
          totalMembers: total,
          notStarted: total - timesheets.length,
          draft: timesheets.filter((ts) => ts.status === TimesheetStatus.DRAFT).length,
          submitted,
          leaderApproved,
          adminApproved,
        };
      }),
    );

    const grandTotal = {
      totalMembers: overview.reduce((sum, t) => sum + t.totalMembers, 0),
      notStarted: overview.reduce((sum, t) => sum + t.notStarted, 0),
      draft: overview.reduce((sum, t) => sum + t.draft, 0),
      submitted: overview.reduce((sum, t) => sum + t.submitted, 0),
      leaderApproved: overview.reduce((sum, t) => sum + t.leaderApproved, 0),
      adminApproved: overview.reduce((sum, t) => sum + t.adminApproved, 0),
    };

    return { yearMonth, teams: overview, grandTotal };
  }

  /** M+5 자동승인: yearMonth 종료 후 5일 경과 시 미승인 시간표 자동 승인 */
  private async checkAndAutoApprove(projectId: string, yearMonth: string, approverId: string) {
    const [year, month] = yearMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0); // month의 마지막 날
    const autoApproveDate = new Date(lastDay);
    autoApproveDate.setDate(autoApproveDate.getDate() + 5);

    if (new Date() < autoApproveDate) return;

    // 미승인 시간표 조회
    const timesheets = await this.prisma.monthlyTimesheet.findMany({
      where: {
        yearMonth,
        entries: { some: { workLogs: { some: { projectId } } } },
      },
      include: {
        approvals: { where: { approvalType: ApprovalType.PROJECT_MANAGER } },
      },
    });

    for (const ts of timesheets) {
      if (ts.approvals.length === 0) {
        await this.prisma.timesheetApproval.create({
          data: {
            timesheetId: ts.id,
            approverId,
            approvalType: ApprovalType.PROJECT_MANAGER,
            status: TimesheetStatus.APPROVED,
            approvedAt: new Date(),
            autoApproved: true,
          },
        });
        this.logger.log(`M+5 자동승인: timesheetId=${ts.id}, projectId=${projectId}`);
      }
    }
  }
}
