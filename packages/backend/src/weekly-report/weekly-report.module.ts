import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { WorkItemService } from './work-item.service';
import { CarryForwardService } from './carry-forward.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportController],
  providers: [ReportService, WorkItemService, CarryForwardService],
  exports: [ReportService, WorkItemService],
})
export class WeeklyReportModule {}
