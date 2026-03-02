import {
  Controller,
  Get,
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
}
