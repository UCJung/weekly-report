import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { MemberService } from './member.service';
import { TeamJoinService } from './team-join.service';
import { TeamProjectService } from './team-project.service';
import { TaskStatusService } from './task-status.service';

@Module({
  controllers: [TeamController],
  providers: [TeamService, MemberService, TeamJoinService, TeamProjectService, TaskStatusService],
  exports: [TeamService, MemberService, TeamJoinService, TeamProjectService, TaskStatusService],
})
export class TeamModule {}
