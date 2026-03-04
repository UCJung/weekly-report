import { Injectable, Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/filters/business-exception';
import { ApprovalType, AttendanceType, ProjectStatus, TeamStatus, TimesheetStatus } from '@prisma/client';
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
          select: { id: true, name: true, position: true, jobTitle: true },
        },
        part: {
          select: { id: true, name: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // B-1: N+1 해소 — 모든 팀원의 시간표를 한 번에 조회 후 Map으로 매핑
    const memberIds = memberships.map((m) => m.member.id);
    const timesheets = await this.prisma.monthlyTimesheet.findMany({
      where: { memberId: { in: memberIds }, teamId, yearMonth },
      include: {
        entries: {
          select: {
            attendance: true,
            workLogs: { select: { hours: true } },
          },
        },
        approvals: {
          include: { approver: { select: { id: true, name: true } } },
        },
      },
    });

    const timesheetMap = new Map(timesheets.map((ts) => [ts.memberId, ts]));

    const results = memberships.map((membership) => {
      const member = membership.member;
      const timesheet = timesheetMap.get(member.id) ?? null;

      const base = {
          memberId: member.id,
          memberName: member.name,
          position: member.position,
          jobTitle: member.jobTitle,
          partId: membership.part?.id ?? null,
          partName: membership.part?.name ?? null,
        };

        if (!timesheet) {
          return {
            ...base,
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
          ...base,
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
      });

    return results;
  }

  /** 팀원×프로젝트 투입 매트릭스: 팀원별 프로젝트별 투입시간/비율 */
  async getTeamSummary(teamId: string, yearMonth: string) {
    // 해당 팀+월 모든 시간표 조회
    const timesheets = await this.prisma.monthlyTimesheet.findMany({
      where: { teamId, yearMonth },
      include: {
        member: { select: { id: true, name: true, position: true, jobTitle: true } },
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

    // 팀원별 파트 정보 조회
    const memberIds = timesheets.map((ts) => ts.member.id);
    const memberships = await this.prisma.teamMembership.findMany({
      where: { teamId, memberId: { in: memberIds } },
      include: { part: { select: { id: true, name: true } } },
    });
    const memberPartMap = new Map<string, { partId: string | null; partName: string | null }>();
    for (const ms of memberships) {
      memberPartMap.set(ms.memberId, {
        partId: ms.part?.id ?? null,
        partName: ms.part?.name ?? null,
      });
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

      const partInfo = memberPartMap.get(ts.member.id);

      return {
        memberId: ts.member.id,
        memberName: ts.member.name,
        position: ts.member.position,
        jobTitle: ts.member.jobTitle ?? null,
        partId: partInfo?.partId ?? null,
        partName: partInfo?.partName ?? null,
        timesheetId: ts.id,
        status: ts.status,
        totalHours: Math.round(totalHours * 10) / 10,
        projectBreakdown,
      };
    });

    return { projects, matrix };
  }

  /** PM: 월간 투입현황 — 해당 프로젝트에 투입된 인원/시간/비율 */
  async getProjectAllocationMonthly(projectId: string, yearMonth: string, _requesterId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, code: true, managerId: true },
    });

    if (!project) {
      throw new BusinessException('PROJECT_NOT_FOUND', '프로젝트를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

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

    // B-2: N+1 해소 — 모든 멤버의 시간표를 한 번에 조회 후 Map으로 비율 계산
    const memberIdList = members.map((m) => m.memberId);
    const memberTimesheets = await this.prisma.monthlyTimesheet.findMany({
      where: { memberId: { in: memberIdList }, yearMonth },
      include: { entries: { include: { workLogs: true } } },
    });
    const memberTimesheetMap = new Map(memberTimesheets.map((ts) => [ts.memberId, ts]));

    const membersWithRatio = members.map((m) => {
      const ts = memberTimesheetMap.get(m.memberId) ?? null;
      const memberTotalHours = ts
        ? ts.entries.reduce((sum, e) => sum + e.workLogs.reduce((s, wl) => s + wl.hours, 0), 0)
        : 0;

      const ratio = memberTotalHours > 0 ? Math.round((m.totalHours / memberTotalHours) * 1000) / 10 : 0;

      return { ...m, memberTotalHours: Math.round(memberTotalHours * 10) / 10, ratio };
    });

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

    // B-6: 연간 데이터 한 번에 조회 후 메모리에서 월별 집계
    const allEntries = await this.prisma.timesheetEntry.findMany({
      where: {
        timesheet: { yearMonth: { startsWith: year } },
        workLogs: { some: { projectId } },
      },
      include: {
        timesheet: { select: { memberId: true, yearMonth: true } },
        workLogs: { where: { projectId } },
      },
    });

    // 월별 버킷 초기화
    const monthlyMap = new Map<string, { memberSet: Set<string>; totalHours: number }>();
    for (let i = 1; i <= 12; i++) {
      const ym = `${year}-${String(i).padStart(2, '0')}`;
      monthlyMap.set(ym, { memberSet: new Set(), totalHours: 0 });
    }

    for (const entry of allEntries) {
      const ym = entry.timesheet.yearMonth;
      const bucket = monthlyMap.get(ym);
      if (!bucket) continue;
      bucket.memberSet.add(entry.timesheet.memberId);
      for (const wl of entry.workLogs) {
        bucket.totalHours += wl.hours;
      }
    }

    const monthlyData = Array.from(monthlyMap.entries()).map(([yearMonth, data]) => ({
      yearMonth,
      totalHours: Math.round(data.totalHours * 10) / 10,
      memberCount: data.memberSet.size,
    }));

    return { project, year, months: monthlyData };
  }

  /** 관리 프로젝트 전체의 월간 투입 요약 (프로젝트 목록 테이블용) */
  async getProjectAllocationSummary(memberId: string, yearMonth: string) {
    // 해당 멤버가 매니저인 활성 프로젝트 조회
    const projects = await this.prisma.project.findMany({
      where: { managerId: memberId, status: ProjectStatus.ACTIVE },
      select: { id: true, name: true, code: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const projectIds = projects.map((p) => p.id);

    // B-5: 이중 N+1 해소 — 모든 프로젝트 관련 데이터를 한 번에 일괄 조회
    const allEntries = await this.prisma.timesheetEntry.findMany({
      where: {
        timesheet: { yearMonth },
        workLogs: { some: { projectId: { in: projectIds } } },
      },
      include: {
        timesheet: { select: { memberId: true, id: true } },
        workLogs: {
          where: { projectId: { in: projectIds } },
          select: { projectId: true, hours: true },
        },
      },
    });

    // 모든 관련 timesheetId 수집 및 PM 승인 일괄 조회
    const allTimesheetIds = [...new Set(allEntries.map((e) => e.timesheetId))];
    const pmApprovals =
      allTimesheetIds.length > 0
        ? await this.prisma.timesheetApproval.findMany({
            where: {
              timesheetId: { in: allTimesheetIds },
              approvalType: ApprovalType.PROJECT_MANAGER,
              approverId: memberId,
            },
            select: { timesheetId: true },
          })
        : [];
    const approvedTimesheetIds = new Set(pmApprovals.map((a) => a.timesheetId));

    // 프로젝트별로 메모리에서 집계
    const summaries = projects.map((project) => {
      const memberSet = new Set<string>();
      const projectTimesheetIds = new Set<string>();
      let totalHours = 0;

      for (const entry of allEntries) {
        const projectWls = entry.workLogs.filter((wl) => wl.projectId === project.id);
        if (projectWls.length === 0) continue;

        memberSet.add(entry.timesheet.memberId);
        projectTimesheetIds.add(entry.timesheetId);
        for (const wl of projectWls) {
          totalHours += wl.hours;
        }
      }

      const memberCount = memberSet.size;
      const roundedHours = Math.round(totalHours * 10) / 10;
      const avgHours = memberCount > 0 ? Math.round((roundedHours / memberCount) * 10) / 10 : 0;

      // 해당 프로젝트 timesheetId 중 PM 승인된 것이 있으면 APPROVED
      let pmApprovalStatus = 'NOT_APPROVED';
      if (projectTimesheetIds.size > 0) {
        const hasApproval = [...projectTimesheetIds].some((tsId) => approvedTimesheetIds.has(tsId));
        if (hasApproval) {
          pmApprovalStatus = TimesheetStatus.APPROVED;
        }
      }

      return {
        projectId: project.id,
        projectName: project.name,
        projectCode: project.code,
        memberCount,
        totalHours: roundedHours,
        avgHours,
        pmApprovalStatus,
      };
    });

    return { yearMonth, projects: summaries };
  }

  /** 관리자: 전체 현황 — 팀별 제출/승인 현황 요약 */
  async getAdminOverview(yearMonth: string) {
    // ISSUE-11: 독립 쿼리 4개를 Promise.all로 병렬 실행
    const [teams, allTimesheets, activeProjects, projectsWithEntries] = await Promise.all([
      this.prisma.team.findMany({
        where: { teamStatus: TeamStatus.ACTIVE },
        include: {
          teamMemberships: {
            include: {
              member: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.monthlyTimesheet.findMany({
        where: { yearMonth },
        include: { approvals: true },
      }),
      this.prisma.project.findMany({
        where: { status: ProjectStatus.ACTIVE, managerId: { not: null } },
        select: { id: true, managerId: true },
      }),
      this.prisma.timesheetWorkLog.findMany({
        where: {
          entry: { timesheet: { yearMonth } },
        },
        select: { projectId: true },
        distinct: ['projectId'],
      }),
    ]);

    const timesheetsByTeam = new Map<string, typeof allTimesheets>();
    for (const ts of allTimesheets) {
      const list = timesheetsByTeam.get(ts.teamId) ?? [];
      list.push(ts);
      timesheetsByTeam.set(ts.teamId, list);
    }

    const overview = teams.map((team) => {
      const memberIds = team.teamMemberships.map((tm) => tm.member.id);
      const timesheets = timesheetsByTeam.get(team.id) ?? [];

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
    });

    const grandTotal = {
      totalMembers: overview.reduce((sum, t) => sum + t.totalMembers, 0),
      notStarted: overview.reduce((sum, t) => sum + t.notStarted, 0),
      draft: overview.reduce((sum, t) => sum + t.draft, 0),
      submitted: overview.reduce((sum, t) => sum + t.submitted, 0),
      leaderApproved: overview.reduce((sum, t) => sum + t.leaderApproved, 0),
      adminApproved: overview.reduce((sum, t) => sum + t.adminApproved, 0),
    };

    // 프로젝트 승인 현황: 해당 월에 투입 기록이 있는 활성 프로젝트 + PM 승인 여부
    // (activeProjects, projectsWithEntries는 Promise.all에서 이미 조회됨)
    const projectIdsWithEntries = new Set(projectsWithEntries.map((w) => w.projectId));
    const relevantProjects = activeProjects.filter((p) => projectIdsWithEntries.has(p.id));

    // B-4: PM 승인 현황도 일괄 조회 + pmApprovals / timesheetWorkLogs 병렬 실행
    let approvedProjects = 0;
    if (relevantProjects.length > 0 && allTimesheets.length > 0) {
      const allTimesheetIds = allTimesheets.map((ts) => ts.id);

      const [pmApprovals, timesheetWorkLogs] = await Promise.all([
        this.prisma.timesheetApproval.findMany({
          where: {
            approvalType: ApprovalType.PROJECT_MANAGER,
            timesheetId: { in: allTimesheetIds },
          },
          select: { approverId: true, timesheetId: true },
        }),
        // (timesheetId, projectId) 매핑을 위한 워크로그 조회
        this.prisma.timesheetWorkLog.findMany({
          where: {
            entry: { timesheet: { yearMonth } },
            projectId: { in: relevantProjects.map((p) => p.id) },
          },
          select: { projectId: true, entry: { select: { timesheetId: true } } },
        }),
      ]);

      // (timesheetId, projectId) 집합
      const timesheetProjectSet = new Set<string>();
      for (const wl of timesheetWorkLogs) {
        timesheetProjectSet.add(`${wl.entry.timesheetId}:${wl.projectId}`);
      }

      // 프로젝트별로 해당 PM의 승인이 있고 시간표에 그 프로젝트 워크로그가 있는지 확인
      const approvedProjectIds = new Set<string>();
      for (const approval of pmApprovals) {
        const project = relevantProjects.find((p) => p.managerId === approval.approverId);
        if (!project) continue;
        if (timesheetProjectSet.has(`${approval.timesheetId}:${project.id}`)) {
          approvedProjectIds.add(project.id);
        }
      }
      approvedProjects = approvedProjectIds.size;
    }

    return {
      yearMonth,
      teams: overview,
      grandTotal,
      totalProjects: relevantProjects.length,
      approvedProjects,
    };
  }

  /** M+5 자동승인 트리거: GET 부수효과 없이 명시적 POST 호출 전용 */
  async triggerAutoApprove(projectId: string, yearMonth: string, approverId: string) {
    return this.checkAndAutoApprove(projectId, yearMonth, approverId);
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

    const toApprove = timesheets.filter((ts) => ts.approvals.length === 0);
    if (toApprove.length > 0) {
      const now = new Date();
      await this.prisma.timesheetApproval.createMany({
        data: toApprove.map((ts) => ({
          timesheetId: ts.id,
          approverId,
          approvalType: ApprovalType.PROJECT_MANAGER,
          status: TimesheetStatus.APPROVED,
          approvedAt: now,
          autoApproved: true,
        })),
        skipDuplicates: true,
      });
      this.logger.log(`M+5 자동승인: ${toApprove.length}건, projectId=${projectId}, yearMonth=${yearMonth}`);
    }
  }
}
