import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TimesheetController } from './timesheet.controller';
import { TimesheetService } from './timesheet.service';
import { TimesheetEntryService } from './timesheet-entry.service';

@Module({
  imports: [PrismaModule],
  controllers: [TimesheetController],
  providers: [TimesheetService, TimesheetEntryService],
  exports: [TimesheetService],
})
export class TimesheetModule {}
