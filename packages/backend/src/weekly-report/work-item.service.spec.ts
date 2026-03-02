import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { WorkItemService } from './work-item.service';
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '../common/filters/business-exception';
import { ReportStatus } from '@prisma/client';

const mockReport = {
  id: 'report-1',
  memberId: 'member-1',
  status: ReportStatus.DRAFT,
};

const mockWorkItem = {
  id: 'item-1',
  weeklyReportId: 'report-1',
  projectId: 'proj-1',
  doneWork: '진행업무',
  planWork: '예정업무',
  remarks: '',
  sortOrder: 0,
  weeklyReport: mockReport,
  project: { id: 'proj-1', name: '테스트프로젝트' },
};

const mockProject = {
  id: 'proj-1',
  name: '테스트프로젝트',
  status: 'ACTIVE',
};

const mockPrisma = {
  workItem: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(mockWorkItem)),
    update: mock(() => Promise.resolve(mockWorkItem)),
    delete: mock(() => Promise.resolve(mockWorkItem)),
    aggregate: mock(() => Promise.resolve({ _max: { sortOrder: -1 } })),
    count: mock(() => Promise.resolve(0)),
  },
  weeklyReport: {
    findUnique: mock(() => Promise.resolve(mockReport)),
  },
  project: {
    findUnique: mock(() => Promise.resolve(mockProject)),
  },
  $transaction: mock((ops: Promise<unknown>[]) => Promise.all(ops)),
};

describe('WorkItemService', () => {
  let service: WorkItemService;

  beforeEach(() => {
    service = new WorkItemService(mockPrisma as never);
    mockPrisma.workItem.findMany.mockReset();
    mockPrisma.workItem.findUnique.mockReset();
    mockPrisma.workItem.create.mockReset();
    mockPrisma.workItem.update.mockReset();
    mockPrisma.workItem.delete.mockReset();
    mockPrisma.workItem.aggregate.mockReset();
    mockPrisma.weeklyReport.findUnique.mockReset();
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);
  });

  describe('create', () => {
    it('should create a work item', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce(mockReport);
      mockPrisma.workItem.aggregate.mockResolvedValueOnce({ _max: { sortOrder: -1 } });
      mockPrisma.workItem.create.mockResolvedValueOnce(mockWorkItem);

      const result = await service.create('report-1', 'member-1', {
        projectId: 'proj-1',
        doneWork: '진행',
        planWork: '예정',
      });
      expect(result.id).toBe('item-1');
    });

    it('should throw if report is submitted', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce({
        ...mockReport,
        status: ReportStatus.SUBMITTED,
      });

      try {
        await service.create('report-1', 'member-1', {
          projectId: 'proj-1',
          doneWork: '',
          planWork: '',
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('WEEKLY_REPORT_SUBMITTED');
      }
    });

    it('should throw FORBIDDEN if not owner', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce({
        ...mockReport,
        memberId: 'other-member',
      });

      try {
        await service.create('report-1', 'member-1', {
          projectId: 'proj-1',
          doneWork: '',
          planWork: '',
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).getStatus()).toBe(HttpStatus.FORBIDDEN);
      }
    });

    it('should throw PROJECT_INACTIVE if project is inactive', async () => {
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce(mockReport);
      mockPrisma.project.findUnique.mockResolvedValueOnce({
        ...mockProject,
        status: 'INACTIVE',
      } as never);

      try {
        await service.create('report-1', 'member-1', {
          projectId: 'proj-1',
          doneWork: '',
          planWork: '',
        });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('PROJECT_INACTIVE');
        expect((e as BusinessException).getStatus()).toBe(422);
      }
    });
  });

  describe('update', () => {
    it('should update work item', async () => {
      mockPrisma.workItem.findUnique.mockResolvedValueOnce(mockWorkItem);
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce(mockReport);
      mockPrisma.workItem.update.mockResolvedValueOnce({
        ...mockWorkItem,
        doneWork: '수정된 내용',
      });

      const result = await service.update('item-1', 'member-1', { doneWork: '수정된 내용' });
      expect(result.doneWork).toBe('수정된 내용');
    });

    it('should throw if work item not found', async () => {
      mockPrisma.workItem.findUnique.mockResolvedValueOnce(null);

      try {
        await service.update('nonexistent', 'member-1', { doneWork: '수정' });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('WORK_ITEM_NOT_FOUND');
      }
    });

    it('should throw if report is submitted', async () => {
      mockPrisma.workItem.findUnique.mockResolvedValueOnce(mockWorkItem);
      mockPrisma.weeklyReport.findUnique.mockResolvedValueOnce({
        ...mockReport,
        status: ReportStatus.SUBMITTED,
      });

      try {
        await service.update('item-1', 'member-1', { doneWork: '수정' });
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(BusinessException);
        expect((e as BusinessException).errorCode).toBe('WEEKLY_REPORT_SUBMITTED');
      }
    });
  });

  describe('delete', () => {
    it('should delete work item', async () => {
      mockPrisma.workItem.findUnique.mockResolvedValueOnce(mockWorkItem);
      mockPrisma.workItem.delete.mockResolvedValueOnce(mockWorkItem);

      const result = await service.delete('item-1', 'member-1');
      expect(result.deleted).toBe(true);
    });
  });
});
