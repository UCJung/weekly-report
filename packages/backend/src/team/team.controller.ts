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
import { MemberRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TeamService } from './team.service';
import { MemberService } from './member.service';
import { TeamJoinService } from './team-join.service';
import { TeamProjectService } from './team-project.service';
import { TaskStatusService } from './task-status.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ReorderPartsDto } from './dto/reorder-parts.dto';
import { ReorderMembersDto } from './dto/reorder-members.dto';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { ReviewJoinRequestDto } from './dto/review-join-request.dto';
import { ListTeamsQueryDto } from './dto/list-teams-query.dto';
import { AddTeamProjectsDto } from './dto/add-team-projects.dto';
import { ReorderTeamProjectsDto } from './dto/reorder-team-projects.dto';
import { CreateTaskStatusDto } from './dto/create-task-status.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ReorderTaskStatusesDto } from './dto/reorder-task-statuses.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamController {
  constructor(
    private teamService: TeamService,
    private memberService: MemberService,
    private teamJoinService: TeamJoinService,
    private teamProjectService: TeamProjectService,
    private taskStatusService: TaskStatusService,
  ) {}

  // ── 팀 목록 (검색, 필터, 페이지네이션) ─────────────────────────────────────

  @Get('teams')
  async listTeams(
    @Query() query: ListTeamsQueryDto,
    @CurrentUser('id') memberId: string,
  ) {
    return this.teamJoinService.listTeams(query, memberId);
  }

  // ── 팀 상세 조회 ─────────────────────────────────────────────────────────

  @Get('teams/:teamId')
  async getTeam(@Param('teamId') teamId: string) {
    return this.teamService.findById(teamId);
  }

  // ── 팀 생성 신청 ─────────────────────────────────────────────────────────

  @Post('teams/request')
  async requestCreateTeam(
    @Body() dto: CreateTeamRequestDto,
    @CurrentUser('id') memberId: string,
  ) {
    return this.teamJoinService.requestCreateTeam(dto, memberId);
  }

  // ── 팀 파트 목록 ─────────────────────────────────────────────────────────

  @Get('teams/:teamId/parts')
  async getParts(@Param('teamId') teamId: string) {
    return this.teamService.findParts(teamId);
  }

  @Patch('teams/:teamId/parts/reorder')
  @Roles(MemberRole.LEADER)
  async reorderParts(@Param('teamId') teamId: string, @Body() dto: ReorderPartsDto) {
    return this.teamService.reorderParts(teamId, dto);
  }

  // ── 팀원 목록 + 정렬 ─────────────────────────────────────────────────────

  @Patch('teams/:teamId/members/reorder')
  @Roles(MemberRole.LEADER)
  async reorderMembers(@Param('teamId') teamId: string, @Body() dto: ReorderMembersDto) {
    return this.memberService.reorder(teamId, dto.orderedIds);
  }

  @Get('teams/:teamId/members')
  async getMembers(
    @Param('teamId') teamId: string,
    @Query('partId') partId?: string,
  ) {
    return this.memberService.findByTeam(teamId, partId);
  }

  // ── 멤버 가입 신청 ────────────────────────────────────────────────────────

  @Post('teams/:teamId/join')
  async joinTeam(
    @Param('teamId') teamId: string,
    @Body() _dto: JoinTeamDto,
    @CurrentUser('id') memberId: string,
  ) {
    return this.teamJoinService.requestJoinTeam(teamId, memberId);
  }

  // ── 멤버 신청 목록 (팀장/파트장 전용) ─────────────────────────────────────

  @Get('teams/:teamId/join-requests')
  async listJoinRequests(
    @Param('teamId') teamId: string,
    @CurrentUser('id') memberId: string,
  ) {
    return this.teamJoinService.listJoinRequests(teamId, memberId);
  }

  // ── 멤버 신청 승인/거절 (팀장/파트장 전용) ────────────────────────────────

  @Patch('teams/:teamId/join-requests/:id')
  async reviewJoinRequest(
    @Param('teamId') teamId: string,
    @Param('id') requestId: string,
    @Body() dto: ReviewJoinRequestDto,
    @CurrentUser('id') memberId: string,
  ) {
    return this.teamJoinService.reviewJoinRequest(teamId, requestId, dto, memberId);
  }

  // ── 팀원 관리 (CRUD) ─────────────────────────────────────────────────────

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

  // ── 내 소속 팀 목록 ───────────────────────────────────────────────────────

  @Get('my/teams')
  async getMyTeams(@CurrentUser('id') memberId: string) {
    return this.teamJoinService.getMyTeams(memberId);
  }

  // ── 팀 프로젝트 관리 ─────────────────────────────────────────────────────

  @Get('teams/:teamId/projects')
  async getTeamProjects(@Param('teamId') teamId: string) {
    return this.teamProjectService.findTeamProjects(teamId);
  }

  @Post('teams/:teamId/projects')
  @Roles(MemberRole.LEADER)
  async addTeamProjects(
    @Param('teamId') teamId: string,
    @Body() dto: AddTeamProjectsDto,
  ) {
    return this.teamProjectService.addTeamProjects(teamId, dto);
  }

  @Delete('teams/:teamId/projects/:projectId')
  @Roles(MemberRole.LEADER)
  async removeTeamProject(
    @Param('teamId') teamId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.teamProjectService.removeTeamProject(teamId, projectId);
  }

  @Patch('teams/:teamId/projects/reorder')
  @Roles(MemberRole.LEADER)
  async reorderTeamProjects(
    @Param('teamId') teamId: string,
    @Body() dto: ReorderTeamProjectsDto,
  ) {
    return this.teamProjectService.reorderTeamProjects(teamId, dto);
  }

  // ── 팀 작업 상태 정의 관리 ────────────────────────────────────────────────

  @Get('teams/:teamId/task-statuses')
  async getTaskStatuses(@Param('teamId') teamId: string) {
    return this.taskStatusService.getByTeam(teamId);
  }

  @Post('teams/:teamId/task-statuses')
  @Roles(MemberRole.LEADER)
  async createTaskStatus(
    @Param('teamId') teamId: string,
    @Body() dto: CreateTaskStatusDto,
  ) {
    return this.taskStatusService.create(teamId, dto);
  }

  @Patch('teams/:teamId/task-statuses/reorder')
  @Roles(MemberRole.LEADER)
  async reorderTaskStatuses(
    @Param('teamId') teamId: string,
    @Body() dto: ReorderTaskStatusesDto,
  ) {
    return this.taskStatusService.reorder(teamId, dto);
  }

  @Patch('teams/:teamId/task-statuses/:id')
  @Roles(MemberRole.LEADER)
  async updateTaskStatus(
    @Param('teamId') teamId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.taskStatusService.update(teamId, id, dto);
  }

  @Delete('teams/:teamId/task-statuses/:id')
  @Roles(MemberRole.LEADER)
  async deleteTaskStatus(
    @Param('teamId') teamId: string,
    @Param('id') id: string,
  ) {
    return this.taskStatusService.delete(teamId, id);
  }
}
