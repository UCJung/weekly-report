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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PersonalTaskService } from './personal-task.service';
import { CreatePersonalTaskDto } from './dto/create-personal-task.dto';
import { UpdatePersonalTaskDto } from './dto/update-personal-task.dto';
import { ListPersonalTasksQueryDto } from './dto/list-personal-tasks-query.dto';
import { ReorderPersonalTasksDto } from './dto/reorder-personal-tasks.dto';

@Controller('api/v1/personal-tasks')
@UseGuards(JwtAuthGuard)
export class PersonalTaskController {
  constructor(private personalTaskService: PersonalTaskService) {}

  /** GET /api/v1/personal-tasks — 개인 작업 목록 조회 */
  @Get()
  async findAll(
    @CurrentUser('id') memberId: string,
    @Query() query: ListPersonalTasksQueryDto,
  ) {
    return this.personalTaskService.findAll(memberId, query);
  }

  /** POST /api/v1/personal-tasks — 개인 작업 생성 */
  @Post()
  async create(
    @CurrentUser('id') memberId: string,
    @Body() dto: CreatePersonalTaskDto,
  ) {
    return this.personalTaskService.create(memberId, dto);
  }

  /** PATCH /api/v1/personal-tasks/reorder — DnD 정렬 (/:id 앞에 선언 필수) */
  @Patch('reorder')
  async reorder(
    @CurrentUser('id') memberId: string,
    @Body() dto: ReorderPersonalTasksDto,
  ) {
    return this.personalTaskService.reorder(memberId, dto);
  }

  /** PATCH /api/v1/personal-tasks/:id — 개인 작업 수정 */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
    @Body() dto: UpdatePersonalTaskDto,
  ) {
    return this.personalTaskService.update(id, memberId, dto);
  }

  /** DELETE /api/v1/personal-tasks/:id — 개인 작업 소프트 삭제 */
  @Delete(':id')
  async softDelete(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
  ) {
    return this.personalTaskService.softDelete(id, memberId);
  }

  /** PATCH /api/v1/personal-tasks/:id/toggle-done — 완료 상태 전환 */
  @Patch(':id/toggle-done')
  async toggleDone(
    @Param('id') id: string,
    @CurrentUser('id') memberId: string,
  ) {
    return this.personalTaskService.toggleDone(id, memberId);
  }
}
