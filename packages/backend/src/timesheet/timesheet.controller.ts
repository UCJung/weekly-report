import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TimesheetService } from './timesheet.service';
import { TimesheetEntryService } from './timesheet-entry.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { SaveEntryDto } from './dto/save-entry.dto';
import { BatchSaveEntriesDto } from './dto/batch-save-entries.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class TimesheetController {
  constructor(
    private timesheetService: TimesheetService,
    private timesheetEntryService: TimesheetEntryService,
  ) {}

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
