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
import { AdminService } from './admin.service';
import { ListAccountsDto } from './dto/list-accounts.dto';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { ListTeamsDto } from './dto/list-teams.dto';
import { UpdateTeamStatusDto } from './dto/update-team-status.dto';
import { CreateGlobalProjectDto } from './dto/create-global-project.dto';
import { UpdateGlobalProjectDto } from './dto/update-global-project.dto';
import { ListGlobalProjectsDto } from './dto/list-global-projects.dto';
import { ApproveProjectDto } from './dto/approve-project.dto';
import { UpdateAccountInfoDto } from './dto/update-account-info.dto';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ──────────────────────────────────────
  // 계정 관리
  // ──────────────────────────────────────

  @Get('accounts')
  async listAccounts(@Query() dto: ListAccountsDto) {
    return this.adminService.listAccounts(dto);
  }

  @Patch('accounts/:id/status')
  async updateAccountStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.adminService.updateAccountStatus(id, dto);
  }

  @Patch('accounts/:id/info')
  async updateAccountInfo(
    @Param('id') id: string,
    @Body() dto: UpdateAccountInfoDto,
  ) {
    return this.adminService.updateAccountInfo(id, dto);
  }

  @Patch('accounts/:id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.adminService.resetPassword(id);
  }

  // ──────────────────────────────────────
  // 팀 관리
  // ──────────────────────────────────────

  @Get('teams')
  async listTeams(@Query() dto: ListTeamsDto) {
    return this.adminService.listTeams(dto);
  }

  @Patch('teams/:id/status')
  async updateTeamStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTeamStatusDto,
  ) {
    return this.adminService.updateTeamStatus(id, dto);
  }

  // ──────────────────────────────────────
  // 전역 프로젝트 관리
  // ──────────────────────────────────────

  @Get('projects')
  async listProjects(@Query() dto: ListGlobalProjectsDto) {
    return this.adminService.listProjects(dto);
  }

  @Post('projects')
  async createProject(@Body() dto: CreateGlobalProjectDto) {
    return this.adminService.createProject(dto);
  }

  @Patch('projects/:id')
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateGlobalProjectDto,
  ) {
    return this.adminService.updateProject(id, dto);
  }

  @Patch('projects/:id/approve')
  async approveProject(
    @Param('id') id: string,
    @Body() dto: ApproveProjectDto,
  ) {
    return this.adminService.approveProject(id, dto);
  }
}
