import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeamModule } from './team/team.module';
import { ProjectModule } from './project/project.module';
import { WeeklyReportModule } from './weekly-report/weekly-report.module';
import { ExportModule } from './export/export.module';
import { AdminModule } from './admin/admin.module';
import { TimesheetModule } from './timesheet/timesheet.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    TeamModule,
    ProjectModule,
    WeeklyReportModule,
    ExportModule,
    AdminModule,
    TimesheetModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
