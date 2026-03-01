import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ProjectService } from './project.service';
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../common/filters/business-exception';

const mockPrisma = {
  project: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    count: mock(() => Promise.resolve(0)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
  },
  workItem: {
    count: mock(() => Promise.resolve(0)),
  },
};

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    service = new ProjectService(mockPrisma as never);
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const projects = [
        { id: '1', name: '팀공통', code: '공통2500-팀', category: 'COMMON' },
      ];
      mockPrisma.project.findMany.mockResolvedValueOnce(projects as never);
      mockPrisma.project.count.mockResolvedValueOnce(1);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by category', async () => {
      mockPrisma.project.findMany.mockResolvedValueOnce([]);
      mockPrisma.project.count.mockResolvedValueOnce(0);

      await service.findAll({ category: 'COMMON' as never });
      expect(mockPrisma.project.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should throw if project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce(null);

      try {
        await service.findById('nonexistent');
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should return project', async () => {
      const project = { id: '1', name: '테스트', code: 'TEST' };
      mockPrisma.project.findUnique.mockResolvedValueOnce(project as never);

      const result = await service.findById('1');
      expect(result.name).toBe('테스트');
    });
  });

  describe('create', () => {
    it('should throw on duplicate code in same team', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({ id: '1' } as never);

      try {
        await service.create({
          name: '중복',
          code: 'DUP',
          category: 'COMMON' as never,
          teamId: 'team-1',
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('PROJECT_CODE_DUPLICATE');
      }
    });

    it('should create project', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce(null);
      mockPrisma.project.create.mockResolvedValueOnce({
        id: '1',
        name: '새과제',
        code: 'NEW01',
        category: 'EXECUTION',
      } as never);

      const result = await service.create({
        name: '새과제',
        code: 'NEW01',
        category: 'EXECUTION' as never,
        teamId: 'team-1',
      });
      expect(result.name).toBe('새과제');
    });
  });

  describe('softDelete', () => {
    it('should change status to COMPLETED', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({
        id: '1',
        name: '삭제대상',
        status: 'ACTIVE',
      } as never);
      mockPrisma.workItem.count.mockResolvedValueOnce(0);
      mockPrisma.project.update.mockResolvedValueOnce({
        id: '1',
        name: '삭제대상',
        status: 'COMPLETED',
      } as never);

      const result = await service.softDelete('1');
      expect(result.status).toBe('COMPLETED');
    });

    it('should warn if work items exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValueOnce({
        id: '1',
        name: '사용중',
        status: 'ACTIVE',
      } as never);
      mockPrisma.workItem.count.mockResolvedValueOnce(5);
      mockPrisma.project.update.mockResolvedValueOnce({
        id: '1',
        status: 'COMPLETED',
      } as never);

      const result = await service.softDelete('1');
      expect(result._warning).toContain('5건');
    });
  });
});
