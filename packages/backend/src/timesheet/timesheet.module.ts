import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TimesheetController } from './timesheet.controller';
import { TimesheetService } from './timesheet.service';
import { TimesheetEntryService } from './timesheet-entry.service';
import { TimesheetApprovalService } from './timesheet-approval.service';
import { TimesheetStatsService } from './timesheet-stats.service';
import { TimesheetExportService } from './timesheet-export.service';

@Module({
  imports: [PrismaModule],
  controllers: [TimesheetController],
  providers: [
    TimesheetService,
    TimesheetEntryService,
    TimesheetApprovalService,
    TimesheetStatsService,
    TimesheetExportService,
  ],
  exports: [TimesheetService],
})
export class TimesheetModule {}
