import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { MemberRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TimesheetService } from './timesheet.service';
import { TimesheetEntryService } from './timesheet-entry.service';
import { TimesheetApprovalService } from './timesheet-approval.service';
import { TimesheetStatsService } from './timesheet-stats.service';
import { TimesheetExportService } from './timesheet-export.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { SaveEntryDto } from './dto/save-entry.dto';
import { BatchSaveEntriesDto } from './dto/batch-save-entries.dto';
import { RejectTimesheetDto } from './dto/reject-timesheet.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class TimesheetController {
  constructor(
    private timesheetService: TimesheetService,
    private timesheetEntryService: TimesheetEntryService,
    private timesheetApprovalService: TimesheetApprovalService,
    private timesheetStatsService: TimesheetStatsService,
    private timesheetExportService: TimesheetExportService,
  ) {}

  // ──────────── 기본 CRUD ────────────

  /** POST /api/v1/timesheets — 월별 근무시간표 생성 */
  @Post('timesheets')
  async create(
    @CurrentUser('id') memberId: string,
    @Body() dto: CreateTimesheetDto,
  ) {
    return this.timesheetService.create(memberId, dto);
  }

  /** GET /api/v1/timesheets/me?yearMonth=&teamId= — 내 시간표 조회 */
  @Get('timesheets/me')
  async getMyTimesheet(
    @CurrentUser('id') memberId: string,
    @Query('yearMonth') yearMonth: string,
    @Query('teamId') teamId: string,
  ) {
    return this.timesheetService.getMyTimesheet(memberId, yearMonth, teamId);
  }

  // ──────────── 팀장 API ────────────

  /** GET /api/v1/timesheets/team-members-status?teamId=&yearMonth= — 팀원 제출현황 */
  @Get('timesheets/team-members-status')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.LEADER, MemberRole.PART_LEADER, MemberRole.ADMIN)
  async getTeamMembersStatus(
    @Query('teamId') teamId: string,
    @Query('yearMonth') yearMonth: string,
  ) {
    return this.timesheetStatsService.getTeamMembersStatus(teamId, yearMonth);
  }

  /** GET /api/v1/timesheets/team-summary?teamId=&yearMonth= — 팀원×프로젝트 투입 매트릭스 */
  @Get('timesheets/team-summary')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.LEADER, MemberRole.ADMIN)
  async getTeamSummary(
    @Query('teamId') teamId: string,
    @Query('yearMonth') yearMonth: string,
  ) {
    return this.timesheetStatsService.getTeamSummary(teamId, yearMonth);
  }

  // ──────────── PM API ────────────

  /** GET /api/v1/timesheets/project-allocation/monthly?projectId=&yearMonth= — 월간 투입현황 */
  @Get('timesheets/project-allocation/summary')
  async getProjectAllocationSummary(
    @CurrentUser('id') memberId: string,
    @Query('yearMonth') yearMonth: string,
  ) {
    return this.timesheetStatsService.getProjectAllocationSummary(memberId, yearMonth);
  }

  @Get('timesheets/project-allocation/monthly')
  async getProjectAllocationMonthly(
    @CurrentUser('id') memberId: string,
    @Query('projectId') projectId: string,
    @Query('yearMonth') yearMonth: string,
  ) {
    return this.timesheetStatsService.getProjectAllocationMonthly(projectId, yearMonth, memberId);
  }

  /** GET /api/v1/timesheets/project-allocation/yearly?projectId=&year= — 연간 투입현황 */
  @Get('timesheets/project-allocation/yearly')
  async getProjectAllocationYearly(
    @CurrentUser('id') memberId: string,
    @Query('projectId') projectId: string,
    @Query('year') year: string,
  ) {
    return this.timesheetStatsService.getProjectAllocationYearly(projectId, year, memberId);
  }

  // ──────────── 관리자 API ────────────

  /** GET /api/v1/timesheets/admin-overview?yearMonth= — 전체 현황 */
  @Get('timesheets/admin-overview')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  async getAdminOverview(@Query('yearMonth') yearMonth: string) {
    return this.timesheetStatsService.getAdminOverview(yearMonth);
  }

  /** GET /api/v1/timesheets/admin-export?yearMonth= — 엑셀 다운로드 */
  @Get('timesheets/admin-export')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  async adminExport(@Query('yearMonth') yearMonth: string, @Res() res: Response) {
    const { buffer, filename } = await this.timesheetExportService.generateMonthlyExcel(yearMonth);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.end(buffer);
  }

  // ──────────── 승인/반려 (id 파라미터 — 마지막에 위치) ────────────

  /** GET /api/v1/timesheets/:id — 시간표 상세 조회 */
  @Get('timesheets/:id')
  async getById(@Param('id') id: string) {
    return this.timesheetService.getById(id);
  }

  /** PATCH /api/v1/timesheets/:id/submit — 제출 (검증 포함) */
  @Patch('timesheets/:id/submit')
  async submit(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
  ) {
    return this.timesheetService.submit(id, memberId);
  }

  /** POST /api/v1/timesheets/:id/approve — 팀장 승인 */
  @Post('timesheets/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.LEADER, MemberRole.ADMIN)
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
  ) {
    return this.timesheetApprovalService.leaderApprove(id, memberId);
  }

  @Post('timesheets/batch-approve')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.LEADER, MemberRole.ADMIN)
  async batchApprove(
    @Body('timesheetIds') timesheetIds: string[],
    @CurrentUser('id') memberId: string,
  ) {
    return this.timesheetApprovalService.batchLeaderApprove(timesheetIds, memberId);
  }

  /** POST /api/v1/timesheets/:id/reject — 팀장 반려 */
  @Post('timesheets/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.LEADER, MemberRole.ADMIN)
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
    @Body() dto: RejectTimesheetDto,
  ) {
    return this.timesheetApprovalService.leaderReject(id, memberId, dto.comment);
  }

  /** POST /api/v1/timesheets/auto-approve — M+5 자동승인 트리거 (GET 부수효과 제거 후 명시적 호출) */
  @Post('timesheets/auto-approve')
  async triggerAutoApprove(
    @CurrentUser('id') memberId: string,
    @Body('projectId') projectId: string,
    @Body('yearMonth') yearMonth: string,
  ) {
    return this.timesheetStatsService.triggerAutoApprove(projectId, yearMonth, memberId);
  }

  /** POST /api/v1/timesheets/project-approve?projectId=&yearMonth= — PM 월간 승인 */
  @Post('timesheets/project-approve')
  async projectApprove(
    @CurrentUser('id') memberId: string,
    @Query('projectId') projectId: string,
    @Query('yearMonth') yearMonth: string,
  ) {
    return this.timesheetApprovalService.projectApprove(projectId, yearMonth, memberId);
  }

  /** POST /api/v1/timesheets/admin-approve?yearMonth= — 최종 승인 */
  @Post('timesheets/admin-approve')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.ADMIN)
  async adminApprove(
    @CurrentUser('id') memberId: string,
    @Query('yearMonth') yearMonth: string,
  ) {
    return this.timesheetApprovalService.adminApprove(yearMonth, memberId);
  }

  // ──────────── 엔트리 API ────────────

  /** PUT /api/v1/timesheet-entries/:id — 일별 엔트리 저장 */
  @Put('timesheet-entries/:id')
  async saveEntry(
    @Param('id') entryId: string,
    @CurrentUser('id') memberId: string,
    @Body() dto: SaveEntryDto,
  ) {
    return this.timesheetEntryService.saveEntry(entryId, memberId, dto);
  }

  /** POST /api/v1/timesheet-entries/batch — 배치 저장 (자동저장) */
  @Post('timesheet-entries/batch')
  async batchSave(
    @CurrentUser('id') memberId: string,
    @Body() dto: BatchSaveEntriesDto,
  ) {
    return this.timesheetEntryService.batchSave(memberId, dto);
  }
}
