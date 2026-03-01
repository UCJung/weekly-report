import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TeamService } from './team.service';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamController {
  constructor(
    private teamService: TeamService,
    private memberService: MemberService,
  ) {}

  @Get('teams/:teamId')
  async getTeam(@Param('teamId') teamId: string) {
    return this.teamService.findById(teamId);
  }

  @Get('teams/:teamId/parts')
  async getParts(@Param('teamId') teamId: string) {
    return this.teamService.findParts(teamId);
  }

  @Get('teams/:teamId/members')
  async getMembers(
    @Param('teamId') teamId: string,
    @Query('partId') partId?: string,
  ) {
    return this.memberService.findByTeam(teamId, partId);
  }

  @Post('members')
  @Roles(MemberRole.LEADER)
  async createMember(@Body() dto: CreateMemberDto) {
    return this.memberService.create(dto);
  }

  @Patch('members/:id')
  @Roles(MemberRole.LEADER)
  async updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.memberService.update(id, dto);
  }
}
