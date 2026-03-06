import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportService } from './report.service';
import { WorkItemService } from './work-item.service';
import { CarryForwardService } from './carry-forward.service';
import { CreateWeeklyReportDto } from './dto/create-weekly-report.dto';
import { UpdateWeeklyReportDto } from './dto/update-weekly-report.dto';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { ReorderWorkItemsDto } from './dto/reorder-work-items.dto';
import { ApplyTasksDto } from './dto/apply-tasks.dto';
import { CarryForwardDto } from './dto/carry-forward.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(
    private reportService: ReportService,
    private workItemService: WorkItemService,
    private carryForwardService: CarryForwardService,
  ) {}

  // --- WeeklyReport ---

  @Get('weekly-reports/me')
  async getMyReport(
    @CurrentUser('id') memberId: string,
    @Query('week') week: string,
  ) {
    return this.reportService.findMyReport(memberId, week);
  }

  @Post('weekly-reports')
  async create(
    @CurrentUser('id') memberId: string,
    @Body() dto: CreateWeeklyReportDto,
  ) {
    return this.reportService.create(memberId, dto);
  }

  @Patch('weekly-reports/:id')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
    @Body() dto: UpdateWeeklyReportDto,
  ) {
    return this.reportService.updateStatus(id, memberId, dto);
  }

  @Post('weekly-reports/carry-forward')
  async carryForward(
    @CurrentUser('id') memberId: string,
    @Body() dto: CarryForwardDto,
  ) {
    return this.carryForwardService.carryForward(memberId, dto);
  }

  // --- WorkItem ---

  @Get('weekly-reports/:id/work-items')
  async getWorkItems(@Param('id') id: string) {
    return this.workItemService.findByReportId(id);
  }

  @Post('weekly-reports/:id/work-items')
  async addWorkItem(
    @Param('id') weeklyReportId: string,
    @CurrentUser('id') memberId: string,
    @Body() dto: CreateWorkItemDto,
  ) {
    return this.workItemService.create(weeklyReportId, memberId, dto);
  }

  @Patch('work-items/reorder')
  async reorderWorkItems(
    @CurrentUser('id') memberId: string,
    @Body() dto: ReorderWorkItemsDto,
  ) {
    return this.workItemService.reorder(memberId, dto);
  }

  @Patch('work-items/:id')
  async updateWorkItem(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
    @Body() dto: UpdateWorkItemDto,
  ) {
    return this.workItemService.update(id, memberId, dto);
  }

  @Delete('work-items/:id')
  async deleteWorkItem(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
  ) {
    return this.workItemService.delete(id, memberId);
  }

  @Delete('weekly-reports/:reportId/work-items')
  async deleteWorkItemsByProject(
    @Param('reportId') reportId: string,
    @Query('projectId') projectId: string,
    @CurrentUser('id') memberId: string,
  ) {
    return this.workItemService.deleteByProject(reportId, projectId, memberId);
  }

  @Get('work-items/:id/linked-tasks')
  async getLinkedTasks(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
  ) {
    return this.workItemService.getLinkedTasks(id, memberId);
  }

  @Post('work-items/:id/apply-tasks')
  async applyTasksToWorkItem(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
    @Body() dto: ApplyTasksDto,
  ) {
    return this.workItemService.applyTasksToWorkItem(id, memberId, dto);
  }
}
