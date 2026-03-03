import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProjectService } from './project.service';
import { ProjectQueryDto } from './dto/project-query.dto';
import { RequestProjectDto } from './dto/request-project.dto';

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  async findAll(@Query() query: ProjectQueryDto) {
    return this.projectService.findAll(query);
  }

  // GET /api/v1/projects/managed — 내 책임 프로젝트 목록
  @Get('managed')
  async findManaged(
    @CurrentUser('id') memberId: string,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectService.findManagedProjects(memberId, status);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.projectService.findById(id);
  }

  // POST /api/v1/projects/request — 프로젝트 생성 요청 (LEADER/PART_LEADER)
  @Post('request')
  async requestProject(
    @Body() dto: RequestProjectDto,
    @CurrentUser('id') memberId: string,
  ) {
    await this.projectService.validateLeaderOrPartLeader(memberId);
    return this.projectService.requestProject(dto, memberId);
  }
}
