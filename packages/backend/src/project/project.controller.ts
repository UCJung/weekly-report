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
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  async findAll(@Query() query: ProjectQueryDto) {
    return this.projectService.findAll(query);
  }

  @Patch('reorder')
  @Roles(MemberRole.LEADER)
  async reorder(@Body() dto: ReorderProjectsDto) {
    return this.projectService.reorder(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.projectService.findById(id);
  }

  @Post()
  @Roles(MemberRole.LEADER)
  async create(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @Patch(':id')
  @Roles(MemberRole.LEADER)
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(id, dto);
  }

  @Delete(':id')
  @Roles(MemberRole.LEADER)
  async delete(@Param('id') id: string) {
    return this.projectService.softDelete(id);
  }
}
