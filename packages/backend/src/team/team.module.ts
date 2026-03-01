import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { MemberService } from './member.service';

@Module({
  controllers: [TeamController],
  providers: [TeamService, MemberService],
  exports: [TeamService, MemberService],
})
export class TeamModule {}
