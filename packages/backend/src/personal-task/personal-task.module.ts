import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PersonalTaskController } from './personal-task.controller';
import { PersonalTaskService } from './personal-task.service';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalTaskController],
  providers: [PersonalTaskService],
  exports: [PersonalTaskService],
})
export class PersonalTaskModule {}
